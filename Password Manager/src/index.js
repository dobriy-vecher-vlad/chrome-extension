import React from 'react';
import ReactDOM from 'react-dom/client';
import {
	AdaptivityProvider,
	ConfigProvider,
	AppRoot,
} from '@vkontakte/vkui';
import APP from './app';
import '@vkontakte/vkui/dist/vkui.css';
import './style.css';

const App = () => {
	return (
		<ConfigProvider platform='ios' appearance={'light'}>
			<AdaptivityProvider>
				<AppRoot>
					<APP/>
				</AppRoot>
			</AdaptivityProvider>
		</ConfigProvider>
	);
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);