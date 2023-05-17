import React from 'react';
import {
	Alert,
} from '@vkontakte/vkui';

export default function(props) {
	const {
		popout,
	} = props || {};
	return popout ? <Alert {...popout}/> : null;
};