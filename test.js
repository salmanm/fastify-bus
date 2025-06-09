const { test } = require('node:test')
const assert = require('node:assert/strict')
const Fastify = require('fastify')
const { setImmediate } = require('node:timers/promises')

const { fastifyBus } = require('.')

test('registers a scoped message bus and communicates between emitter and listener', async (t) => {
  const fastify = Fastify()
  await fastify.register(fastifyBus)

  // register first plugin
  fastify.register(async (fastify, opts) => {
    const configBus = fastify.bus.register('config')

    // register a dummy route to trigger the bus
    fastify.get('/test', async (request, reply) => {
      await configBus.emit('updated', { flags: { beta: true } })
    })
  })

  const handler = t.mock.fn()

  // register second plugin
  fastify.register(async (fastify, opts) => {
    fastify.bus.get('config').on('updated', handler)
  })

  await fastify.ready()
  await fastify.inject({ method: 'GET', url: '/test' }) // Trigger the event by calling the route

  assert.deepEqual(handler.mock.calls[0].arguments, [{ flags: { beta: true } }])
})

test('throws if the same namespace is registered twice', async (t) => {
  const fastify = Fastify()
  await fastify.register(fastifyBus)
  await fastify.ready()

  fastify.bus.register('test')

  assert.throws(() => fastify.bus.register('test'), /Bus already registered for namespace/)
})

test('supports multiple isolated namespaces', async (t) => {
  const fastify = Fastify()
  await fastify.register(fastifyBus)
  await fastify.ready()

  const a = fastify.bus.register('a')
  const b = fastify.bus.register('b')

  let gotA = null
  let gotB = null

  fastify.bus.get('a').on('ping', (v) => (gotA = v))
  fastify.bus.get('b').on('ping', (v) => (gotB = v))

  await a.emit('ping', 'fromA')
  await b.emit('ping', 'fromB')

  // Wait for event loop
  await setImmediate()

  assert.equal(gotA, 'fromA')
  assert.equal(gotB, 'fromB')
})

test('off() removes event listener', async (t) => {
  const fastify = Fastify()
  await fastify.register(fastifyBus)
  await fastify.ready()

  const bus = fastify.bus.register('off-test')
  const handler = t.mock.fn()

  fastify.bus.get('off-test').on('update', handler)
  await bus.emit('update', {})
  fastify.bus.get('off-test').off('update', handler)
  await bus.emit('update', {})

  await setImmediate()

  assert.equal(handler.mock.calls.length, 1)
})

test('once() calls handler only once', async (t) => {
  const fastify = Fastify()
  await fastify.register(fastifyBus)
  await fastify.ready()

  const bus = fastify.bus.register('once-test')
  const handler = t.mock.fn()

  bus.once('update', handler)

  await bus.emit('update', {})
  await bus.emit('update', {})

  await setImmediate()

  assert.equal(handler.mock.calls.length, 1)
})

test('clearListeners() clears all listeners', async (t) => {
  const fastify = Fastify()
  await fastify.register(fastifyBus)
  await fastify.ready()

  const bus = fastify.bus.register('clear-test')

  const handler = t.mock.fn()
  bus.on('update', handler)
  bus.clearListeners()

  await bus.emit('update', {})
  await bus.emit('update', {})

  await setImmediate()

  assert.equal(handler.mock.calls.length, 0)
})

test('get() throws if namespace is not registered', async (t) => {
  const fastify = Fastify()
  await fastify.register(fastifyBus)

  assert.throws(() => {
    fastify.bus.get('non-existent-namespace')
  }, /Bus for namespace 'non-existent-namespace' is not registered/)
})

test('has() checks if namespace is registered', async (t) => {
  const fastify = Fastify()
  await fastify.register(fastifyBus)

  fastify.bus.register('existing-namespace')

  assert.equal(fastify.bus.has('existing-namespace'), true)
  assert.equal(fastify.bus.has('non-existing-namespace'), false)
})

test('inspect() returns registered namespaces', async (t) => {
  const fastify = Fastify()
  await fastify.register(fastifyBus)

  fastify.bus.register('namespace1')
  fastify.bus.register('namespace2')

  const namespaces = fastify.bus.inspect()

  assert.deepEqual(namespaces, ['namespace1', 'namespace2'])
})

test('register() throws if namespace is invalid', async (t) => {
  const fastify = Fastify()
  await fastify.register(fastifyBus)
  await fastify.ready()

  assert.throws(() => fastify.bus.register('invalid namespace!'), /Invalid namespace "invalid namespace!"/)
})
