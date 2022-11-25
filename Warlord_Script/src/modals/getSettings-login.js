import React from 'react';
import {
	FormItem,
	Input,
	Div,
	ModalPageHeader,
	PanelHeaderSubmit,
	PanelHeaderBack,
	IconButton,
	ModalPage
} from '@vkontakte/vkui';
import {
	Icon16Clear
} from '@vkontakte/icons';

class MODAL extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			key: this.props.state.login ? this.props.state.login : ''
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
					after={<PanelHeaderSubmit disabled={!(String(key).length > 0)} onClick={() => setState({ login: key }, options.BackModal())}/>}
				>Логин авторизации</ModalPageHeader>}
			>
				<Div>
					<FormItem
						top="Логин авторизации игры" 
						status={String(key).length != 0 ? 'valid' : 'error'}
						bottom={String(key).length != 0 ? 'Логин введён верно!' : 'Пожалуйста, введите логин'}
					>
						<Input
							type="text"
							name="login_key"
							placeholder="login_key"
							maxLength={44}
							value={key}
							onChange={e => this.setState({ key: e.target.value })}
							after={<IconButton hoverMode="opacity" aria-label="Очистить поле" onClick={() => this.setState({ key: '' })}><Icon16Clear/></IconButton>}
						/>
					</FormItem>
				</Div>
			</ModalPage>
		);
	};
};
export default MODAL;