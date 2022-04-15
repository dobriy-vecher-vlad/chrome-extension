chrome.runtime.onMessage.addListener(
	function(to, sender, onSuccess) {
		fetch(to.link, {
			headers: {
				"accept": "*/*",
				"content-type": "application/x-www-form-urlencoded; charset=UTF-8",
			},
			"body": to.body,
			"method": "POST",
			"mode": "cors"
		}).then(data => data.text()).then(data => onSuccess(data)).catch(error => onSuccess(null));
		return true;
	}
);