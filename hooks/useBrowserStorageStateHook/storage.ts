export const storage = {
    get: (key: string | number, defaultValue: undefined, storageArea: "local" | "sync" | "session") => {
        const keyObj = defaultValue === undefined ? key : {[key]: defaultValue};
        return new Promise((resolve, reject) => {
            browser.storage[storageArea].get(keyObj, (items: { [x: string]: unknown; }) => {
                const error = browser.runtime.lastError;
                if (error) return reject(error);
                resolve(items[key]);
            });
        });
    },
    set: (key: any, value: any, storageArea: "local" | "sync" | "session") => {
        return new Promise((resolve, reject) => {
            browser.storage[storageArea].set({[key]: value}, () => {
                const error = browser.runtime.lastError;
                error ? reject(error) : resolve(undefined);
            });
        });
    },
};