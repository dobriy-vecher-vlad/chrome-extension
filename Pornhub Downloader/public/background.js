(async() => {
	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		switch (message.action) {
			case 'getTabId': {
				sendResponse({ tabId: sender.tab.id });
			}
			case 'progress': {
				if (typeof message.percent !== 'number' || typeof message.tabId !== 'number') return;
				chrome.action.setBadgeText({
					text: message.percent + '%',
					tabId: message.tabId,
				});
				chrome.action.setBadgeBackgroundColor({
					color: '#FF9000',
					tabId: message.tabId,
				});
			}
		}
	});
})();