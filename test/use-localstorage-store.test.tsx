// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { localStorageStore } from '../src/useLocalStorageStore.js'

vi.stubGlobal('localStorage', {
    getItem: vi.fn(),
    setItem: vi.fn()
})

describe('useLocalStorageStore', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('should throw an error in a non-browser environment', () => {
        vi.spyOn(localStorageStore, 'isBrowser').mockReturnValue(false)

        expect(() => localStorageStore.useLocalStorageStore({ key: 'test' })).toThrowError(
            '[electron-localstorage-store]: not supported in non-browser environment.'
        )

        vi.restoreAllMocks()
    })

    it('should pass options', () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(() => localStorageStore.useLocalStorageStore()).toThrowError(
            '[electron-localstorage-store]: the key is required.'
        )
    })

    it('should pass a key in options', () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(() => localStorageStore.useLocalStorageStore({})).toThrowError(
            '[electron-localstorage-store]: the key is required.'
        )
    })

    it('defaultValue should be an object if it is not undefined ', () => {
        expect(() =>
            localStorageStore.useLocalStorageStore({
                key: 'test',
                defaultValue: 'test'
            })
        ).toThrowError('[electron-localstorage-store]: the defaultValue should be an object.')
    })

    it('should synchronize store updates across multiple instances', () => {
        const key = 'test'
        const defaultValue = { foo: 'bar' }

        const { result: window1 } = renderHook(() =>
            localStorageStore.useLocalStorageStore({ key, defaultValue })
        )
        const { result: window2 } = renderHook(() =>
            localStorageStore.useLocalStorageStore({ key, defaultValue })
        )

        // if window1 updated, window2 will be updated as well
        act(() => {
            window1.current[1]({ foo: 'baz' })
        })

        act(() => {
            window.dispatchEvent(
                new StorageEvent('storage', {
                    key,
                    newValue: JSON.stringify({ foo: 'baz' })
                })
            )
        })

        expect(window2.current[0]).toEqual({ foo: 'baz' })

        // if window2 updated, window1 update as well
        act(() => {
            window2.current[1]({ foo: 'bazz' })
        })

        act(() => {
            window.dispatchEvent(
                new StorageEvent('storage', {
                    key: key,
                    newValue: JSON.stringify({ foo: 'bazz' })
                })
            )
        })

        expect(window1.current[0]).toEqual({ foo: 'bazz' })
    })

    it('should reset the store to default values', () => {
        const key = 'test'
        const defaultValue = { foo: 'bar' }
        const { result } = renderHook(() =>
            localStorageStore.useLocalStorageStore({ key, defaultValue })
        )

        act(() => {
            result.current[1]({ foo: 'baz' })
            result.current[2]() // resetStore
        })

        expect(localStorage.setItem).toHaveBeenCalledWith(key, JSON.stringify(defaultValue))
        expect(result.current[0]).toEqual(defaultValue)
    })

    it('should reset the store to `store` value if defaultValue is empty', () => {
        const key = 'test'
        const { result } = renderHook(() => localStorageStore.useLocalStorageStore({ key }))

        const newValue = { foo: 'baz' }

        act(() => {
            window.dispatchEvent(
                new StorageEvent('storage', {
                    key,
                    newValue: JSON.stringify(newValue)
                })
            )
        })

        act(() => {
            result.current[2]()
        })

        expect(result.current[0]).toEqual(newValue)
    })

    it('should throw an error when type of options is not supported', () => {
        const defaultValue = { foo: 'bar' }
        const { result } = renderHook(() =>
            localStorageStore.useLocalStorageStore({ key: 'test', defaultValue })
        )

        expect(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const value: any = {}
            value.value = value
            result.current[1](value)
        }).toThrowError(
            '[electron-localstorage-store]: the type of options is not supported. Please make sure options is a valid object. Circular references in object is not supported.'
        )

        expect(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const value: any = ''
            result.current[1](value)
        }).toThrowError(
            '[electron-localstorage-store]: the type of options is not supported. Please make sure options is a valid object. Circular references in object is not supported.'
        )
    })
})
