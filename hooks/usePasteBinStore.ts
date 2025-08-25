import {createBrowserStorageStateHookLocal} from '@/hooks/useBrowserStorageStateHook';


const SETTINGS_KEY = 'poe_item_pastebin';
const INITIAL_VALUE = 'some-initial-val';

export const usePasteBinStore = createBrowserStorageStateHookLocal(SETTINGS_KEY, INITIAL_VALUE);