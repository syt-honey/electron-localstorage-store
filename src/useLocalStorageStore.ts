/**
 * share data in your multi-windows which using localStorage
 */

import { useState, useEffect, useCallback, useMemo } from 'react'

export type LocalStorageStoreOptions<T> = {
    // the key is required, because we should use this key to compare the event listener key, to get data and so on
    key: string
    // only support `object`
    // if defaultValue is not `undefined`, type `T` must be an `object` inclding `{}`, `{ // properties }`
    defaultValue?: T
}
export type LocalStorageStore<T> = [T, (newOptions: Partial<T>) => void, () => void]

export default useLocalStorageStore

export function useLocalStorageStore<T>(
    options: LocalStorageStoreOptions<T>
): LocalStorageStore<T> {
    // this hook is only supported in browser
    if (!isBrowser()) {
        throw new TypeError(
            '[electron-localstorage-store]: not supported in non-browser environment.'
        )
    }

    // the key is required, because we should use key to get, update or reset data
    if (!options || !options?.key) {
        throw new TypeError('[electron-localstorage-store]: the key is required.')
    }

    // if defaultValue is `''`, it will be ignored
    if (options.defaultValue && !isObject(options.defaultValue)) {
        throw new TypeError('[electron-localstorage-store]: the defaultValue should be an object.')
    }

    return useBrowserLocalStorageStore(options.key, options.defaultValue)
}

const LOCAL_DEFAULT_VALUE = {} as Record<string, never>

function useBrowserLocalStorageStore<T>(key: string, defaultValue?: T): LocalStorageStore<T> {
    const [_rawStore, _setStore] = useState(
        () => localStorage.getItem(key) || stringify(LOCAL_DEFAULT_VALUE)
    )

    // make sure `JSON.parse` is safe
    const store = useMemo(() => parse(_rawStore, LOCAL_DEFAULT_VALUE) as T, [_rawStore])

    const updateStore = useCallback(
        (newOptions: Partial<T>): void => {
            // When key is reference-safe and is an object we update options.
            if (isSafeJSONObject(newOptions) && isObject(newOptions)) {
                const opts = stringify({ ...store, ...newOptions })
                localStorage.setItem(key, opts)
                _setStore(opts)
            } else {
                throw new Error(
                    `[electron-localstorage-store]: the type of options is not supported. Please make sure options is a valid object. Circular references in object is not supported.`
                )
            }
        },
        [key, store]
    )

    const resetStore = useCallback((): void => {
        if (defaultValue) {
            updateStore(defaultValue)
        } else if (store && !isEmptyObject(store)) {
            updateStore(store)
        }
    }, [defaultValue, store, updateStore])

    useEffect(() => {
        // If there is `defaultValue` and the `store` is empty, we should initialize store first.
        if (isEmptyObject(store) && defaultValue) {
            updateStore(defaultValue)
        }
    }, [defaultValue, store, updateStore])

    useEffect(() => {
        const handleStorageChange = (event: StorageEvent): void => {
            if (event.key === key && event.newValue) {
                _setStore(event.newValue)
            }
        }

        window.addEventListener('storage', handleStorageChange)

        return (): void => {
            window.removeEventListener('storage', handleStorageChange)
        }
    }, [key])

    return [store, updateStore, resetStore]
}

function isBrowser(): boolean {
    return typeof window !== 'undefined'
}

// block circular references. e.g. `const a = {}; a.a = a;`
// other values which can not serialize to JSON will be filter or ignore
function isSafeJSONObject(obj: unknown): boolean {
    const json = stringify(obj)
    const parsed = parse(json)

    return stringify(obj) === stringify(parsed)
}

function isObject(obj: unknown): boolean {
    return obj !== null && typeof obj === 'object'
}

function isEmptyObject(obj: unknown): boolean {
    return stringify(obj) === '{}'
}

function stringify(obj: unknown): string {
    try {
        return JSON.stringify(obj)
    } catch {
        return ''
    }
}

function parse(str: string, defaultValue?: unknown): unknown {
    try {
        return JSON.parse(str)
    } catch {
        return defaultValue ?? {}
    }
}
