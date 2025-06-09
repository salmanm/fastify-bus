# fastify-bus

A scoped, type-safe internal event bus for Fastify plugins. Keeps communication simple, contained, and free from tight coupling.

This plugin gives your Fastify app a clean way to let plugins talk to each other using event emitters, without reaching for global events or awkward `.emit()` chains on `fastify.server`.

---

## 💡 Why?

Let’s say you have:

- A config plugin fetches remote config that can change at runtime.
- A secrets plugin depends on those configs and must refresh keys or credentials whenever configs change.
- Another plugin uses those refreshed secrets to perform tasks like signing tokens or encrypting data.

Rather than chaining callbacks or exposing internals between plugins, you can now do:

```ts
const configBus = fastify.bus.register('config')

// and later...
await configBus.emit('updated', { flags: { newUI: true } })
```

Then in your secrets plugin:

```ts
const configBus = fastify.bus.get('config')

configBus.on('updated', (config) => {
  if (config.flags.newUI) {
    console.log('Let’s turn on the new UI!')
  }
})
```

No globals. No tight coupling. Just scoped communication.

---

## 🚀 Installation

```bash
npm install fastify-bus
# or
pnpm add fastify-bus
```

---

## 🛠 Usage

Register the plugin:

```ts
import Fastify from 'fastify'
import { fastifyBus } from 'fastify-bus'

const app = Fastify()
app.register(fastifyBus)
```

In a plugin:

```ts
// Register your namespace
const configBus = fastify.bus.register('config')

// Emit an event
await configBus.emit('updated', { flags: { featureX: true } })

// In another plugin, listen to it:
fastify.bus.get('config').on('updated', (data) => {
  console.log('Config updated:', data)
})
```

---

## ✅ TypeScript Support

You get full type-safety and autocomplete by extending the event registry:

```ts
// config-plugin.ts
declare module 'fastify-bus' {
  interface EventRegistry {
    config: {
      updated: { flags: { featureX: boolean } }
    }
  }
}

// secrets-plugin.ts
declare module 'fastify-bus' {
  interface EventRegistry {
    secrets: {
      refreshed: { keys: string[] }
    }
  }
}
```

- ✅ Type-safe `emit` payloads
- ✅ Type-safe `on`, `once`, `off` handlers
- ✅ IDE autocomplete and error checking

---

## 📚 API

### `fastify.bus.register(namespace): EventBus`

Registers a new message bus for a namespace.

* Throws if the namespace is already registered
* Validates namespace (must be alphanumeric or dash)

### `fastify.bus.get(namespace): EventBus`

Gets the bus instance for a namespace.

* Throws if the namespace hasn’t been registered

### `fastify.bus.has(namespace): boolean`

Returns true if the namespace has been registered.

### `fastify.bus.inspect(): string[]`

Returns a list of all registered namespaces.

---

## 🧰 EventBus API

Each namespace gives you an EventEmitter-like interface:

### `bus.on(event, handler)`

Listen for an event.

### `bus.once(event, handler)`

Listen once — auto-unsubscribes after the first emit.

### `bus.off(event, handler)`

Remove a specific handler.

### `bus.emit(event, payload)`

Emit an event. Returns a promise that resolves after all handlers run.

### `bus.clearListeners()`

Removes all listeners from the bus.

---

## ⚠️ Rules & Best Practices

* Namespaces should be unique.
* Event names should be descriptive and unique per namespace
* Cannot emit to or listen from unregistered namespaces
* If you're emitting events right after startup, use `fastify.ready()` or `setImmediate()` to ensure all listeners are in place.
* To avoid cyclic plugin dependencies, split plugin responsibilities (e.g. fetch config vs subscribe to changes).
* Keep the events local — don’t make this your app’s state manager

---

## ✅ Example Plugin Communication

```ts
// Plugin A: emit on 'cache:invalidated'
const bus = fastify.bus.register('cache')
// ...
bus.emit('invalidated', { key: 'user:123' })

// Plugin B: listen to 'cache:invalidated'
fastify.bus.get('cache').on('invalidated', (payload) => {
  console.log(`Clearing ${payload.key} from memory`)
})
```

---

## 📄 License

MIT
