import {createBrowserStorageStateHookLocal} from '@/hooks/useBrowserStorageStateHook';


const SETTINGS_KEY = 'settings';
const INITIAL_VALUE = {
    showAvatar: true,
    showHistory: false,
    darkMode: false,
    testing: true
};

export const useSettingsStore = createBrowserStorageStateHookLocal(SETTINGS_KEY, INITIAL_VALUE);