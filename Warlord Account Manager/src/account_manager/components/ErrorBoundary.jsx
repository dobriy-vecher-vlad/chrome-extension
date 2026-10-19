import { Component } from 'react';

// Ошибка в интерфейсе не должна ронять страницу ВК и не должна оставлять половину панели: при сбое (например, расширение
// обновили, пока страница была открыта, и обращения к нему перестали работать) панель просто пропадает.
// Вернётся она после обновления страницы.
export class ErrorBoundary extends Component {
	state = { failed: false };

	static getDerivedStateFromError() {
		return { failed: true };
	}

	render() {
		return this.state.failed ? null : this.props.children;
	}
}
