import React from 'react';
import {
	FormItem,
	Div,
	ModalPageHeader,
	PanelHeaderSubmit,
	PanelHeaderBack,
	Radio,
	ModalPage
} from '@vkontakte/vkui';

class MODAL extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			key: this.props.state.server ? this.props.state.server : 0
		};
	};
	async componentDidMount() {
		console.log('[MODAL] >', this.props.id);
	};
	render() {
		const { setState, state, options } = this.props;
		const { key } = this.state;
		return (
			<ModalPage
				className="ModalPage--classic"
				id={this.props.id}
				header={<ModalPageHeader
					before={<PanelHeaderBack onClick={() => options.BackModal()}/>}
					after={<PanelHeaderSubmit disabled={!(Number(key) > 0)} onClick={() => setState({ server: key }, options.BackModal())}/>}
				>Сервер</ModalPageHeader>}
			>
				<Div>
					<FormItem
						top="Игровой сервер профиля"
						status={Number(key) != 0 ? 'valid' : 'error'}
						bottom={Number(key) != 0 ? 'Сервер выбран верно!' : 'Пожалуйста, выберите сервер'}
					>
						{this.props.state.serverHub.map(server => <Radio key={server.id} name="type"
							defaultChecked={key == server.id}
							onChange={() => this.setState({ key: server.id })}
						>{server.name} ({server.site})</Radio>)}
					</FormItem>
				</Div>
			</ModalPage>
		);
	};
};
export default MODAL;