<h1><em><samp>electron-localstorage-store</samp></em></h1>

A React hook for sharing and synchronization of data through `localStorage` in multi-window (Also works well in electron multi-window).

## Install

```bash
# install pkg
pnpm install electron-localstorage-store
```

## Usage

```ts
import { useLocalStorageStore } from 'electron-localstorage-store'

const [store, updateStore, resetStore] = useLocalStorageStore({
    key: 'myUniqueKey',
    defaultValue: { /** properties */ }
})

// use `updateStore` to update store
updateStore({ newField: 'newValue' })

// use `resetStore` to reset store
resetStore()
```

* `store`: current store
* `updateStore`: a function, using to update store
* `resetStore`: a function, using to reset store (defaultValue is required)

> **Note**: if you want to use `resetStore`, the `defaultValue` is required.

## License

MIT @ [syt-honey](https://github.com/syt-honey)