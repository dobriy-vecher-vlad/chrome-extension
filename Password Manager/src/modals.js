import React, { useState } from 'react';
import {
	ModalRoot,
	ModalPage,
	ModalPageHeader,
	Headline,
	Footnote,
	Input,
	FormItem,
	FormLayoutGroup,
	Div,
	Button,
	Avatar,
	List,
	Cell,
	IconButton,
	ButtonGroup,
	Link,
	Placeholder,
} from '@vkontakte/vkui';
import { Icon12ArrowUpRight, Icon16Add, Icon16Cancel, Icon16Delete, Icon16Done, Icon16Pen, Icon28AddOutline, Icon28DeleteOutline, Icon48PictureOutline, Icon56BookmarkOutline, Icon56InfoOutline } from '@vkontakte/icons';

const EDIT_FAVE = (props) => {
	const {
		modalBack,
		FAVES,
		setFAVES,
		modalData,
		changeActiveModal,
		selectImage,
	} = props || {};
	const [title, setTitle] = useState(modalData?.fave?.header || null);
	const [link, setLink] = useState(modalData?.fave?.link || null);
	const [avatar, setAvatar] = useState(modalData?.fave?.avatar || null);
	const addFave = () => {
		changeActiveModal(null);
		setFAVES([...FAVES, {
			header: title || link,
			link: link,
			avatar: avatar,
		}]);
	};
	const editFave = () => {
		const key = modalData.key;
		const FAVES = modalData.faves;
		if (FAVES[key]) {
			modalBack();
			FAVES[key] = {
				header: title || link,
				link: link,
				avatar: avatar,
			};
			modalData.updateFAVES(FAVES);
		}
	};
	return (<>
		<ModalPage
			id={props.id}
			onClose={modalBack}
			dynamicContentHeight
			hideCloseButton
			header={<>
				<ModalPageHeader
					className={(title || link) ? 'PanelHeader--muptiline' : ''}
					before={<Button before={<Icon16Cancel/>} onClick={modalBack} mode='tertiary' size='l'>Cancel</Button>}
					after={modalData?.fave ? <>
						<Button after={<Icon16Done/>} onClick={editFave} mode='tertiary' size='l' disabled={!link?.length}>Apply</Button>
					</> : <>
						<Button after={<Icon16Add/>} onClick={addFave} mode='tertiary' size='l' disabled={!link?.length}>Add</Button>
					</>}
				>
					<Headline className='PanelHeader__content-header' level='1' weight='2'>{title || link}</Headline>
					<Footnote className='PanelHeader__content-text'>{modalData?.fave ? 'Bookmark' :  'New bookmark'}</Footnote>
				</ModalPageHeader>
			</>}
		>
			<Div>
				<Avatar className='BookmarkAvatar' size={100} src={avatar} fallbackIcon={<Icon48PictureOutline/>} withBorder={false}>
					{avatar ? <>
						<Avatar.Overlay visibility='on-hover' onClick={() => setAvatar(null)}>
							<Icon28DeleteOutline/>
						</Avatar.Overlay>
					</> : <>
						<Avatar.Overlay visibility='on-hover' onClick={() => selectImage(setAvatar)}>
							<Icon28AddOutline/>
						</Avatar.Overlay>
					</>}
				</Avatar>
			</Div>
			<FormLayoutGroup mode='horizontal'>
				<FormItem top='Bookmark name'>
					<Input defaultValue={modalData?.fave?.header} placeholder='Enter the bookmark name' maxLength={32} onInput={(event) => {
						const value = event?.target?.value || '';
						setTitle(value.trim());
						event.target.value = value;
					}} onBlur={(event) => event.target.value = event.target.value.trim()}/>
				</FormItem>
				<FormItem top='Bookmark link'>
					<Input defaultValue={modalData?.fave?.link} placeholder='Enter the bookmark link' maxLength={128} onInput={(event) => {
						const value = event?.target?.value?.trim() || '';
						setLink(value);
						event.target.value = value;
					}}/>
				</FormItem>
			</FormLayoutGroup>
		</ModalPage>
	</>);
};

const EDIT_FAVES = (props) => {
	const {
		modalBack,
		FAVES,
		setFAVES,
		changeActiveModal,
		MODALS_LIST,
		modalData,
	} = props || {};
	const [draggingList, updateDraggingList] = useState([...modalData?.faves || FAVES]);
	const onDragFinish = ({ from, to }) => {
		const _list = [...draggingList];
		_list.splice(from, 1);
		_list.splice(to, 0, draggingList[from]);
		updateDraggingList(_list);
	};
	const appleChanges = () => {
		modalBack();
		setFAVES(draggingList);
	};
	const removeFave = (key) => {
		const _list = [...draggingList];
		if (_list[key]) {
			_list.splice(key, 1);
			updateDraggingList(_list);
		}
	};
	return (<>
		<ModalPage
			id={props.id}
			onClose={modalBack}
			dynamicContentHeight
			hideCloseButton
			header={<>
				<ModalPageHeader
					before={<Button before={<Icon16Cancel/>} onClick={modalBack} mode='tertiary' size='l'>Cancel</Button>}
					after={<Button after={<Icon16Done/>} mode='tertiary' size='l' onClick={appleChanges} disabled={JSON.stringify(draggingList) == JSON.stringify(FAVES)}>Apply</Button>}
				>
					<Footnote className='PanelHeader__content-text'>Bookmarks</Footnote>
				</ModalPageHeader>
			</>}
		>
			<Div>
				{FAVES.length ? draggingList.length ? <>
					<List>
						{draggingList.map((FAVE, key) => (
							<Cell key={key} before={<ButtonGroup gap='none'>
								<IconButton onClick={() => changeActiveModal(MODALS_LIST.EDIT_FAVE, {
									key,
									fave: FAVE,
									faves: draggingList,
									updateFAVES: updateDraggingList,
								})}><Icon16Pen/></IconButton>
								<IconButton onClick={() => removeFave(key)}><Icon16Delete/></IconButton>
							</ButtonGroup>} after={<Avatar src={FAVE.avatar || `https://www.google.com/s2/favicons?sz=256&domain_url=${FAVE.link}`}/>} draggable={draggingList.length > 1} hasActive={false} hasHover={false} withBorder={false} subtitle={<Link href={FAVE.link} target='_blank'>{FAVE.link}<Icon12ArrowUpRight/></Link>} onDragFinish={onDragFinish}>
								{FAVE.header}
							</Cell>
						))}
					</List>
				</> : <>
					<Placeholder icon={<Icon56InfoOutline/>}>Bookmarks history will be cleared</Placeholder>
				</> : <>
					<Placeholder icon={<Icon56BookmarkOutline/>} action={<Button size='l' mode='secondary' onClick={() => changeActiveModal(MODALS_LIST.EDIT_FAVE)}>New bookmark</Button>}>Bookmark history is empty</Placeholder>
				</>}
			</Div>
		</ModalPage>
	</>);
};

export default function(props) {
	const {
		MODALS_LIST,
		activeModal,
		modalBack,
	} = props || {};
	return (
		<ModalRoot activeModal={activeModal} onClose={modalBack}>
			<EDIT_FAVE id={MODALS_LIST.EDIT_FAVE} {...props}/>
			<EDIT_FAVES id={MODALS_LIST.EDIT_FAVES} {...props}/>
		</ModalRoot>
	);
};