import React from 'react';
import {
	Div,
	ModalPageHeader,
	PanelHeaderSubmit,
	ModalPage,
	List,
	Cell,
	Avatar,
	PanelHeaderButton,
	Footer,
} from '@vkontakte/vkui';

class MODAL extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			profiles: this.props.state.storeProfiles.filter(profile => profile.id && !profile.main),
			profilesFull: this.props.state.storeProfilesFull.filter(profile => profile.id && !profile.main),
		};
	};
	removeProfiles = (x) => {
		const _profiles = [...this.state.profiles];
		_profiles.splice(x, 1);
		const _profilesFull = [...this.state.profilesFull];
		_profilesFull.splice(x, 1);
		this.setState({ profiles: _profiles, profilesFull: _profilesFull });
	};
	reorderProfiles = ({ from, to }) => {
		const _profiles = [...this.state.profiles];
		_profiles.splice(from, 1);
		_profiles.splice(to, 0, this.state.profiles[from]);
		const _profilesFull = [...this.state.profilesFull];
		_profilesFull.splice(from, 1);
		_profilesFull.splice(to, 0, this.state.profilesFull[from]);
		this.setState({ profiles: _profiles, profilesFull: _profilesFull });
	};
	saveProfiles = () => {
		const _profiles = [...this.state.profiles];
		_profiles.unshift(this.props.state.storeProfiles[0]);
		Array.prototype.push.apply(_profiles, new Array(this.props.state.storeProfiles.length-_profiles.length).fill({ id: null }));
		this.props.setState({ storeProfiles: _profiles });
		this.props.options.BackModal();
		this.props.options.storeProfilesRefresh();
	};
	async componentDidMount() {
		console.log('[MODAL] >', this.props.id);
	};
	render() {
		const { setState, state, options } = this.props;
		const { profiles, profilesFull } = this.state;
		return (
			<ModalPage
				settlingHeight={100}
				className="ModalPage--classic"
				id={this.props.id}
				header={<ModalPageHeader
					before={<PanelHeaderButton onClick={() => options.BackModal()}>Отмена</PanelHeaderButton>}
					after={<PanelHeaderSubmit onClick={() => this.saveProfiles()}/>}
				>Редактирование</ModalPageHeader>}
			>
				<Div style={{ paddingTop: 'var(--vkui--size_base_padding_vertical--regular,12px)', paddingBottom: 'var(--vkui--size_base_padding_vertical--regular,12px)' }}>
					<List>
						{profilesFull.map((profile, x) => {
							let server = state.serverHub.find(server => server.id == profile.server);
							return (<Cell
								key={x}
								mode="removable"
								removePlaceholder="Удалить профиль"
								subtitle={`${server?.company || 'ВКонтакте'}, королевство ${server?.name || 'Эрмун'}`}
								draggable
								before={<Avatar src={profile.photo_100 || 'https://vk.com/images/camera_200.png'} />}
								onRemove={() => this.removeProfiles(x)}
								onDragFinish={({ from, to }) => this.reorderProfiles({ from, to })}
							>{profile.first_name} {profile.last_name}</Cell>);
						})}
					</List>
					<Footer>{profiles.length} из {this.props.state.storeProfilesSize} {options.numberForm(profiles.length, ['слот', 'слота', 'слотов'])}</Footer>
				</Div>
			</ModalPage>
		);
	};
};
export default MODAL;