import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import {
	AdaptivityProvider,
	ConfigProvider,
	AppRoot,
	SplitLayout,
	useAppearance,
} from '@vkontakte/vkui';
import '@vkontakte/vkui/dist/vkui.css';
import './style.css';

import APP from './app';
import MODALS from './modals';
import POPOUTS from './popouts';

Object.defineProperty(Array, 'chunk', {
	value: (array, size) => {
		function* ennumerate(iterable, offset=0) {
			let i = offset;
			for (const item of iterable) {
			yield [i++, item];
			}
		}
		function* chunkor(iterable, size) {
			let chunk = [];
			for (const [index, item] of ennumerate(iterable, 1)) {
				chunk.push(item);
				if (index % size === 0) {
					yield chunk;
					chunk = [];
				}
			}
			if (chunk.length > 0) yield chunk;
		}
		return [...chunkor(array, size)];
	},
});
const islocalStorage = (() => {
	try {
		localStorage.setItem('islocalStorage', 'islocalStorage');
		localStorage.removeItem('islocalStorage');
		return true;
	} catch(e) {
		return false;
	}
})();
const saveFile = (data, name = '', type = '') => {
	const input = document.createElement('a');
	const file = new Blob([data], {type});
	input.href = URL.createObjectURL(file);
	input.download = name;
	input.click();
};
const readFile = (onRead = (file) => {}, accept = '', type = '') => {
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = accept;
	input.click();
	input.onchange = (event) => {
		const file = event?.target?.files?.[0] || false;
		if (!FileReader || !file || !file.type.startsWith(type)) return;
		const fileReader = new FileReader();
		fileReader.onload = () => onRead(fileReader.result);
		type.includes('image') ? fileReader.readAsDataURL(file) : fileReader.readAsText(file);
	};
};
const resizeImage = async(props) => {
	const {
		base64,
		width = 536,
		height = 348,
		ratioX = width / height,
		ratioY = height / width,
	} = props || {};
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');
	const image = await new Promise((resolve, reject) => {
		const image = new Image()
		image.onload = () => resolve(image);
		image.onerror = reject;
		image.src = base64;
	});
	canvas.width = width;
	canvas.height = canvas.width * ratioY;
	const ratio = Math.max((canvas.width / image.width), (canvas.height / image.height));
	context.clearRect(0, 0, canvas.width, canvas.height);
	context.drawImage(image, 0, 0, image.width, image.height, (canvas.width - image.width * ratio) / 2, (canvas.height - image.height * ratio ) / 2, image.width * ratio, image.height * ratio);
	return canvas.toDataURL('image/jpeg', 0.95);
};
const selectImage = (onChange = () => {}, width = undefined, height = undefined) => readFile(async(file) => onChange(await resizeImage({ base64: file, width, height })), 'image/png, image/jpeg, image/jpg', 'image/');
const lightnessImage = async(base64) => {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');
	const image = await new Promise((resolve, reject) => {
		const image = new Image()
		image.onload = () => resolve(image);
		image.onerror = reject;
		image.src = base64;
	});
	canvas.width = image.width;
	canvas.height = image.height;
	context.drawImage(image, 0, 0);
	return Math.floor(Array.chunk(context.getImageData(0, 0, canvas.width, canvas.height).data, 4).map(([r, g, b, a]) => Math.floor((r + g + b) / 3)).reduce((accumulator, current) => accumulator + current, 0) / (image.width * image.height) / (255 / 100));
};

const App = () => {
	const [background, setBackground] = useState((islocalStorage && localStorage.getItem('faves_background')) || false);
	const [backgroundBlur, setBackgroundBlur] = useState((islocalStorage && localStorage.getItem('faves_backgroundBlur')) || 0);
	const appearanceDevice = useAppearance();
	const [appearance, setAppearance] = useState((islocalStorage && localStorage.getItem('faves_appearance')) || 'auto');
	const [appearanceAuto, setAppearanceAuto] = useState('light');
	const [bookmarksSize, setBookmarksSize] = useState((islocalStorage && localStorage.getItem('faves_bookmarksSize')) || 'medium');
	const [bookmarksRounding, setBookmarksRounding] = useState((islocalStorage && localStorage.getItem('faves_bookmarksRounding')) || 16);
	useEffect(() => {
		if (!islocalStorage) return;
		background ? localStorage.setItem('faves_background', background) : localStorage.removeItem('faves_background');
		backgroundBlur ? localStorage.setItem('faves_backgroundBlur', backgroundBlur) : localStorage.removeItem('faves_backgroundBlur');
		appearance ? localStorage.setItem('faves_appearance', appearance) : localStorage.removeItem('faves_appearance');
		bookmarksSize ? localStorage.setItem('faves_bookmarksSize', bookmarksSize) : localStorage.removeItem('faves_bookmarksSize');
		bookmarksRounding ? localStorage.setItem('faves_bookmarksRounding', bookmarksRounding) : localStorage.removeItem('faves_bookmarksRounding');
		setLocalStorageSize(getLocalStorageSize());
	}, [background, backgroundBlur, appearance, bookmarksSize, bookmarksRounding]);
	useEffect(() => {
		background ? (async() => setAppearanceAuto(await lightnessImage(background) > 50 ? 'light' : 'dark'))() : setAppearanceAuto(appearanceDevice);
	}, [background]);
	const [localStorageSize, setLocalStorageSize] = useState(0);
	const getLocalStorageSize = () => {
		if (!islocalStorage) return 0;
		let _lsTotal = 0,
		_xLen, _x;
		for (_x in localStorage) {
			if (!localStorage.hasOwnProperty(_x)) continue;
			_xLen = ((localStorage[_x].length + _x.length) * 2);
			_lsTotal += _xLen;
		};
		return Number(((Number((_lsTotal / 1024).toFixed(2)) || 0)/(10240/100)).toFixed(2));
	};
	const [FAVES, setFAVES] = useState([]);
	const MODALS_LIST = {
		EDIT_FAVE: 'edit_fave',
		EDIT_FAVES: 'edit_faves',
	};
	const [popout, setPopout] = useState(null);
	const [activeModal, setActiveModal] = useState(null);
	const [modalHistory, setModalHistory] = useState([]);
	const [modalData, setModalData] = useState({});
	const changeActiveModal = (activeModal, data = null) => {
		activeModal = activeModal || null;
		let localModalHistory = modalHistory ? [...modalHistory] : [];
		if (activeModal === null) {
			localModalHistory = [];
			data = {};
		} else if (modalHistory.indexOf(activeModal) !== -1) {
			localModalHistory = localModalHistory.splice(0, localModalHistory.indexOf(activeModal) + 1);
		} else {
			localModalHistory.push(activeModal);
		}
		setActiveModal(activeModal);
		setModalHistory(localModalHistory);
		if (data) setModalData(data);
	};
	const modalBack = () => changeActiveModal(modalHistory[modalHistory.length - 2]);
	const STATE = {
		MODALS_LIST,
		changeActiveModal,
		modalBack,
		saveFile,
		readFile,
		selectImage,
		FAVES, setFAVES,
		islocalStorage,
		getLocalStorageSize,
		appearanceDevice,
		localStorageSize, setLocalStorageSize,
		popout, setPopout,
		activeModal, setActiveModal,
		modalHistory, setModalHistory,
		modalData, setModalData,
		background, setBackground,
		backgroundBlur, setBackgroundBlur,
		appearanceAuto, setAppearanceAuto,
		appearance, setAppearance,
		bookmarksSize, setBookmarksSize,
		bookmarksRounding, setBookmarksRounding,
	};
	return (
		<ConfigProvider platform='ios' appearance={appearance == 'auto' ? appearanceAuto : appearance}>
			<AdaptivityProvider>
				<AppRoot>
					<SplitLayout modal={<MODALS {...STATE}/>} popout={<POPOUTS {...STATE}/>}>
						<APP {...STATE}/>
					</SplitLayout>
				</AppRoot>
			</AdaptivityProvider>
		</ConfigProvider>
	);
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);