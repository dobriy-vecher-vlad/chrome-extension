const puppeteer = require('puppeteer');
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
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer.trim()); }));
}

function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*]+/g, '').trim();
}

function sanitizeAuthor(author) {
  return author.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');
}

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

async function addThumbnail(videoPath, coverPath) {
  const tempPath = path.join(path.dirname(videoPath), 'temp_' + path.basename(videoPath));
  await new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .input(coverPath)
      .outputOptions(['-map', '0', '-map', '1', '-c', 'copy', '-c:v:1', 'png', '-disposition:v:1', 'attached_pic'])
      .save(tempPath)
      .on('end', () => resolve())
      .on('error', reject);
  });
  fs.renameSync(tempPath, videoPath);
  if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
}

function renderBar(percent, width = 32) {
  const filled = Math.round(width * percent / 100);
  const empty = width - filled;
  return chalk.hex('#FF9000')('▬'.repeat(filled)) + chalk.gray('-'.repeat(empty));
}

async function fetchVideoData(videoUrl) {
  console.log(chalk.gray('\nЗапускаю headless браузер'));

  const browser = await puppeteer.launch({
    headless: 'new',
    protocolTimeout: 1200000, // 20 минут в миллисекундах (можно поставить 0, чтобы полностью отключить)
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox', 
      '--disable-blink-features=AutomationControlled'
    ],
  });

  const page = await browser.newPage();

  const userAgentStr = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';
  await page.setUserAgent(userAgentStr);

  await page.setExtraHTTPHeaders({
    'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    'sec-ch-ua': '"Google Chrome";v="149", "Chromium";v="149", "Not)A;Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
  });

  console.log(chalk.gray('Браузер запущен, открываю страницу видео'));

  await page.goto(videoUrl, {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  console.log(chalk.gray('Страница загружена, ожидаю инициализацию плеера'));

  const currentHost = new URL(videoUrl).host;
  await page.setCookie(
    { name: 'accessAgeDisclaimerPH', value: '1', domain: '.' + currentHost.split('.').slice(-2).join('.') },
    { name: 'age_verified', value: '1', domain: '.' + currentHost.split('.').slice(-2).join('.') },
    { name: 'platform', value: 'pc', domain: '.' + currentHost.split('.').slice(-2).join('.') }
  );

  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('phncdn.com')) {
      const headers = request.headers();
      headers['referer'] = `https://${currentHost}/`;
      headers['origin'] = `https://${currentHost}`;
      headers['sec-fetch-site'] = 'cross-site';
      headers['sec-fetch-mode'] = 'no-cors';
      headers['sec-fetch-dest'] = 'video';
      request.continue({ headers });
    } else {
      request.continue();
    }
  });

  await page.waitForSelector('#player', { timeout: 60000 });

  console.log(chalk.gray('Выполняю JS страницы'));

  const result = await page.evaluate(async (currentHost, userAgentStr) => {
    const getFormatFromBytes = (bytes, decimals = 2) => {
      if (!+bytes) return '0 Bytes';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const videoId = document.querySelector('#player')?.getAttribute('data-video-id') || null;
    const author =
      document.querySelector('.userInfo .usernameBadgesWrapper .bolded')?.innerText ||
      document.querySelector('.userInfo .bolded')?.innerText ||
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
    let qualities = mediaDefs.filter(m => m.format === 'mp4' && m.videoUrl && m.videoUrl.startsWith('https://'));
    const remote = mediaDefs.find(m => m.remote);

    if (remote) {
      try {
        const res = await fetch(remote.videoUrl);
        const json = await res.json();
        qualities = json.filter(d => d.format === 'mp4');
      } catch {}
    }

    // Запрос размера файла из контекста браузера
    for (let q of qualities) {
      try {
        const response = await fetch(q.videoUrl, {
          method: 'HEAD', // HEAD быстрее, чтобы не качать тело
          headers: {
            'referer': `https://${currentHost}/`,
            'user-agent': userAgentStr
          }
        });
        const len = response.headers.get('content-length');
        q.sizeText = len ? getFormatFromBytes(parseInt(len)) : '?';
      } catch {
        q.sizeText = '?';
      }
    }

    return { videoId, author, duration, qualities, image };
  }, currentHost, userAgentStr);

  // Получаем обложку
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
        resolve(canvas.toDataURL('image/jpeg'));
      };
      img.onerror = reject;
      img.src = url;
    });
  }, result.image);
  const base64Data = imageBase64.replace(/^data:image\/jpeg;base64,/, '');

  console.log(chalk.gray('Ссылки на качества получены'));

  return { ...result, image: base64Data, page, browser };
}

// Потоковое скачивание частями через контекст браузера (решает проблему 474 и ОЗУ)
async function downloadFileInBrowser(page, url, referer, filename) {
  const videoHost = new URL(referer || url).host;
  const writer = fs.createWriteStream(filename);

  // 1. Сначала узнаем точный размер файла из браузера
  const totalBytes = await page.evaluate(async (downloadUrl, host) => {
    const res = await fetch(downloadUrl, { method: 'HEAD', headers: { 'referer': `https://${host}/` } });
    return parseInt(res.headers.get('content-length'), 10) || 0;
  }, url, videoHost);

  if (!totalBytes) {
    throw new Error('Не удалось определить размер видеофайла через браузер.');
  }

  // Настройка прослушивания чанков из браузера в Node.js
  // Создаем уникальное имя функции обратного вызова для текущего потока
  const exposeName = 'onChunkReceived_' + Date.now();
  let downloaded = 0;
  const start = Date.now();
  const barWidth = 20;
  let maxLineLength = 0;

  await page.exposeFunction(exposeName, (base64Chunk) => {
    const buffer = Buffer.from(base64Chunk, 'base64');
    writer.write(buffer);
    downloaded += buffer.length;

    const percent = (downloaded / totalBytes) * 100;
    const elapsed = (Date.now() - start) / 1000;
    const speed = downloaded / elapsed;
    const bar = renderBar(percent, barWidth);

    let line =
      `${bar} ${chalk.white(percent.toFixed(1) + '%')} — ` +
      `${chalk.white(formatBytes(downloaded))} из ${chalk.white(formatBytes(totalBytes))} ` +
      `со скоростью ${chalk.hex('#FF9000')((speed / 1024 / 1024).toFixed(2) + ' MB/с')}`;

    if (line.length > maxLineLength) maxLineLength = line.length;
    line = line.padEnd(maxLineLength, ' ');

    process.stdout.cursorTo(0);
    process.stdout.write(line);
  });

  // 2. Запускаем пошаговый цикл скачивания внутри браузера segments по 5 Мегабайт
  try {
    await page.evaluate(async (downloadUrl, host, callbackName, total) => {
      const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
      let startByte = 0;

      while (startByte < total) {
        const endByte = Math.min(startByte + CHUNK_SIZE - 1, total - 1);
        
        const response = await fetch(downloadUrl, {
          method: 'GET',
          headers: {
            'accept': '*/*',
            'range': `bytes=${startByte}-${endByte}`,
            'referer': `https://${host}/`,
            'sec-fetch-dest': 'video',
            'sec-fetch-mode': 'no-cors',
            'sec-fetch-site': 'cross-site'
          }
        });

        if (!response.ok && response.status !== 206) {
          throw new Error(`Ошибка сегмента ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        
        // Быстрая конвертация чанка в base64 string
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Str = window.btoa(binary);

        // Отправляем чанк в Node.js
        await window[callbackName](base64Str);

        startByte += CHUNK_SIZE;
      }
    }, url, videoHost, exposeName, totalBytes);

    writer.end();
    console.log('\n');
  } catch (err) {
    writer.end();
    throw err;
  }
}

async function main() {
  console.clear();
  console.log(chalk.hex('#FF9000')(`▄▄▄▄   ▄▄▄  ▄▄▄▄  ▄▄  ▄▄ ▄▄ ▄▄ ▄▄ ▄▄ ▄▄▄▄  
██▄█▀ ██▀██ ██▄█▄ ███▄██ ██▄██ ██ ██ ██▄██ 
██    ▀███▀ ██ ██ ██ ▀██ ██ ██ ▀███▀ ██▄█▀ `));
  console.log(chalk.hex('#FF9000')(`▄▄▄▄   ▄▄▄  ▄▄   ▄▄ ▄▄  ▄▄ ▄▄     ▄▄▄   ▄▄▄  ▄▄▄▄  ▄▄▄▄▄ ▄▄▄▄  
██▀██ ██▀██ ██ ▄ ██ ███▄██ ██    ██▀██ ██▀██ ██▀██ ██▄▄  ██▄█▄ 
████▀ ▀███▀  ▀█▀█▀  ██ ▀██ ██▄▄▄ ▀███▀ ██▀██ ████▀ ██▄▄▄ ██ ██ \n`));

  const isBatch = process.argv.includes('--batch');

  if (isBatch) {
    const listPath = path.join(__dirname, 'list.txt');
    if (!fs.existsSync(listPath)) {
      console.log(chalk.red('list.txt не найден!'));
      process.exit(1);
    }

    const content = fs.readFileSync(listPath, 'utf8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

    for (let i = 0; i < lines.length; i++) {
      let url = lines[i];
      let requestedQuality = null;

      const parts = url.split(/\s+/);
      if (parts.length > 1) {
        const last = parts.pop();
        if (/^\d+$/.test(last) || /^\d+p$/i.test(last)) {
          requestedQuality = last.replace(/p$/i, '');
          url = parts.join(' ');
        }
      }

      console.log(chalk.white(`[${i + 1}/${lines.length}] Обрабатываю ссылку: ${url}`));

      try {
        const result = await fetchVideoData(url);
        if (!result || !result.qualities?.length) {
          console.log(chalk.red('Не удалось получить качества'));
          if (result?.browser) await result.browser.close();
          continue;
        }

        const { videoId, author, duration, qualities, image, page, browser } = result;
        const filename = sanitizeFilename(`${sanitizeAuthor(author)} (${videoId})`) + '.mp4';

        console.log(chalk.hex('#FF9000')(`\n${author}, ${duration}\n`));

        qualities.forEach((q, i) => {
          console.log(chalk.gray(`${i + 1}.`) + ` ${q.quality} — ${chalk.hex('#FF9000')(q.sizeText)}`);
        });

        let selected;
        if (requestedQuality) {
          const reqNum = parseInt(requestedQuality);
          selected = qualities.find(q => parseInt(q.quality) === reqNum);
        }
        if (!selected) {
          selected = qualities.reduce((a, b) => (parseInt(a.quality) || 0) > (parseInt(b.quality) || 0) ? a : b);
        }
        console.log(chalk.white(`\nАвтовыбор качества: ${selected.quality}`));

        console.log(chalk.gray('\nНачинаю загрузку\n'));

        const videoPath = path.join(DOWNLOAD_DIR, filename);
        await downloadFileInBrowser(page, selected.videoUrl, url, videoPath);

        const coverFilename = sanitizeFilename(`${sanitizeAuthor(author)} (${videoId})`) + '.png';
        const coverPath = path.join(DOWNLOAD_DIR, coverFilename);
        fs.writeFileSync(coverPath, Buffer.from(image, 'base64'));

        await addThumbnail(videoPath, coverPath);
        await browser.close();
        console.log(`\n`);
      } catch (err) {
        console.error(chalk.red(err.message));
      }
    }
  } else {
    const videoUrl = await ask(chalk.white('Вставь ссылку на видео: '));

    try {
      const result = await fetchVideoData(videoUrl);
      if (!result || !result.qualities?.length) {
        console.log(chalk.red('Не удалось получить список качества'));
        if (result?.browser) await result.browser.close();
        process.exit(1);
      }

      const { videoId, author, duration, qualities, image, page, browser } = result;
      const filename = sanitizeFilename(`${sanitizeAuthor(author)} (${videoId})`) + '.mp4';

      console.log(chalk.hex('#FF9000')(`\n${author}, ${duration}\n`));

      qualities.forEach((q, i) => {
        console.log(chalk.gray(`${i + 1}.`) + ` ${q.quality} — ${chalk.hex('#FF9000')(q.sizeText)}`);
      });

      const choice = await ask(chalk.white('\nВыбери качество: '));
      const index = parseInt(choice) - 1;

      if (!qualities[index]) {
        console.log(chalk.red('Неверный выбор'));
        await browser.close();
        process.exit(1);
      }

      const selected = qualities[index];
      console.log(chalk.gray('\nНачинаю загрузку\n'));

      const videoPath = path.join(DOWNLOAD_DIR, filename);
      await downloadFileInBrowser(page, selected.videoUrl, videoUrl, videoPath);

      const coverFilename = sanitizeFilename(`${sanitizeAuthor(author)} (${videoId})`) + '.png';
      const coverPath = path.join(DOWNLOAD_DIR, coverFilename);
      fs.writeFileSync(coverPath, Buffer.from(image, 'base64'));

      await addThumbnail(videoPath, coverPath);
      await browser.close();
    } catch (e) {
      console.error(chalk.red('Произошла ошибка: ' + e.message));
      process.exit(1);
    }
  }
}

main().catch(err => {
  console.error(chalk.red(err));
  process.exit(1);
});