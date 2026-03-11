import {createBrowserStorageStateHookLocal} from '@/hooks/useBrowserStorageStateHook';


const SETTINGS_KEY = 'settings';
const INITIAL_VALUE = {
    showAvatar: true,
    showHistory: false,
    darkMode: false,
    testing: true,
    yt_preview_muted: true
};

export const useSettingsStore = createBrowserStorageStateHookLocal(SETTINGS_KEY, INITIAL_VALUE);