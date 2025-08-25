import {useCallback, useEffect} from 'react';
import useBrowserStorage from './useBrowserStorage';


export default function createBrowserStorageStateHook(key: any, initialValue: any, storageArea: "local" | "sync" | "session") {
    const consumers: any[] = [];

    return function useCreateBrowserStorageHook() {
        const [value, setValue, isPersistent, error, isInitialStateResolved] = useBrowserStorage(
            key,
            initialValue,
            storageArea,
        );

        const setValueAll = useCallback((newValue: any) => {
            for (const consumer of consumers) {
                consumer(newValue);
            }
        }, []);

        useEffect(() => {
            consumers.push(setValue);
            return () => {
                consumers.splice(consumers.indexOf(setValue), 1);
            };
        }, [setValue]);

        return [value, setValueAll, isPersistent, error, isInitialStateResolved];
    };
}