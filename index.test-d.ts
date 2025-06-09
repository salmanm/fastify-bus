import { expectType, expectError } from 'tsd'
import Fastify from 'fastify'
import { fastifyBus, EventBus, FastifyBus, EventsRegistry } from './index'

// augment fastify-bus

declare module '.' {
  interface EventsRegistry {
    'test-namespace': { event: string, other: number }
    'another-namespace': { anotherEvent: boolean }
  }
}

const app = Fastify()

// Test plugin registration
await app.register(fastifyBus)

// Test FastifyInstance augmentation
expectType<FastifyBus>(app.bus)

type AppEvents = { event: string, other: number }

// Test bus registration
const eventBus = app.bus.register('test-namespace')
expectType<EventBus<AppEvents>>(eventBus)

// Test bus existence check
const exists = app.bus.has('test-namespace')
expectType<boolean>(exists)

// Test bus inspection
const namespaces = app.bus.inspect()
expectType<Array<keyof EventsRegistry>>(namespaces)

// Test EventBus methods
expectType<Promise<void>>(eventBus.emit('event', 'payload'))

// Test event listeners
expectType<VoidFunction>(eventBus.on('event', (payload) => expectType<string>(payload)))
expectType<VoidFunction>(eventBus.on('other', (payload) => expectType<number>(payload)))

// Test async listeners
eventBus.on('event', async (payload) => expectType<string>(payload))

// Test off method
const offListener = (payload: string) => expectType<string>(payload)
expectType<VoidFunction>(eventBus.off('event', offListener))

// Test once method
expectType<VoidFunction>(eventBus.once('event', (payload) => expectType<string>(payload)))

// Test clearListeners
expectType<void>(eventBus.clearListeners('event'))

// Test error cases
expectError(app.bus.get('non-existent-namespace'))

// Test that bus methods are available after ready
app.ready().then(() => {
  expectType<FastifyBus>(app.bus)
  expectType<EventBus<AppEvents>>(app.bus.get('test-namespace'))
})
