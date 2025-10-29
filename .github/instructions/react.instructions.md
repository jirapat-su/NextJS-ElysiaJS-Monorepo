---
applyTo: 'apps/web/**/*.ts, apps/web/**/*.tsx'
---

# React 19

> React 19 is now stable with major improvements in Actions, hooks, and performance.

## Key Features in React 19

### Actions

Actions handle async operations with automatic state management:

```typescript
import { useTransition } from 'react'

function UpdateName() {
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    startTransition(async () => {
      const error = await updateName(name)
      if (error) {
        setError(error)
        return
      }
      redirect('/path')
    })
  }

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={handleSubmit} disabled={isPending}>
        Update
      </button>
      {error && <p>{error}</p>}
    </div>
  )
}
```

### New Hook: `useActionState`

Simplifies form handling with automatic state management:

```typescript
import { useActionState } from 'react'

function ChangeName({ name, setName }) {
  const [error, submitAction, isPending] = useActionState(
    async (previousState, formData) => {
      const error = await updateName(formData.get('name'))
      if (error) {
        return error
      }
      redirect('/path')
      return null
    },
    null
  )

  return (
    <form action={submitAction}>
      <input type="text" name="name" />
      <button type="submit" disabled={isPending}>
        Update
      </button>
      {error && <p>{error}</p>}
    </form>
  )
}
```

### New Hook: `useOptimistic`

Optimistic updates for better UX:

```typescript
import { useOptimistic } from 'react'

function ChangeName({ currentName, onUpdateName }) {
  const [optimisticName, setOptimisticName] = useOptimistic(currentName)

  const submitAction = async (formData) => {
    const newName = formData.get('name')
    setOptimisticName(newName)
    const updatedName = await updateName(newName)
    onUpdateName(updatedName)
  }

  return (
    <form action={submitAction}>
      <p>Your name is: {optimisticName}</p>
      <p>
        <label>Change Name:</label>
        <input
          type="text"
          name="name"
          disabled={currentName !== optimisticName}
        />
      </p>
    </form>
  )
}
```

### New API: `use`

Read resources in render (promises and context):

```typescript
import { use } from 'react'

function Comments({ commentsPromise }) {
  // `use` will suspend until the promise resolves
  const comments = use(commentsPromise)
  return comments.map((comment) => <p key={comment.id}>{comment}</p>)
}

function Page({ commentsPromise }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Comments commentsPromise={commentsPromise} />
    </Suspense>
  )
}
```

**Important**: `use` does NOT support promises created in render. Pass promises from Suspense-compatible libraries.

### New Hook: `useFormStatus`

Access form status in child components:

```typescript
import { useFormStatus } from 'react-dom'

function DesignButton() {
  const { pending } = useFormStatus()
  return <button type="submit" disabled={pending} />
}
```

## Major Improvements

### `ref` as a prop

No more `forwardRef`:

```typescript
// ✅ React 19
function MyInput({ placeholder, ref }) {
  return <input placeholder={placeholder} ref={ref} />
}

// ❌ Old way (still works but deprecated)
const MyInput = forwardRef(({ placeholder }, ref) => {
  return <input placeholder={placeholder} ref={ref} />
})
```

### `<Context>` as provider

Simplified context usage:

```typescript
const ThemeContext = createContext('')

// ✅ React 19
function App({ children }) {
  return <ThemeContext value="dark">{children}</ThemeContext>
}

// ❌ Old way (still works but will be deprecated)
function App({ children }) {
  return <ThemeContext.Provider value="dark">{children}</ThemeContext.Provider>
}
```

### Cleanup functions for refs

```typescript
<input
  ref={(ref) => {
    // ref created
    
    // NEW: return cleanup function
    return () => {
      // ref cleanup
    }
  }}
/>
```

### `useDeferredValue` initial value

```typescript
function Search({ deferredValue }) {
  // On initial render the value is ''
  // Then a re-render is scheduled with the deferredValue
  const value = useDeferredValue(deferredValue, '')
  
  return <Results query={value} />
}
```

### Document Metadata

Native support for `<title>`, `<link>`, and `<meta>`:

```typescript
function BlogPost({ post }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <title>{post.title}</title>
      <meta name="author" content="Josh" />
      <link rel="author" href="https://twitter.com/joshcstory/" />
      <meta name="keywords" content={post.keywords} />
      <p>Content...</p>
    </article>
  )
}
```

### Stylesheets Support

Built-in stylesheet management with precedence:

```typescript
function ComponentOne() {
  return (
    <Suspense fallback="loading...">
      <link rel="stylesheet" href="foo" precedence="default" />
      <link rel="stylesheet" href="bar" precedence="high" />
      <article className="foo-class bar-class">...</article>
    </Suspense>
  )
}
```

### Async Scripts Support

Automatic deduplication and optimization:

```typescript
function MyComponent() {
  return (
    <div>
      <script async={true} src="..." />
      Hello World
    </div>
  )
}
```

### Resource Preloading

New APIs for optimizing resource loading:

```typescript
import { prefetchDNS, preconnect, preload, preinit } from 'react-dom'

function MyComponent() {
  preinit('https://.../path/to/some/script.js', { as: 'script' })
  preload('https://.../path/to/font.woff', { as: 'font' })
  preload('https://.../path/to/stylesheet.css', { as: 'style' })
  prefetchDNS('https://...')
  preconnect('https://...')
}
```

## React Server Components

### Server Components

Components that render on the server before bundling:

```typescript
// Server Component (runs on server)
async function ServerComponent() {
  const data = await fetchData()
  return <div>{data}</div>
}
```

### Server Actions

Execute server functions from client components:

```typescript
// server.ts
'use server'

export async function updateData(formData: FormData) {
  const name = formData.get('name')
  // server-side logic
  return { success: true }
}

// client.tsx
'use client'

import { updateData } from './server'

function Form() {
  return (
    <form action={updateData}>
      <input name="name" />
      <button type="submit">Submit</button>
    </form>
  )
}
```

## Best Practices

### Use Actions for Data Mutations

```typescript
// ✅ Good: Use Actions with useTransition
function UpdateForm() {
  const [isPending, startTransition] = useTransition()
  
  const handleSubmit = () => {
    startTransition(async () => {
      await updateData()
    })
  }
  
  return <button onClick={handleSubmit} disabled={isPending}>Update</button>
}
```

### Use `use` Hook for Promises

```typescript
// ✅ Good: Pass promise from outside
function Component({ dataPromise }) {
  const data = use(dataPromise)
  return <div>{data}</div>
}

// ❌ Bad: Create promise in render
function Component() {
  const data = use(fetchData()) // Don't do this!
  return <div>{data}</div>
}
```

### Optimize with `useOptimistic`

```typescript
// ✅ Good: Show immediate feedback
function LikeButton({ postId, initialLikes }) {
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    initialLikes,
    (state, amount) => state + amount
  )
  
  const handleLike = async () => {
    addOptimisticLike(1)
    await likePost(postId)
  }
  
  return <button onClick={handleLike}>{optimisticLikes} likes</button>
}
```

### Use Form Actions

```typescript
// ✅ Good: Use form actions with useActionState
function ContactForm() {
  const [state, formAction] = useActionState(submitForm, null)
  
  return (
    <form action={formAction}>
      <input name="email" />
      <button type="submit">Send</button>
      {state?.error && <p>{state.error}</p>}
    </form>
  )
}
```

## Error Handling

### Better Error Reporting

React 19 provides improved error messages with:
- Single consolidated error logs
- `onCaughtError`: Errors caught by Error Boundaries
- `onUncaughtError`: Errors not caught by Error Boundaries
- `onRecoverableError`: Automatically recovered errors

```typescript
import { createRoot } from 'react-dom/client'

const root = createRoot(document.getElementById('root'), {
  onCaughtError: (error, errorInfo) => {
    console.error('Caught error:', error, errorInfo)
  },
  onUncaughtError: (error, errorInfo) => {
    console.error('Uncaught error:', error, errorInfo)
  },
  onRecoverableError: (error, errorInfo) => {
    console.error('Recoverable error:', error, errorInfo)
  }
})

root.render(<App />)
```

## Hydration Improvements

### Better Hydration Error Messages

React 19 shows diffs for hydration mismatches:

```
Uncaught Error: Hydration failed because the server rendered HTML didn't match the client.

<App>
  <span>
+   Client
-   Server
```

### Third-party Script Compatibility

Improved hydration with third-party scripts and browser extensions.

## Custom Elements Support

Full support for Web Components:

```typescript
// React 19 handles custom elements properly
function App() {
  return (
    <my-custom-element
      stringProp="value"
      objectProp={{ key: 'value' }}
      onCustomEvent={(e) => console.log(e)}
    />
  )
}
```

## Migration Notes

### Deprecated Features

- `forwardRef` → Use `ref` as prop
- `<Context.Provider>` → Use `<Context>`
- Implicit ref callback returns → Use explicit cleanup functions

### Breaking Changes

See the [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide) for full details.

## Resources

- [React 19 Release](https://react.dev/blog/2024/12/05/react-19)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [React Reference](https://react.dev/reference/react)
- [Custom Elements Everywhere](https://custom-elements-everywhere.com/)
