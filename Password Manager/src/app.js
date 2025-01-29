import React, { useState, useEffect, useRef } from 'react';
import {
	AdaptivityProvider,
	ConfigProvider,
	AppRoot,
	SplitLayout,
	useAppearance,
	View,
	Panel,
	PanelHeader,
	Group,
	CellButton,
	SplitCol,
	Cell,
	PanelHeaderBack,
	Placeholder,
	Avatar,
	Button,
	Separator,
	Root,
	Accordion,
	Div,
	Tappable,
	SimpleCell,
} from '@vkontakte/vkui';
import { Icon28ClipOutline, Icon28MessageOutline, Icon28ServicesOutline, Icon28UserCircleOutline, Icon28UserOutline, Icon56MentionOutline, Icon56MessageReadOutline, Icon56NewsfeedOutline, Icon56UsersOutline } from '@vkontakte/icons';


const views = [{
	id: 'home',
	title: 'Home',
	panels: [{
		id: 'home',
		title: 'Home',
	}],
}, {
	id: 'passwords',
	title: 'Site data',
	panels: [{
		id: 'home',
		title: 'Home',
	}, {
		id: 'passwords',
		title: 'Site data',
	}, {
		id: 'cards',
		title: 'Bank cards',
	}],
}, {
	id: 'cards',
	title: 'Bank cards',
	panels: [{
		id: 'home',
		title: 'Home',
	}, {
		id: 'passwords',
		title: 'Site data',
	}, {
		id: 'cards',
		title: 'Bank cards',
	}],
}];


export default function(props) {


	const [activeView, setActiveView] = useState(views[0]);
	const onViewChange = (view) => {
		setActivePanel(views[view].panels[0]);
		setActiveView(views[view]);
	};
	useEffect(() => {
		console.log({activeView});
	}, [activeView]);
	const [activePanel, setActivePanel] = useState(views[0].panels[0]);
	const onPanelChange = (view, panel) => setActivePanel(views[view].panels[panel]);
	useEffect(() => {
		console.log({activePanel});
	}, [activePanel]);


	return (<>
		<SplitLayout header={<PanelHeader after={<Avatar size={36} />}>{activeView.title} - {activePanel.title}</PanelHeader>}>
			<SplitCol fixed width={350} maxWidth={350} id='navigation'>
				<PanelHeader />
				<Panel>
					{views.map((view, view_key) =>
						<Accordion key={view.id} open={view.id === activeView.id}>
							<Accordion.Summary hovered={view.id == activeView.id} hasActive={view.id != activeView.id} onClick={(event) => {
								event.preventDefault();
								onViewChange(view_key);
							}}>{view.title}</Accordion.Summary>
							<div style={{ marginLeft: 'var(--vkui--size_split_col_padding_horizontal--regular)' }}>
								{view.panels.map((panel, panel_key) =>
									<SimpleCell
										key={panel.id}
										onClick={() => onPanelChange(view_key, panel_key)}
										expandable
										hovered={panel.id == activePanel.id} hasActive={panel.id != activePanel.id}
										before={<Icon28UserOutline />}
									>
										{panel.title}
								  	</SimpleCell>
								)}
							</div>
						</Accordion>
					)}
				</Panel>
			</SplitCol>
			<SplitCol stretchedOnMobile={false} autoSpaced={true} animate={false} id='content'>
				<Root id='root' activeView={activeView.id}>
					{views.map(({id, title, panels}) => 
						<View id={id} key={id} activePanel={activePanel.id}>
							{panels.map(({id, title}) => 
								<Panel id={id} key={id}>
									<Group>
									<Placeholder
										icon={<Icon56UsersOutline />}
										header="Уведомления от сообществ"
										action={<Button size="m">Подключить сообщества</Button>}
									>
										Подключите сообщества, от которых Вы хотите получать уведомления
									</Placeholder>
									<Separator />
									<Placeholder icon={<Icon56MentionOutline />}>
										Введите адрес страницы в поле поиска
									</Placeholder>
									</Group>
								</Panel>
							)}
						</View>
					)}
				</Root>
			</SplitCol>
		</SplitLayout>
	</>);
};