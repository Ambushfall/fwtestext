import {SetStateAction, useCallback, useEffect, useState} from 'react';
import {storage} from './storage.ts';


/**
 * Basic hook for storage
 * @param {string} key
 * @param {*} initialValue
 * @param {'local'|'sync'|'session'} storageArea
 * @returns {[*, function(*= any): void, boolean, string, boolean]}
 */
export default function useBrowserStorage(key: string, initialValue: () => any, storageArea: "local" | "sync" | "session") {
    const [INITIAL_VALUE] = useState(() => {
        return typeof initialValue === 'function' ? initialValue() : initialValue;
    });
    const [STORAGE_AREA] = useState(storageArea);
    const [state, setState] = useState(INITIAL_VALUE);
    const [isPersistent, setIsPersistent] = useState(true);
    const [error, setError] = useState('');
    const [isInitialStateResolved, setIsInitialStateResolved] = useState(false);

    useEffect(() => {
        storage.get(key, INITIAL_VALUE, STORAGE_AREA)
            .then((res: any) => {
                setState(res);
                setIsPersistent(true);
                setError('');
            })
            .catch((error: SetStateAction<string>) => {
                setIsPersistent(false);
                setError(error);
            })
            .finally(() => {
                setIsInitialStateResolved(true);
            });
    }, [key, INITIAL_VALUE, STORAGE_AREA]);

    const updateValue = useCallback((newValue: (arg0: any) => any) => {
        const toStore = typeof newValue === 'function' ? newValue(state) : newValue;
        storage.set(key, toStore, STORAGE_AREA)
            .then(() => {
                setIsPersistent(true);
                setError('');
            })
            .catch((error: SetStateAction<string>) => {
                // set newValue to local state because browser.storage.onChanged won't be fired in error case
                setState(toStore);
                setIsPersistent(false);
                setError(error);
            });
    }, [STORAGE_AREA, key, state]);

    useEffect(() => {
        const onChange = (changes: { [x: string]: any; }, areaName: string) => {
            if (areaName === STORAGE_AREA && key in changes) {
                const change = changes[key]; 
                const isValueStored = 'newValue' in change;
                // only set the new value if it's actually stored (otherwise it'll just set undefined)
                if (isValueStored) {
                    setState(change.newValue);
                } else {
                    setState(INITIAL_VALUE);
                }
                setIsPersistent(isValueStored);
                setError('');
            }
        };
        browser.storage.onChanged.addListener(onChange);
        return () => {
            browser.storage.onChanged.removeListener(onChange);
        };
    }, [key, STORAGE_AREA]);

    return [state, updateValue, isPersistent, error, isInitialStateResolved];
}