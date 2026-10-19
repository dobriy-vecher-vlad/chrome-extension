import { createContext, useContext } from 'react';

// Данные и действия панели для окон, которые создаёт менеджер модальных окон VKUI:
// он монтирует их сам, поэтому свежие аккаунты и обработчики берём из контекста, а не из свойств.
// { manager: результат useAccounts, confirmRemove(account, onRemoved), notify(text, kind) }
export const ManagerContext = createContext(null);

export const useManagerContext = () => useContext(ManagerContext);
