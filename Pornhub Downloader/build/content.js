(async() => {
	const getFormatFromBytes = (bytes, decimals = 2) => {
		if (!+bytes) return '0 Bytes';
		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
	}
	let writable;
	let port;
	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		(async () => {
			switch (message.action) {
				case 'getLinks': {
					try {
						const response = await fetch(message.url);
						const json = await response.json();
						const links = json.map(link => ({
							link: link.videoUrl,
							quality: Number(link.quality),
							size: null,
						}));
						sendResponse({ success: true, data: links });
					} catch (error) {
						sendResponse({ success: false, error: error.message });
					}
					break;
				}
				case 'getSize': {
					try {
						const response = await fetch(message.link);
						const size = response.headers.get('content-length');
						sendResponse({
							success: true,
							data: getFormatFromBytes(size),
						});
					} catch (error) {
						sendResponse({ success: false, error: error.message });
					}
					break;
				}
				case 'download': {
					try {
						const tab = await chrome.runtime.sendMessage({ action: 'getTabId' });
						const handle = await window.showSaveFilePicker({
							suggestedName: message.filename,
						});
						const writable = await handle.createWritable();
						const res = await fetch(message.link);
						const reader = res.body.getReader();
						const total = +res.headers.get('content-length') || 0;
						let received = 0;
						const startTime = Date.now();
						while (true) {
							const { done, value } = await reader.read();
							if (done) break;
							await writable.write(value);
							received += value.length;
							const percent = Math.floor((received / total) * 100);
							const elapsed = (Date.now() - startTime) / 1000;
							const speed = (received / 1024 / 1024 / elapsed).toFixed(2);
							const receivedMB = (received / 1024 / 1024).toFixed(2);
							const totalMB = (total / 1024 / 1024).toFixed(2);
							document.title = percent + '% | ' + receivedMB + ' MB из ' + totalMB + ' MB со скоростью ' + speed + ' MB/с';
							chrome.runtime.sendMessage({
								action: 'progress',
								percent: percent,
								tabId: tab.tabId,
							});
						}
						await writable.close();
						sendResponse({ success: true });
					} catch (error) {
						sendResponse({ success: false, error: error.message });
					}
					break;
				}
				default:
					sendResponse({ success: false, error: 'Unknown action' });
			}
		})();
		return true;
	});
})();