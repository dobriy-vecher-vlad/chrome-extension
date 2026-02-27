const puppeteer = require('puppeteer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const chalk = require('chalk');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

ffmpeg.setFfmpegPath(ffmpegPath);

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve =>
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*]+/g, '').trim();
}

function sanitizeAuthor(author) {
  return author.toLowerCase().replace(/\s+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');
}

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

async function fetchVideoData(videoUrl) {

  console.log(chalk.gray('\nЗапускаю headless браузер'));

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  );

  console.log(chalk.gray('Браузер запущен, открываю страницу видео'));

  await page.goto(videoUrl, {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  console.log(chalk.gray('Страница загружена, ожидаю инициализацию плеера'));

  await page.waitForSelector('#player', { timeout: 60000 });

  console.log(chalk.gray('Выполняю JS страницы'));

  const result = await page.evaluate(async() => {

    const getFormatFromBytes = (bytes, decimals = 2) => {
      if (!+bytes) return '0 Bytes'
      const k = 1024
      const dm = decimals < 0 ? 0 : decimals
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
    }

    const videoId = document
      .querySelector('#player')
      ?.getAttribute('data-video-id') || null;

    const author =
      document.querySelector('.userInfo .usernameBadgesWrapper .bolded')
        ?.innerText ||
      document.querySelector('.userInfo .bolded')
        ?.innerText ||
      null;

    const playerScript = document.querySelector('#player script')?.innerHTML;
    if (!playerScript) return null;

    const stringFunction = `var playerObjList = {};${playerScript}`;
    const flashvarsMatch = stringFunction.match(/flashvars_[0-9]{1,}/);
    if (!flashvarsMatch) return null;

    const flashvarsName = flashvarsMatch[0];
    const func = new Function(stringFunction + `\nreturn ${flashvarsName};`);
    const data = func();

    const image = data.image_url;

    const durationSeconds = data.video_duration || 0;
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const seconds = durationSeconds % 60;
    const duration = String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');

    let mediaDefs = data.mediaDefinitions || [];

    let qualities = mediaDefs.filter(m =>
      m.format === 'mp4' &&
      m.videoUrl &&
      m.videoUrl.startsWith('https://')
    );

    const remote = mediaDefs.find(m => m.remote);

    if (remote) {
      try {
        const res = await fetch(remote.videoUrl);
        const json = await res.json();
        qualities = json.filter(d => d.format === 'mp4');
      } catch {}
    }

    // 🔥 получаем размер через GET (рабочий способ)
    for (let q of qualities) {
      try {
        const response = await fetch(q.videoUrl);
        const len = response.headers.get('content-length');
        q.sizeText = len
          ? getFormatFromBytes(parseInt(len))
          : '?';
      } catch {
        q.sizeText = '?';
      }
    }

    return { videoId, author, duration, qualities, image };
  });

  const imageBase64 = await page.evaluate((url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const dataUrl = canvas.toDataURL('image/jpeg');
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = url;
    });
  }, result.image);
  const base64Data = imageBase64.replace(/^data:image\/jpeg;base64,/, '');

  await browser.close();

  console.log(chalk.gray('Ссылки на качества получены'));

  return { ...result, image: base64Data };
}

function renderBar(percent, width = 32) {
  const filled = Math.round(width * percent / 100);
  const empty = width - filled;
  // заполненные квадраты — зелёные, пустые — тёмно-серые
  return chalk.hex('#FF9000')('▬'.repeat(filled)) + chalk.gray('-'.repeat(empty));
}

async function downloadFile(url, referer, filename) {

  const res = await axios({
    method: 'get',
    url,
    responseType: 'stream',
    headers: {
      Referer: referer,
      'User-Agent': 'Mozilla/5.0'
    }
  });

  const total = parseInt(res.headers['content-length'], 10);
  let downloaded = 0;
  const start = Date.now();
  const writer = fs.createWriteStream(filename);

  const barWidth = 20; // ширина прогресс-бара
  let maxLineLength = 0; // максимальная длина строки прогресса для padEnd

  res.data.on('data', chunk => {
    downloaded += chunk.length;

    if (!total) return;

    const percent = (downloaded / total) * 100;
    const elapsed = (Date.now() - start) / 1000;
    const speed = downloaded / elapsed;

    const bar = renderBar(percent, barWidth);

    let line =
      `${bar} ${chalk.white(percent.toFixed(1) + '%')} — ` +
      `${chalk.white(formatBytes(downloaded))} ${chalk.white('из')} ${chalk.white(formatBytes(total))} ` +
      `${chalk.white('со скоростью')} ${chalk.hex('#FF9000')((speed / 1024 / 1024).toFixed(2) + ' MB/с')}`;

    // обновляем максимальную длину строки
    if (line.length > maxLineLength) maxLineLength = line.length;

    // заполняем пробелами до maxLineLength, чтобы остатки старой строки не отображались
    line = line.padEnd(maxLineLength, ' ');

    process.stdout.cursorTo(0);
    process.stdout.write(line);
  });

  res.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => {
      console.log('\n');
      resolve();
    });
    writer.on('error', reject);
  });
}

async function main() {

  console.clear();

  console.log(chalk.hex('#FF9000')(`▄▄▄▄   ▄▄▄  ▄▄▄▄  ▄▄  ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄▄▄  
██▄█▀ ██▀██ ██▄█▄ ███▄██ ██▄██ ██ ██ ██▄██ 
██    ▀███▀ ██ ██ ██ ▀██ ██ ██ ▀███▀ ██▄█▀ `));
  console.log(chalk.hex('#FF9000')(`▄▄▄▄   ▄▄▄  ▄▄   ▄▄ ▄▄  ▄▄ ▄▄     ▄▄▄   ▄▄▄  ▄▄▄▄  ▄▄▄▄▄ ▄▄▄▄  
██▀██ ██▀██ ██ ▄ ██ ███▄██ ██    ██▀██ ██▀██ ██▀██ ██▄▄  ██▄█▄ 
████▀ ▀███▀  ▀█▀█▀  ██ ▀██ ██▄▄▄ ▀███▀ ██▀██ ████▀ ██▄▄▄ ██ ██ \n`));

  const videoUrl = await ask(chalk.white('Вставь ссылку на видео: '));

  const result = await fetchVideoData(videoUrl);

  if (!result || !result.qualities?.length) {
    console.log(chalk.red('Не удалось получить список качеств.'));
    process.exit(1);
  }

  const { videoId, author, duration, qualities, image } = result;

  const filename = sanitizeFilename(`${sanitizeAuthor(author)} (${videoId})`) + '.mp4';

  console.log(
    chalk.hex('#FF9000')(`\n${author}, ${duration}\n`)
  );

  qualities.forEach((q, i) => {
    console.log(
      chalk.gray(`${i + 1}.`) + ` ${q.quality} — ${chalk.hex('#FF9000')(q.sizeText)}`
    );
  });

  const choice = await ask(chalk.white('\nВыбери качество: '));
  const index = parseInt(choice) - 1;

  if (!qualities[index]) {
    console.log(chalk.red('Неверный выбор.'));
    process.exit(1);
  }

  const selected = qualities[index];

  console.log(chalk.gray('\nНачинаю загрузку\n'));

  await downloadFile(selected.videoUrl, videoUrl, path.join(DOWNLOAD_DIR, filename));
  const coverFilename = sanitizeFilename(`${sanitizeAuthor(author)} (${videoId})`) + '.png';
  fs.writeFileSync(path.join(DOWNLOAD_DIR, coverFilename), Buffer.from(image, 'base64'));
  await new Promise((resolve, reject) => {
    ffmpeg(path.join(DOWNLOAD_DIR, filename))
      .input(path.join(DOWNLOAD_DIR, coverFilename))
      .outputOptions([
        '-map', '0',
        '-map', '1',
        '-c', 'copy',
        '-c:v:1', 'png',
        '-disposition:v:1', 'attached_pic'
      ])
      .save(path.join(DOWNLOAD_DIR, 'temp_' + filename))
      .on('end', () => resolve())
      .on('error', reject);
  });
  fs.renameSync(path.join(DOWNLOAD_DIR, 'temp_' + filename), path.join(DOWNLOAD_DIR, filename));
  fs.unlinkSync(path.join(DOWNLOAD_DIR, coverFilename));
}

main().catch(err => {
  console.error(chalk.red(err));
  process.exit(1);
});