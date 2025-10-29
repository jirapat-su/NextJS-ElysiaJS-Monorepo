---
applyTo: 'apps/web/**/*.ts, apps/web/**/*.tsx'
---

# Zustand

> A small, fast and scalable bearbones state-management solution using simplified flux principles. Has a comfy API based on hooks, isn't boilerplatey or opinionated.

## Installation

```bash
npm install zustand
# or
bun add zustand
```

## Basic Usage

### Create a Store

Your store is a hook! You can put anything in it: primitives, objects, functions.

```typescript
import { create } from 'zustand'

interface BearStore {
  bears: number
  increasePopulation: () => void
  removeAllBears: () => void
  updateBears: (newBears: number) => void
}

const useBearStore = create<BearStore>((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
  updateBears: (newBears) => set({ bears: newBears }),
}))
```

### Use in Components

No providers needed! Select your state and the component will re-render on changes.

```typescript
function BearCounter() {
  const bears = useBearStore((state) => state.bears)
  return <h1>{bears} bears around here...</h1>
}

function Controls() {
  const increasePopulation = useBearStore((state) => state.increasePopulation)
  return <button onClick={increasePopulation}>one up</button>
}
```

## TypeScript Usage

Use the curried version `create<State>()(...)`  for proper TypeScript typing:

```typescript
import { create } from 'zustand'

interface BearState {
  bears: number
  increase: (by: number) => void
}

const useBearStore = create<BearState>()((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
}))
```

## State Selection

### Selecting Multiple State Slices

Use `useShallow` to prevent unnecessary re-renders:

```typescript
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

const useBearStore = create((set) => ({
  nuts: 0,
  honey: 0,
  treats: {},
}))

// Object pick - re-renders when either nuts or honey change
const { nuts, honey } = useBearStore(
  useShallow((state) => ({ nuts: state.nuts, honey: state.honey }))
)

// Array pick - re-renders when either nuts or honey change
const [nuts, honey] = useBearStore(
  useShallow((state) => [state.nuts, state.honey])
)

// Mapped picks - re-renders when treats change in order, count or keys
const treats = useBearStore(useShallow((state) => Object.keys(state.treats)))
```

### Fetching Everything

```typescript
const state = useBearStore()
```

⚠️ This will cause the component to update on every state change!

## Async Actions

Just call `set` when you're ready - Zustand doesn't care if your actions are async or not.

```typescript
const useFishStore = create((set) => ({
  fishies: {},
  fetch: async (pond) => {
    const response = await fetch(pond)
    set({ fishies: await response.json() })
  },
}))
```

## Reading State in Actions

Use `get` to access state outside of `set`:

```typescript
const useSoundStore = create((set, get) => ({
  sound: 'grunt',
  action: () => {
    const sound = get().sound
    console.log(sound)
  },
}))
```

## Overwriting State

Replace state entirely with the second argument:

```typescript
const useFishStore = create((set) => ({
  salmon: 1,
  tuna: 2,
  deleteEverything: () => set({}, true), // clears entire store
  deleteTuna: () => set(({ tuna, ...rest }) => rest, true),
}))
```

## Outside Components

### Reading/Writing State

```typescript
const useDogStore = create(() => ({ paw: true, snout: true, fur: true }))

// Getting non-reactive fresh state
const paw = useDogStore.getState().paw

// Listening to all changes
const unsub1 = useDogStore.subscribe(console.log)

// Updating state
useDogStore.setState({ paw: false })

// Unsubscribe
unsub1()
```

### Subscribe with Selector

Use `subscribeWithSelector` middleware:

```typescript
import { subscribeWithSelector } from 'zustand/middleware'

const useDogStore = create(
  subscribeWithSelector(() => ({ paw: true, snout: true, fur: true }))
)

// Listen to selected changes
const unsub2 = useDogStore.subscribe((state) => state.paw, console.log)

// Subscribe with previous value
const unsub3 = useDogStore.subscribe(
  (state) => state.paw,
  (paw, previousPaw) => console.log(paw, previousPaw)
)

// Subscribe with equality function
const unsub4 = useDogStore.subscribe(
  (state) => [state.paw, state.fur],
  console.log,
  { equalityFn: shallow }
)

// Subscribe and fire immediately
const unsub5 = useDogStore.subscribe((state) => state.paw, console.log, {
  fireImmediately: true,
})
```

## Middleware

### Persist Middleware

Persist store data to any storage:

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const useFishStore = create(
  persist(
    (set, get) => ({
      fishes: 0,
      addAFish: () => set({ fishes: get().fishes + 1 }),
    }),
    {
      name: 'food-storage', // unique name
      storage: createJSONStorage(() => sessionStorage), // default: localStorage
    }
  )
)
```

### Immer Middleware

Use Immer for immutable state updates:

```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

const useBeeStore = create(
  immer((set) => ({
    bees: 0,
    addBees: (by) =>
      set((state) => {
        state.bees += by
      }),
  }))
)
```

Or use Immer directly without middleware:

```typescript
import { produce } from 'immer'

const useLushStore = create((set) => ({
  lush: { forest: { contains: { a: 'bear' } } },
  clearForest: () =>
    set(
      produce((state) => {
        state.lush.forest.contains = null
      })
    ),
}))
```

### DevTools Middleware

Connect to Redux DevTools:

```typescript
import { devtools } from 'zustand/middleware'

const usePlainStore = create(devtools((set) => ({
  bears: 0,
  increase: () => set((state) => ({ bears: state.bears + 1 })),
})))

// With name
const useNamedStore = create(
  devtools((set) => ({ ... }), { name: 'MyStore' })
)
```

#### Logging Actions

```typescript
const useBearStore = create(
  devtools((set) => ({
    eatFish: () =>
      set(
        (prev) => ({ fishes: prev.fishes > 1 ? prev.fishes - 1 : 0 }),
        undefined,
        'bear/eatFish'
      ),
    addFishes: (count) =>
      set(
        (prev) => ({ fishes: prev.fishes + count }),
        undefined,
        { type: 'bear/addFishes', count }
      ),
  }))
)
```

### Redux Middleware

Use Redux-style reducers:

```typescript
import { redux } from 'zustand/middleware'

const types = { increase: 'INCREASE', decrease: 'DECREASE' }

const reducer = (state, { type, by = 1 }) => {
  switch (type) {
    case types.increase:
      return { grumpiness: state.grumpiness + by }
    case types.decrease:
      return { grumpiness: state.grumpiness - by }
  }
}

const useGrumpyStore = create(redux(reducer, initialState))
```

### Combining Middlewares

```typescript
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface BearState {
  bears: number
  increase: (by: number) => void
}

const useBearStore = create<BearState>()(
  devtools(
    persist(
      (set) => ({
        bears: 0,
        increase: (by) => set((state) => ({ bears: state.bears + by })),
      }),
      {
        name: 'bear-storage',
      }
    )
  )
)
```

## Vanilla Store (Without React)

Use Zustand without React dependency:

```typescript
import { createStore } from 'zustand/vanilla'

const store = createStore((set) => ({
  bears: 0,
  increase: () => set((state) => ({ bears: state.bears + 1 })),
}))

const { getState, setState, subscribe, getInitialState } = store

// Use with React
import { useStore } from 'zustand'

const useBoundStore = (selector) => useStore(store, selector)
```

## React Context

Use with React Context for dependency injection:

```typescript
import { createContext, useContext } from 'react'
import { createStore, useStore } from 'zustand'

const store = createStore((set) => ({
  bears: 0,
  increase: () => set((state) => ({ bears: state.bears + 1 })),
}))

const StoreContext = createContext(null)

const App = () => (
  <StoreContext.Provider value={store}>
    <Component />
  </StoreContext.Provider>
)

const Component = () => {
  const store = useContext(StoreContext)
  const bears = useStore(store, (state) => state.bears)
  return <div>{bears}</div>
}
```

## Transient Updates

For high-frequency updates without re-renders:

```typescript
const useScratchStore = create((set) => ({ scratches: 0 }))

const Component = () => {
  const scratchRef = useRef(useScratchStore.getState().scratches)
  
  useEffect(() =>
    useScratchStore.subscribe((state) => (scratchRef.current = state.scratches))
  , [])
  
  // Use scratchRef.current for high-frequency reads
}
```

## Best Practices

### Flux-Inspired Pattern

```typescript
interface BearStore {
  bears: number
  fish: number
  
  // Actions
  addBear: () => void
  eatFish: () => void
}

const useBearStore = create<BearStore>()((set) => ({
  bears: 0,
  fish: 0,
  
  addBear: () => set((state) => ({ bears: state.bears + 1 })),
  eatFish: () => set((state) => ({ fish: state.fish - 1 })),
}))
```

### Slices Pattern

Split store into separate slices:

```typescript
interface BearSlice {
  bears: number
  addBear: () => void
}

interface FishSlice {
  fish: number
  addFish: () => void
}

const createBearSlice = (set): BearSlice => ({
  bears: 0,
  addBear: () => set((state) => ({ bears: state.bears + 1 })),
})

const createFishSlice = (set): FishSlice => ({
  fish: 0,
  addFish: () => set((state) => ({ fish: state.fish + 1 })),
})

const useStore = create<BearSlice & FishSlice>()((...a) => ({
  ...createBearSlice(...a),
  ...createFishSlice(...a),
}))
```

### Auto-generating Selectors

```typescript
import { StoreApi, UseBoundStore } from 'zustand'

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never

const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(
  _store: S
) => {
  let store = _store as WithSelectors<typeof _store>
  store.use = {}
  for (let k of Object.keys(store.getState())) {
    ;(store.use as any)[k] = () => store((s) => s[k as keyof typeof s])
  }

  return store
}

// Usage
const useBearStore = createSelectors(
  create<BearState>()((set) => ({
    bears: 0,
    increase: () => set((state) => ({ bears: state.bears + 1 })),
  }))
)

// Auto-generated selectors
const bears = useBearStore.use.bears()
const increase = useBearStore.use.increase()
```

## Why Zustand?

### vs Redux

- ✅ Simple and unopinionated
- ✅ Hooks as primary means of consuming state
- ✅ No context providers needed
- ✅ Can inform components transiently (without causing render)

### vs Context

- ✅ Less boilerplate
- ✅ Renders components only on changes
- ✅ Centralized, action-based state management

## Common Pitfalls

### Zombie Child Problem

Zustand handles this automatically - no extra work needed.

### React Concurrency

Zustand is built with React 18+ concurrency in mind.

### Context Loss

Zustand doesn't use context, so no context loss between mixed renderers.

## Testing

```typescript
import { create } from 'zustand'

const useStore = create((set) => ({
  count: 0,
  increase: () => set((state) => ({ count: state.count + 1 })),
}))

// Reset store between tests
beforeEach(() => {
  useStore.setState({ count: 0 })
})

test('increases count', () => {
  const { increase } = useStore.getState()
  increase()
  expect(useStore.getState().count).toBe(1)
})
```

## Performance Tips

1. **Use selectors** - Only select what you need
2. **Use `useShallow`** - Prevent re-renders on reference changes
3. **Memoize selectors** - For complex computations
4. **Use transient updates** - For high-frequency changes
5. **Split stores** - Separate concerns into different stores

## Resources

- [Official Documentation](https://docs.pmnd.rs/zustand)
- [GitHub Repository](https://github.com/pmndrs/zustand)
- [Live Demo](https://zustand-demo.pmnd.rs/)
- [TypeScript Guide](https://github.com/pmndrs/zustand/blob/main/docs/guides/typescript.md)
- [Testing Guide](https://github.com/pmndrs/zustand/blob/main/docs/guides/testing.md)
