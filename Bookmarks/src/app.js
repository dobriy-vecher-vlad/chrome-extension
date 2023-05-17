import React, { useState, useEffect, useRef } from 'react';
import {
	IconButton,
	Tappable,
	CustomScrollView,
	Placeholder,
	Button,
	Spinner,
	FormLayout,
	Footer,
	FormItem,
	SegmentedControl,
	Slider,
	Avatar,
	Header,
	Counter,
	ButtonGroup,
} from '@vkontakte/vkui';
import { Icon12Check, Icon12ErrorCircle, Icon24AddSquareOutline, Icon24ArrowDownToSquareOutline, Icon24ListBulletOutline, Icon24RectangleSplit4UnevenOutline, Icon28AddOutline, Icon28DeleteOutline, Icon48PictureOutline, Icon56BookmarkOutline } from '@vkontakte/icons';
import { Popover } from '@vkontakte/vkui/dist/components/Popover/Popover';

const classNames = (classNames) => Object.keys(classNames).filter((className, key) => Object.values(classNames)[key] == true).join(' ');
const Card = (props) => {
	const {
		className,
		avatar,
		header = 'header',
		link = 'link',
		size = props.size ?? 'compact',
	} = props || {};
	const Avatar = (props) => {
		const {
			className,
			src,
			usePlaceholder,
		} = props || {};
		return (<>
			<div className={classNames({
				[className]: className ? true : false,
				[`CardAvatar`]: true,
				[`CardAvatar--withPlaceholder`]: usePlaceholder,
			})} role='img'>
				<div className='CardAvatar__inner'>
					<img className='CardAvatar__image' src={src}/>
					{usePlaceholder && <img className='CardAvatar__placeholder' src={src}/>}
				</div>
			</div>
		</>);
	};
	return (<>
		<Tappable className={classNames({
			[className]: className ? true : false,
			[`Card`]: true,
			[`Card--size-${size}`]: true,
		})} href={link}>
			<div className='Card__inner'>
				<Avatar src={avatar || `https://www.google.com/s2/favicons?sz=256&domain_url=${link}`} usePlaceholder={!avatar}/>
				<div className='CardHeader'>{header}</div>
			</div>
		</Tappable>
	</>);
};

export default function(props) {
	const {
		MODALS_LIST,
		changeActiveModal,
		setPopout,
		islocalStorage,
		getLocalStorageSize,
		localStorageSize, setLocalStorageSize,
		selectImage,
		saveFile,
		readFile,
		appearanceAuto,
		FAVES, setFAVES,
		background, setBackground,
		backgroundBlur, setBackgroundBlur,
		appearance, setAppearance,
		bookmarksSize, setBookmarksSize,
		bookmarksRounding, setBookmarksRounding,
	} = props || {};
	const [settingsShown, setSettingsShown] = useState(false);
	const [savingShown, setSavingShown] = useState(false);
	const alertDefaultProps = {
		actions: [{
			title: 'Close',
			autoClose: true,
			mode: 'default',
		}],
		onClose: () => setPopout(),
	};
	const isInit = useRef(false);
	useEffect(() => {
		if (!isInit.current) return;
		if (!islocalStorage) return;
		[...Object.keys(localStorage).filter(key => key.includes('fave_'))].map(key => localStorage.removeItem(key));
		for (const [key, FAVE] of Object.entries(FAVES)) {
			if (getLocalStorageSize() < 95) {
				const hash = 'fave_' + (Number(key)+1);
				localStorage.setItem(hash, JSON.stringify(FAVE));
			}
		}
		setLocalStorageSize(getLocalStorageSize());
	}, [FAVES]);
	useEffect(() => {
		if (!islocalStorage) return;
		let FAVES = [...Object.keys(localStorage).filter(key => key.includes('fave_'))].sort((a, b) => (Number(/_(\d*)/.exec(a)?.[1]) || 0) - (Number(/_(\d*)/.exec(b)?.[1]) || 0)).map(key => JSON.parse(localStorage.getItem(key)));
		setFAVES(FAVES);
		setLocalStorageSize(getLocalStorageSize());
		isInit.current = true;
	}, []);
	return (<>
		<CustomScrollView className={classNames({
			[`Body`]: true,
			[`Body--init`]: isInit.current,
		})} windowResize>
			<header className='Header'>
				<Popover
					forcePortal={false}
					action='click'
					shown={savingShown}
					onShownChange={setSavingShown}
					content={<FormLayout style={{ minWidth: 400 }}>
						<Header>Extension storage</Header>
						<FormItem
							top={<Header mode='secondary' size='regular'>Import</Header>}
						>
							<Button size='m' appearance='neutral' mode='secondary' stretched onClick={() => readFile((file) => {
								if (islocalStorage) {
									try {
										const save = JSON.parse(file);
										if (save) {
											if (save.bookmarks || save.settings) {
												if (save.bookmarks) {
													[...Object.keys(localStorage).filter(key => key.includes('fave_'))].map(key => localStorage.removeItem(key));
													[...Object.keys(save.bookmarks)].sort((a, b) => (Number(/_(\d*)/.exec(a)?.[1]) || 0) - (Number(/_(\d*)/.exec(b)?.[1]) || 0)).map(key => {
														if (getLocalStorageSize() < 95) localStorage.setItem(key, JSON.stringify(save.bookmarks[key]));
													});
												}
												if (save.settings) {
													[...Object.keys(localStorage).filter(key => key.includes('faves_'))].map(key => localStorage.removeItem(key));
													Object.keys(save.settings).map(key => localStorage.setItem(key, save.settings[key]));
												}
												setLocalStorageSize(getLocalStorageSize());
												window.location.reload();
											} else {
												setPopout({
													...alertDefaultProps,
													header: 'Import error',
													text: 'There are no extension settings in this file',
												});
											}
										} else {
											setPopout({
												...alertDefaultProps,
												header: 'Reading error',
												text: 'An error occurred while reading the file',
											});
										}
									} catch (error) {
										setPopout({
											...alertDefaultProps,
											header: 'Unknown error',
											text: 'An unexpected error occurred while importing',
										});
									}
								} else {
									setPopout({
										...alertDefaultProps,
										header: 'Access error',
										text: 'No access to local storage',
									});
								}
							}, 'application/json', 'application/')}>
								Import
							</Button>
						</FormItem>
						<FormItem
							top={<Header mode='secondary' size='regular'>Export</Header>}
						>
							<ButtonGroup mode='horizontal' gap='m' stretched>
								<Button size='m' appearance='neutral' mode='secondary' stretched onClick={() => {
									if (islocalStorage) {
										try {
											saveFile(JSON.stringify({
												bookmarks: {...Object.assign({}, ...[...Object.keys(localStorage).filter(key => key.includes('fave_'))].map(key => ({ [key]: JSON.parse(localStorage[key]) })))},
												settings: {...Object.assign({}, ...[...Object.keys(localStorage).filter(key => key.includes('faves_'))].map(key => ({ [key]: localStorage[key] })))},
											}, null, '	'), 'Extension.json', 'application/json');
										} catch (error) {
											setPopout({
												...alertDefaultProps,
												header: 'Unknown error',
												text: 'An unexpected error occurred while exporting',
											});
										}
									} else {
										setPopout({
											...alertDefaultProps,
											header: 'Access error',
											text: 'No access to local storage',
										});
									}
								}}>
									All
								</Button>
								<Button size='m' appearance='neutral' mode='secondary' stretched onClick={() => {
									if (islocalStorage) {
										try {
											saveFile(JSON.stringify({
												bookmarks: {...Object.assign({}, ...[...Object.keys(localStorage).filter(key => key.includes('fave_'))].map(key => ({ [key]: JSON.parse(localStorage[key]) })))},
											}, null, '	'), 'Extension-bookmarks.json', 'application/json');
										} catch (error) {
											setPopout({
												...alertDefaultProps,
												header: 'Unknown error',
												text: 'An unexpected error occurred while exporting',
											});
										}
									} else {
										setPopout({
											...alertDefaultProps,
											header: 'Access error',
											text: 'No access to local storage',
										});
									}
								}}>
									Bookmarks
								</Button>
								<Button size='m' appearance='neutral' mode='secondary' stretched onClick={() => {
									if (islocalStorage) {
										try {
											saveFile(JSON.stringify({
												settings: {...Object.assign({}, ...[...Object.keys(localStorage).filter(key => key.includes('faves_'))].map(key => ({ [key]: localStorage[key] })))},
											}, null, '	'), 'Extension-settings.json', 'application/json');
										} catch (error) {
											setPopout({
												...alertDefaultProps,
												header: 'Unknown error',
												text: 'An unexpected error occurred while exporting',
											});
										}
									} else {
										setPopout({
											...alertDefaultProps,
											header: 'Access error',
											text: 'No access to local storage',
										});
									}
								}}>
									Settings
								</Button>
							</ButtonGroup>
						</FormItem>
						<FormItem
							top={<Header mode='secondary' size='regular'>Delete</Header>}
						>
							<ButtonGroup mode='horizontal' gap='m' stretched>
								<Button size='m' appearance='neutral' mode='secondary' stretched onClick={() => {
									if (islocalStorage) {
										try {
											[...Object.keys(localStorage).filter(key => key.includes('fave_'))].map(key => localStorage.removeItem(key));
											[...Object.keys(localStorage).filter(key => key.includes('faves_'))].map(key => localStorage.removeItem(key));
										} catch (error) {
											setPopout({
												...alertDefaultProps,
												header: 'Unknown error',
												text: 'An unexpected error occurred while deleting',
											});
										}
										setLocalStorageSize(getLocalStorageSize());
										window.location.reload();
									} else {
										setPopout({
											...alertDefaultProps,
											header: 'Access error',
											text: 'No access to local storage',
										});
									}
								}}>
									All
								</Button>
								<Button size='m' appearance='neutral' mode='secondary' stretched onClick={() => {
									if (islocalStorage) {
										try {
											[...Object.keys(localStorage).filter(key => key.includes('fave_'))].map(key => localStorage.removeItem(key));
										} catch (error) {
											setPopout({
												...alertDefaultProps,
												header: 'Unknown error',
												text: 'An unexpected error occurred while deleting',
											});
										}
										setLocalStorageSize(getLocalStorageSize());
										window.location.reload();
									} else {
										setPopout({
											...alertDefaultProps,
											header: 'Access error',
											text: 'No access to local storage',
										});
									}
								}}>
									Bookmarks
								</Button>
								<Button size='m' appearance='neutral' mode='secondary' stretched onClick={() => {
									if (islocalStorage) {
										try {
											[...Object.keys(localStorage).filter(key => key.includes('faves_'))].map(key => localStorage.removeItem(key));
										} catch (error) {
											setPopout({
												...alertDefaultProps,
												header: 'Unknown error',
												text: 'An unexpected error occurred while deleting',
											});
										}
										setLocalStorageSize(getLocalStorageSize());
										window.location.reload();
									} else {
										setPopout({
											...alertDefaultProps,
											header: 'Access error',
											text: 'No access to local storage',
										});
									}
								}}>
									Settings
								</Button>
							</ButtonGroup>
						</FormItem>
						<Footer style={{ margin: 'var(--vkui--size_base_padding_horizontal--regular) var(--vkui--size_base_padding_horizontal--regular) calc(var(--vkui--size_base_padding_horizontal--regular) * 2) var(--vkui--size_base_padding_horizontal--regular)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Icon12ErrorCircle/>{localStorageSize}% storage used</Footer>
					</FormLayout>}
				>
					<IconButton aria-label='Extension settings'><Icon24ArrowDownToSquareOutline/></IconButton>
				</Popover>
				<Popover
					forcePortal={false}
					action='click'
					shown={settingsShown}
					onShownChange={setSettingsShown}
					content={<FormLayout style={{ minWidth: 400 }}>
						<Header>Extension settings</Header>
						<FormItem
							top={<Header mode='secondary' size='regular'>Root theme</Header>}
						>
							<SegmentedControl
								size='m'
								name='type'
								defaultValue={appearance}
								options={['Auto', 'Light', 'Dark'].map(color => ({
									value: color.toLowerCase(),
									label: <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>{color}{appearanceAuto == color.toLowerCase() && <Icon12Check/>}</span>,
								}))}
								onChange={(value) => setAppearance(value)}
							/>
						</FormItem>
						<FormItem
							top={<Header mode='secondary' size='regular'>Bookmarks size</Header>}
						>
							<SegmentedControl
								size='m'
								name='type'
								defaultValue={bookmarksSize}
								options={[{
									value: 'compact',
									label: 'M',
								}, {
									value: 'extraSmall',
									label: 'L',
								}, {
									value: 'small',
									label: 'XL',
								}, {
									value: 'medium',
									label: 'XXL',
								}, {
									value: 'large',
									label: '3XL',
								}]}
								onChange={(value) => setBookmarksSize(value)}
							/>
						</FormItem>
						<FormItem
							top={<Header mode='secondary' size='regular' aside={<Counter size='s' mode='prominent'>{bookmarksRounding}X</Counter>}>Bookmarks rounding</Header>}
						>
							<Slider min={0} max={150} defaultValue={bookmarksRounding} onChange={(value) => setBookmarksRounding(Math.round(value))}/>
						</FormItem>
						<FormItem
							top={<Header mode='secondary' size='regular'>Bookmarks image</Header>}
						>
							<Avatar className='BookmarkAvatar' size={100} src={background} fallbackIcon={<Icon48PictureOutline/>} withBorder={false}>
								{background ? <>
									<Avatar.Overlay visibility='on-hover' onClick={() => setBackground(null)}>
										<Icon28DeleteOutline/>
									</Avatar.Overlay>
								</> : <>
									<Avatar.Overlay visibility='on-hover' onClick={() => selectImage(setBackground)}>
										<Icon28AddOutline/>
									</Avatar.Overlay>
								</>}
							</Avatar>
						</FormItem>
						<FormItem
							top={<Header mode='secondary' size='regular' aside={<Counter size='s' mode='prominent'>{backgroundBlur}X</Counter>}>Background blur</Header>}
						>
							<Slider min={0} max={100} defaultValue={backgroundBlur} disabled={!background} onChange={(value) => setBackgroundBlur(Math.round(value))}/>
						</FormItem>
					</FormLayout>}
				>
					<IconButton aria-label='Extension settings'><Icon24RectangleSplit4UnevenOutline/></IconButton>
				</Popover>
			</header>
			<div className='Content' style={{ '--column-radius': bookmarksRounding + 'px' }}>
				{isInit.current ? <div className='Cards'>
					<div className='CardsHeader'>
						<div className='CardsHeader__inner'>Bookmarks</div>
						<div className='CardsHeader__after'>
							<IconButton aria-label='New bookmark' onClick={() => changeActiveModal(MODALS_LIST.EDIT_FAVE)}><Icon24AddSquareOutline/></IconButton>
							<IconButton aria-label='Bookmarks settings' onClick={() => changeActiveModal(MODALS_LIST.EDIT_FAVES)}><Icon24ListBulletOutline/></IconButton>
						</div>
					</div>
					{FAVES.length ? <>
						<div className='Cards__inner'>
							{FAVES.map((FAVE, key) => <Card key={key} {...FAVE} size={bookmarksSize}/>)}
						</div>
					</> : <>
						<Placeholder icon={<Icon56BookmarkOutline/>} action={<Button size='l' mode='secondary' onClick={() => changeActiveModal(MODALS_LIST.EDIT_FAVE)}>New bookmark</Button>}>Bookmark history is empty</Placeholder>
					</>}
				</div> : <>
					<Spinner size='large'/>
				</>}
			</div>
			{background && <Avatar className='ContentBackground' src={background} style={{ '--background-blur': backgroundBlur + 'px' }}/>}
		</CustomScrollView>
	</>);
};