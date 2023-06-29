chrome.declarativeNetRequest.updateDynamicRules({
	addRules: [{
		id: 1001,
		priority: 1,
		action: {
			type: "redirect",
			redirect: {
				regexSubstitution: "https://yt4.ggpht.com\\1",
			},
		},
		condition: {
			regexFilter: "^https://yt3.ggpht.com(.*)",
			resourceTypes: [
				"csp_report",
				"font",
				"image",
				"main_frame",
				"media",
				"object",
				"other",
				"ping",
				"script",
				"stylesheet",
				"sub_frame",
				"webbundle",
				"websocket",
				"webtransport",
				"xmlhttprequest",
			],
		},
	}],
	removeRuleIds: [1001],
});