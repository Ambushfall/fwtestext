import createBrowserStorageStateHook from './createBrowserStorageStateHook';
import useBrowserStorage from './useBrowserStorage';


/**
 * Hook which will use `Browser.storage.local` to persist state.
 *
 * @param {string} key - they key name in Browser's storage. Nested keys not supported
 * @param {*} [initialValue] - default value to use
 * @returns {[any, (value: any) => void, boolean, string]} - array of
 *      stateful `value`,
 *      function to update this `value`,
 *      `isPersistent` - will be `false` if error occurred during reading/writing Browser.storage,
 *      `error` - will contain error appeared in storage. if isPersistent is true, there will be an empty string
 *      `isInitialStateResolved` - will set to `true` once `initialValue` will be replaced with stored in Browser.storage
 */
function useBrowserStorageLocal(key: string, initialValue: () => any) {
    return useBrowserStorage(key, initialValue, 'local');
}

/**
 * Hook which will use `Browser.storage.sync` to persist state.
 *
 * @param {string} key - they key name in Browser's storage. Nested keys not supported
 * @param {*} [initialValue] - default value to use
 * @returns {[any, (value: any) => void, boolean, string, boolean]} - array of
 *      stateful `value`,
 *      function to update this `value`,
 *      `isPersistent` - will be `false` if error occurred during reading/writing Browser.storage,
 *      `error` - will contain error appeared in storage. if isPersistent is true, there will be an empty string
 *      `isInitialStateResolved` - will set to `true` once `initialValue` will be replaced with stored in Browser.storage
 */
function useBrowserStorageSync(key: string, initialValue: () => any) {
    return useBrowserStorage(key, initialValue, 'sync');
}

/**
 * Hook which will use `Browser.storage.session` to persist state.
 * By default, `Browser.storage.session` not exposed to content scripts,
 * but this behavior can be changed by setting Browser.storage.session.setAccessLevel() in the background script.
 * https://developer.Browser.com/docs/extensions/reference/storage/#method-StorageArea-setAccessLevel
 *
 * @param {string} key - they key name in Browser's storage. Nested keys not supported
 * @param {*} [initialValue] - default value to use
 * @returns {[any, (value: any) => void, boolean, string, boolean]} - array of
 *      stateful `value`,
 *      function to update this `value`,
 *      `isPersistent` - will be `false` if error occurred during reading/writing Browser.storage,
 *      `error` - will contain error appeared in storage. if isPersistent is true, there will be an empty string
 *      `isInitialStateResolved` - will set to `true` once `initialValue` will be replaced with stored in Browser.storage
 */
function useBrowserStorageSession(key: string, initialValue: () => any) {
    return useBrowserStorage(key, initialValue, 'session');
}

/**
 * Use to create state with Browser.storage.local.
 * Useful if you want to reuse same state across components and/or context (like in popup, content script, background pages)
 *
 * @param {string} key - they key name in Browser's storage. Nested keys are not supported
 * @param {*} [initialValue] - default value to use
 * @returns {function(): [any, (value: any) => void, boolean, string, boolean]}
 *          - useBrowserStorageLocal hook which may be used across extension's components/pages
 */
function createBrowserStorageStateHookLocal(key: any, initialValue: any) {
    return createBrowserStorageStateHook(key, initialValue, 'local');
}

/**
 * Use to create state with Browser.storage.sync.
 * Useful if you want to reuse same state across components and/or context (like in popup, content script, background pages)
 *
 * @param {string} key - they key name in Browser's storage. Nested keys are not supported
 * @param {*} [initialValue] - default value to use
 * @returns {function(): [any, (value: any) => void, boolean, string, boolean]}
 *          - useBrowserStorageSync hook which may be used across extension's components/pages
 */
function createBrowserStorageStateHookSync(key: any, initialValue: any) {
    return createBrowserStorageStateHook(key, initialValue, 'sync');
}

/**
 * Use to create state with Browser.storage.session.
 * Useful if you want to reuse same state across components and/or context (like in popup, content script, background pages)
 * By default, `Browser.storage.session` not exposed to content scripts,
 * but this behavior can be changed by setting Browser.storage.session.setAccessLevel() in the background script.
 * https://developer.Browser.com/docs/extensions/reference/storage/#method-StorageArea-setAccessLevel
 *
 * @param {string} key - they key name in Browser's storage. Nested keys are not supported
 * @param {*} [initialValue] - default value to use
 * @returns {function(): [any, (value: any) => void, boolean, string, boolean]}
 *          - useBrowserStorageSession hook which may be used across extension's components/pages
 */
function createBrowserStorageStateHookSession(key: any, initialValue: any) {
    return createBrowserStorageStateHook(key, initialValue, 'session');
}

export {
    useBrowserStorageLocal,
    useBrowserStorageSync,
    useBrowserStorageSession,
    createBrowserStorageStateHookLocal,
    createBrowserStorageStateHookSync,
    createBrowserStorageStateHookSession,
};