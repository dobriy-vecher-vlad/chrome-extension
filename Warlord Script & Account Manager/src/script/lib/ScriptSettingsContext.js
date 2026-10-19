import { createContext, useContext } from 'react';

// Настройки блока и действия над ними для окна настроек: оно открывается менеджером модальных окон VKUI,
// поэтому получает всё через контекст, а не через свойства
export const ProfileSettingsContext = createContext(null);

export const useProfileSettings = () => useContext(ProfileSettingsContext);
