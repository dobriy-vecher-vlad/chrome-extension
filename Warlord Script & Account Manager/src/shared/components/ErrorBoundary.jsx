import { Component } from 'react';

// Ошибка попадает в консоль страницы
export function reportError(part, error) {
	console.error(`[${part}]`, error);
}

// Ошибка отрисовки не должна молча убирать блок: React при необработанной ошибке снимает всё дерево, и блок «рисуется и
// пропадает». Здесь ошибка записывается, а вместо блока показывается fallback({ error, retry }).
export class ErrorBoundary extends Component {
	state = { error: null };

	static getDerivedStateFromError(error) {
		return { error };
	}

	componentDidCatch(error) {
		reportError(this.props.part, error);
	}

	retry = () => this.setState({ error: null });

	render() {
		const { error } = this.state;
		if (!error) return this.props.children;
		return this.props.fallback ? this.props.fallback({ error, retry: this.retry }) : null;
	}
}
