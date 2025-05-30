import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import {
	AdaptivityProvider,
	ConfigProvider,
	AppRoot,
	SplitLayout,
	PanelHeader,
	Panel,
	Placeholder,
	Spinner,
	Cell,
	List,
	Image,
	ButtonGroup,
	IconButton,
	Snackbar,
	Avatar,
	Counter,
	Separator,
	Spacing,
} from '@vkontakte/vkui';
import {  Icon16Done, Icon24CopyOutline, Icon24DownloadOutline, Icon56VideoOutline } from '@vkontakte/icons';
import '@vkontakte/vkui/dist/vkui.css';
import './style.css';

const saveFile = (url, filename = '') => {
	if (!chrome?.downloads) return false;
	chrome.downloads.download({
		url,
		filename,
	})
};
const copyFile = (text) => {
	const element = document.createElement('textarea');
	element.style.position = 'fixed';
	element.style.top = 0;
	element.style.left = 0;
	element.style.width = '2em';
	element.style.height = '2em';
	element.style.padding = 0;
	element.style.border = 'none';
	element.style.outline = 'none';
	element.style.boxShadow = 'none';
	element.style.background = 'transparent';
	element.value = text;
	document.body.appendChild(element);
	element.focus();
	element.select();
	try {
		document.execCommand('copy');
	} catch (error) { }
	document.body.removeChild(element);
};

const App = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [video, setVideo] = useState(undefined);
	const [snackbar, setSnackbar] = useState(null);
	const quality = {
		720: 'HD',
		1080: 'FHD',
	};
	useEffect(() => {
		const open = async() => {
			if (!chrome?.tabs) return setVideo(false);
			const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
			if (tab?.url?.includes('/view_video.php?viewkey=')) {
				const video = {};
				const documentElement = await chrome.scripting.executeScript({
					target: { tabId: tab.id },
					func: () => document.documentElement.outerHTML,
				}).then((document) => new DOMParser().parseFromString(document[0].result, 'text/html'));
				try {
					video.author = documentElement.querySelector('.userInfo .usernameBadgesWrapper .bolded').innerText;
				} catch (error) {
					video.author = documentElement.querySelector('.userInfo .bolded').innerText;
				}
				video.categories = [...documentElement.querySelectorAll('.categoriesWrapper > a')]?.map(tag => tag.innerText) || false;
				video.tags = [...documentElement.querySelectorAll('.tagsWrapper > a')]?.map(tag => tag.innerText) || false;
				video.id = documentElement.querySelector('#player').getAttribute('data-video-id');
				const data = await new Promise((resolve, reject) => {
					try {
						const getData = (event) => {
							window.removeEventListener('message', getData);
							resolve(event?.data || undefined);
						};
						window.addEventListener('message', getData);
						const stringFunction = `var playerObjList = {};\n${documentElement.querySelector('#player >script:nth-child(2)')?.innerHTML || documentElement.querySelector('#player >script:nth-child(1)')?.innerHTML}`;
						document.getElementById('sandbox').contentWindow.postMessage(stringFunction + `\neval(${stringFunction.match('flashvars_[0-9]{1,}')[0]});`, '*');
					} catch (error) {
						reject(undefined);
					}
				});
				if (data?.mediaDefinitions) {
					video.id = data.playbackTracking.video_id;
					video.title = data.video_title;
					video.image = data.image_url;
					video.duration = Math.floor(data.video_duration/60) + ':' + data.video_duration%60;
					chrome.tabs.sendMessage(tab.id, data.mediaDefinitions.find(media => media.format == 'mp4').videoUrl, (links) => {
						if (links?.length) {
							video.links = links;
							setVideo(video);
							for (const link of video.links) {
								chrome.tabs.sendMessage(tab.id, link, (size) => {
									link.size = size;
									setVideo({...video});
								});
							}
						} else {
							setVideo(true);
						}
					});
				} else {
					setVideo([]);
				}
			} else {
				setVideo(false);
			}
		};
		setTimeout(() => open(), 1000);
	}, []);
	useEffect(() => setIsLoading(video == undefined), [video]);
	return (
		<ConfigProvider platform='ios' appearance='dark'>
			<AdaptivityProvider>
				<AppRoot>
					<SplitLayout>
						<Panel>
							<PanelHeader fixed={false}>
								<svg width="236" height="28" viewBox="0 0 236 28" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M49.3585 4C49.3585 1.79086 51.1473 0 53.3539 0H91.3097C93.5163 0 95.305 1.79086 95.305 4V24C95.305 26.2091 93.5163 28 91.3097 28H53.3539C51.1473 28 49.3585 26.2091 49.3585 24V4Z" fill="#FF9000"/>
									<path d="M0 22V6.49H5.53755C6.68022 6.49 7.69837 6.71733 8.592 7.172C9.48562 7.62667 10.1815 8.25733 10.6796 9.064C11.1923 9.87067 11.4487 10.7947 11.4487 11.836C11.4487 12.8627 11.1923 13.7793 10.6796 14.586C10.1815 15.3927 9.4783 16.0307 8.57002 16.5C7.6764 16.9547 6.66557 17.182 5.53755 17.182H3.07642V22H0ZM5.53755 14.432C6.38723 14.432 7.06111 14.1973 7.5592 13.728C8.05729 13.244 8.30633 12.6133 8.30633 11.836C8.30633 11.0587 8.05729 10.4353 7.5592 9.966C7.06111 9.482 6.38723 9.24 5.53755 9.24H3.07642V14.432H5.53755Z" fill="white"/>
									<path d="M18.452 22.22C17.2507 22.22 16.174 21.9633 15.2217 21.45C14.2842 20.9367 13.5444 20.2327 13.0023 19.338C12.4749 18.4287 12.2113 17.3947 12.2113 16.236C12.2113 15.0773 12.4749 14.0507 13.0023 13.156C13.5444 12.2467 14.2842 11.5353 15.2217 11.022C16.174 10.5087 17.2507 10.252 18.452 10.252C19.6533 10.252 20.73 10.5087 21.6822 11.022C22.6345 11.5353 23.3743 12.2467 23.9016 13.156C24.429 14.0507 24.6927 15.0773 24.6927 16.236C24.6927 17.3947 24.429 18.4287 23.9016 19.338C23.3743 20.2327 22.6345 20.9367 21.6822 21.45C20.73 21.9633 19.6533 22.22 18.452 22.22ZM18.452 19.514C19.3896 19.514 20.144 19.2133 20.7154 18.612C21.3013 17.996 21.5943 17.204 21.5943 16.236C21.5943 15.268 21.3013 14.4833 20.7154 13.882C20.144 13.266 19.3896 12.958 18.452 12.958C17.5144 12.958 16.7526 13.266 16.1666 13.882C15.5953 14.4833 15.3096 15.268 15.3096 16.236C15.3096 17.204 15.5953 17.996 16.1666 18.612C16.7526 19.2133 17.5144 19.514 18.452 19.514Z" fill="white"/>
									<path d="M26.7547 22V10.472H29.062L29.5235 12.078C29.9337 11.4327 30.4025 11.0073 30.9299 10.802C31.4572 10.582 32.0945 10.472 32.8416 10.472H33.2591L33.5228 13.31H31.8088C31.1056 13.31 30.5783 13.464 30.2267 13.772C29.8897 14.08 29.7213 14.5787 29.7213 15.268V22H26.7547Z" fill="white"/>
									<path d="M35.038 22V10.472H37.3454L37.8508 12.166C38.2317 11.5793 38.7224 11.1173 39.323 10.78C39.9383 10.428 40.5902 10.252 41.2788 10.252C42.0992 10.252 42.8463 10.4647 43.5202 10.89C44.194 11.3007 44.7214 11.88 45.1023 12.628C45.4979 13.3613 45.6956 14.1827 45.6956 15.092V22H42.7291V15.488C42.7291 14.7253 42.5093 14.102 42.0699 13.618C41.6304 13.134 41.0664 12.892 40.3778 12.892C39.66 12.892 39.0813 13.134 38.6418 13.618C38.217 14.0873 38.0046 14.7107 38.0046 15.488V22H35.038Z" fill="white"/>
									<path d="M52.8285 22V6.49H55.795V11.924C56.1759 11.4107 56.6594 11.0073 57.2454 10.714C57.8313 10.406 58.4393 10.252 59.0692 10.252C59.8896 10.252 60.6367 10.4647 61.3106 10.89C61.9845 11.3007 62.5119 11.88 62.8928 12.628C63.2883 13.3613 63.4861 14.1827 63.4861 15.092V22H60.5195V15.488C60.5195 14.7253 60.2998 14.102 59.8603 13.618C59.4208 13.134 58.8568 12.892 58.1683 12.892C57.4505 12.892 56.8718 13.134 56.4323 13.618C56.0075 14.0873 55.795 14.7107 55.795 15.488V22H52.8285Z" fill="black"/>
									<path d="M70.3504 22.22C69.5446 22.22 68.8048 22.0147 68.1309 21.604C67.4717 21.1787 66.9516 20.5993 66.5707 19.866C66.1899 19.118 65.9994 18.2893 65.9994 17.38V10.472H68.966V16.984C68.966 17.7467 69.1784 18.37 69.6032 18.854C70.0427 19.338 70.5994 19.58 71.2733 19.58C71.9618 19.58 72.5185 19.3453 72.9433 18.876C73.3682 18.392 73.5806 17.7613 73.5806 16.984V10.472H76.5471V22H74.2398L73.7344 20.284C73.3682 20.8707 72.8774 21.34 72.2621 21.692C71.6615 22.044 71.0242 22.22 70.3504 22.22Z" fill="black"/>
									<path d="M86.5374 22.22C85.5998 22.22 84.7502 22.022 83.9884 21.626C83.2413 21.2153 82.648 20.7387 82.2085 20.196L81.6811 22H79.3738V6.49H82.3403V12.122C82.8091 11.6087 83.4024 11.1687 84.1202 10.802C84.8381 10.4353 85.6438 10.252 86.5374 10.252C87.6215 10.252 88.5884 10.5087 89.4381 11.022C90.2877 11.5353 90.947 12.2467 91.4157 13.156C91.8992 14.0653 92.1409 15.092 92.1409 16.236C92.1409 17.38 91.8992 18.4067 91.4157 19.316C90.947 20.2253 90.2877 20.9367 89.4381 21.45C88.5884 21.9633 87.6215 22.22 86.5374 22.22ZM85.7244 19.58C86.7059 19.58 87.5043 19.2647 88.1196 18.634C88.7349 18.0033 89.0425 17.204 89.0425 16.236C89.0425 15.268 88.7349 14.4687 88.1196 13.838C87.5043 13.2073 86.7059 12.892 85.7244 12.892C84.7282 12.892 83.9151 13.2073 83.2852 13.838C82.6553 14.4687 82.3403 15.268 82.3403 16.236C82.3403 17.204 82.6553 18.0033 83.2852 18.634C83.9151 19.2647 84.7282 19.58 85.7244 19.58Z" fill="black"/>
									<path d="M106.876 22V6.49H112.984C114.523 6.49 115.907 6.82 117.138 7.48C118.368 8.14 119.328 9.05667 120.016 10.23C120.705 11.4033 121.049 12.738 121.049 14.234C121.049 15.73 120.705 17.072 120.016 18.26C119.328 19.4333 118.368 20.35 117.138 21.01C115.907 21.67 114.523 22 112.984 22H106.876ZM112.984 19.184C113.922 19.184 114.757 18.9787 115.49 18.568C116.237 18.1427 116.815 17.556 117.226 16.808C117.636 16.06 117.841 15.202 117.841 14.234C117.841 13.2807 117.636 12.43 117.226 11.682C116.815 10.934 116.237 10.3547 115.49 9.944C114.757 9.51867 113.922 9.306 112.984 9.306H109.952V19.184H112.984Z" fill="#FF9000"/>
									<path d="M128.804 22.22C127.603 22.22 126.526 21.9633 125.574 21.45C124.636 20.9367 123.896 20.2327 123.354 19.338C122.827 18.4287 122.563 17.3947 122.563 16.236C122.563 15.0773 122.827 14.0507 123.354 13.156C123.896 12.2467 124.636 11.5353 125.574 11.022C126.526 10.5087 127.603 10.252 128.804 10.252C130.005 10.252 131.082 10.5087 132.034 11.022C132.986 11.5353 133.726 12.2467 134.254 13.156C134.781 14.0507 135.045 15.0773 135.045 16.236C135.045 17.3947 134.781 18.4287 134.254 19.338C133.726 20.2327 132.986 20.9367 132.034 21.45C131.082 21.9633 130.005 22.22 128.804 22.22ZM128.804 19.514C129.742 19.514 130.496 19.2133 131.067 18.612C131.653 17.996 131.946 17.204 131.946 16.236C131.946 15.268 131.653 14.4833 131.067 13.882C130.496 13.266 129.742 12.958 128.804 12.958C127.866 12.958 127.105 13.266 126.519 13.882C125.947 14.4833 125.662 15.268 125.662 16.236C125.662 17.204 125.947 17.996 126.519 18.612C127.105 19.2133 127.866 19.514 128.804 19.514Z" fill="#FF9000"/>
									<path d="M143.001 22H138.716L135.684 10.472H138.738L140.869 18.986H141.243L143.462 10.472H146.319L148.539 18.986H148.934L151.044 10.472H153.966L150.978 22H146.759L145.067 15.356H144.671L143.001 22Z" fill="#FF9000"/>
									<path d="M155.476 22V10.472H157.783L158.289 12.166C158.67 11.5793 159.16 11.1173 159.761 10.78C160.376 10.428 161.028 10.252 161.717 10.252C162.537 10.252 163.284 10.4647 163.958 10.89C164.632 11.3007 165.159 11.88 165.54 12.628C165.936 13.3613 166.134 14.1827 166.134 15.092V22H163.167V15.488C163.167 14.7253 162.947 14.102 162.508 13.618C162.068 13.134 161.504 12.892 160.816 12.892C160.098 12.892 159.519 13.134 159.08 13.618C158.655 14.0873 158.442 14.7107 158.442 15.488V22H155.476Z" fill="#FF9000"/>
									<path d="M171.814 22H168.848V6.49H171.814V22Z" fill="#FF9000"/>
									<path d="M180.221 22.22C179.019 22.22 177.943 21.9633 176.99 21.45C176.053 20.9367 175.313 20.2327 174.771 19.338C174.244 18.4287 173.98 17.3947 173.98 16.236C173.98 15.0773 174.244 14.0507 174.771 13.156C175.313 12.2467 176.053 11.5353 176.99 11.022C177.943 10.5087 179.019 10.252 180.221 10.252C181.422 10.252 182.499 10.5087 183.451 11.022C184.403 11.5353 185.143 12.2467 185.67 13.156C186.198 14.0507 186.461 15.0773 186.461 16.236C186.461 17.3947 186.198 18.4287 185.67 19.338C185.143 20.2327 184.403 20.9367 183.451 21.45C182.499 21.9633 181.422 22.22 180.221 22.22ZM180.221 19.514C181.158 19.514 181.913 19.2133 182.484 18.612C183.07 17.996 183.363 17.204 183.363 16.236C183.363 15.268 183.07 14.4833 182.484 13.882C181.913 13.266 181.158 12.958 180.221 12.958C179.283 12.958 178.521 13.266 177.935 13.882C177.364 14.4833 177.078 15.268 177.078 16.236C177.078 17.204 177.364 17.996 177.935 18.612C178.521 19.2133 179.283 19.514 180.221 19.514Z" fill="#FF9000"/>
									<path d="M193.402 10.252C194.94 10.252 196.149 10.7213 197.028 11.66C197.906 12.584 198.346 13.8673 198.346 15.51V22H196.083L195.533 20.196C195.211 20.7533 194.728 21.23 194.083 21.626C193.438 22.022 192.684 22.22 191.82 22.22C191.072 22.22 190.399 22.066 189.798 21.758C189.197 21.4353 188.721 20.9953 188.37 20.438C188.033 19.8807 187.864 19.2573 187.864 18.568C187.864 17.468 188.296 16.5953 189.161 15.95C190.04 15.29 191.314 14.96 192.984 14.96H195.357C195.314 14.3147 195.108 13.7867 194.742 13.376C194.376 12.9653 193.878 12.76 193.248 12.76C192.721 12.76 192.274 12.892 191.907 13.156C191.556 13.42 191.3 13.7207 191.138 14.058L188.414 13.596C188.677 12.5547 189.271 11.7407 190.193 11.154C191.116 10.5527 192.186 10.252 193.402 10.252ZM192.633 19.734C193.438 19.734 194.09 19.4773 194.588 18.964C195.086 18.436 195.35 17.798 195.379 17.05H193.094C191.6 17.05 190.853 17.4753 190.853 18.326C190.853 18.7513 191.014 19.096 191.336 19.36C191.658 19.6093 192.091 19.734 192.633 19.734Z" fill="#FF9000"/>
									<path d="M205.914 22.22C204.83 22.22 203.863 21.9633 203.013 21.45C202.164 20.9367 201.497 20.2253 201.014 19.316C200.545 18.4067 200.311 17.38 200.311 16.236C200.311 15.092 200.545 14.0653 201.014 13.156C201.497 12.2467 202.164 11.5353 203.013 11.022C203.863 10.5087 204.83 10.252 205.914 10.252C206.808 10.252 207.613 10.4353 208.331 10.802C209.049 11.1687 209.642 11.6087 210.111 12.122V6.49H213.078V22H210.77L210.243 20.196C209.804 20.7387 209.203 21.2153 208.441 21.626C207.694 22.022 206.852 22.22 205.914 22.22ZM206.727 19.58C207.723 19.58 208.536 19.2647 209.166 18.634C209.796 18.0033 210.111 17.204 210.111 16.236C210.111 15.268 209.796 14.4687 209.166 13.838C208.536 13.2073 207.723 12.892 206.727 12.892C205.746 12.892 204.947 13.2073 204.332 13.838C203.717 14.4687 203.409 15.268 203.409 16.236C203.409 17.204 203.717 18.0033 204.332 18.634C204.947 19.2647 205.746 19.58 206.727 19.58Z" fill="#FF9000"/>
									<path d="M227.376 16.06C227.376 16.3387 227.362 16.654 227.332 17.006H218.279C218.425 17.798 218.777 18.4287 219.334 18.898C219.89 19.3527 220.593 19.58 221.443 19.58C222.029 19.58 222.549 19.47 223.003 19.25C223.457 19.03 223.816 18.7293 224.08 18.348L226.871 18.81C226.49 19.8953 225.779 20.7387 224.739 21.34C223.699 21.9267 222.542 22.22 221.267 22.22C220.11 22.22 219.07 21.9633 218.147 21.45C217.239 20.9367 216.528 20.2253 216.015 19.316C215.503 18.4067 215.246 17.38 215.246 16.236C215.246 15.092 215.503 14.0653 216.015 13.156C216.543 12.2467 217.268 11.5353 218.191 11.022C219.114 10.5087 220.154 10.252 221.311 10.252C222.469 10.252 223.509 10.5087 224.432 11.022C225.355 11.5353 226.072 12.2393 226.585 13.134C227.113 14.014 227.376 14.9893 227.376 16.06ZM221.311 12.738C220.623 12.738 220.022 12.936 219.509 13.332C218.997 13.7133 218.638 14.2267 218.433 14.872H224.146C223.941 14.2413 223.582 13.728 223.069 13.332C222.571 12.936 221.985 12.738 221.311 12.738Z" fill="#FF9000"/>
									<path d="M229.232 22V10.472H231.539L232.001 12.078C232.411 11.4327 232.88 11.0073 233.407 10.802C233.934 10.582 234.572 10.472 235.319 10.472H235.736L236 13.31H234.286C233.583 13.31 233.055 13.464 232.704 13.772C232.367 14.08 232.198 14.5787 232.198 15.268V22H229.232Z" fill="#FF9000"/>
								</svg>
							</PanelHeader>
							{!isLoading ? video ? video.links?.length ? <>
								<Cell
									className='VideoCard'
									disabled
									multiline
									extraSubtitle={(video.tags || video.categories) && (video.tags || video.categories).map((tag, key) => <Counter key={key} size='s' mode='secondary'>{tag}</Counter>)}
									subtitle={<>{video.author}, {video.duration}</>}
									before={<Image src={video.image}/>}
								>
									{video.title}
								</Cell>
								<Separator/>
								<Spacing size={4}/>
								<List>
									{video.links.map((link, key) => <Cell
										className='VideoLink'
										disabled
										key={key}
										after={<>
											<ButtonGroup gap='none'>
												<IconButton onClick={() => {
													copyFile(link.link);
													setSnackbar(<Snackbar onClose={() => setSnackbar(null)} before={<Avatar size={24} style={{ background: '#FF9000' }}><Icon16Done fill='#000' width={14} height={14}/></Avatar>}>Link copied</Snackbar>);
												}}><Icon24CopyOutline/></IconButton>
												<IconButton onClick={() => {
													saveFile(link.link, `${video.author} (${video.id}).mp4`, 'mp4');
													setSnackbar(<Snackbar onClose={() => setSnackbar(null)} before={<Avatar size={24} style={{ background: '#FF9000' }}><Icon16Done fill='#000' width={14} height={14}/></Avatar>}>Upload video started</Snackbar>);
												}}><Icon24DownloadOutline/></IconButton>
											</ButtonGroup>
										</>}
									>
										<span>{link.quality}{Object.keys(quality).includes(String(link.quality)) && <Counter size='s' mode='prominent'>{quality[link.quality]}</Counter>}</span>
										<span className="vkuiSimpleCell__text vkuiSimpleCell__subtitle vkuiFootnote">mp4</span>
										<span className="vkuiSimpleCell__text vkuiSimpleCell__subtitle vkuiFootnote">{link.size ? link.size : <Spinner size='small'/>}</span>
									</Cell>)}
								</List>
							</> : video.length == 0 ? <>
								<Placeholder stretched icon={<Icon56VideoOutline/>}>Couldn't find the sources of this video</Placeholder>
							</> : <>
								<Placeholder stretched icon={<Icon56VideoOutline/>}>Reload the page and try again</Placeholder>
							</> : <>
								<Placeholder stretched icon={<Icon56VideoOutline/>}>This page has no video source</Placeholder>
							</> : <>
								<Placeholder stretched icon={<Spinner size='medium'/>}/>
							</>}
							<iframe src='sandbox.html' id='sandbox' style={{ display: 'none' }}/>
						</Panel>
					</SplitLayout>
				</AppRoot>
				{snackbar}
			</AdaptivityProvider>
		</ConfigProvider>
	);
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);