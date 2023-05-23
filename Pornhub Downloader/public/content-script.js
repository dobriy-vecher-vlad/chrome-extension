(async() => {
	if (!window.location.href.includes('.pornhub.com/view_video.php?viewkey=')) return;
	const getFormatFromBytes = (bytes, decimals = 2) => {
		if (!+bytes) return '0 Bytes'
		const k = 1024
		const dm = decimals < 0 ? 0 : decimals
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
	}
	chrome.runtime.onMessage.addListener((url, sender, sendResponse) => {
		(async() => {
			let links = [];
			try {
				const request = await (await fetch(url))?.json();
				for (const link of request) {
					await fetch(link.videoUrl).then(response => links.push({
						link: link.videoUrl,
						quality: Number(link.quality),
						size: getFormatFromBytes(response.headers.get('content-length'))
					}))
				}
			} catch (error) {
				links = [];
			}
			sendResponse(links);
		})();
		return true;
	});
})();