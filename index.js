const { default: Emittery } = require('emittery')

function wrapEmitter (emitter) {
  return {
    emit (event, payload) {
      return emitter.emit(event, payload)
    },
    on (event, listener) {
      return emitter.on(event, listener)
    },
    off (event, listener) {
      return emitter.off(event, listener)
    },
    once (event, listener) {
      return emitter.once(event).then((result) => listener(result))
    },
    clearListeners (event) {
      return emitter.clearListeners(event)
    },
  }
}

const fastifyBus = (fastify, _, done) => {
  const buses = new Map()

  const bus = {
    register (namespace) {
      if (!/^[a-zA-Z0-9_-]+$/.test(namespace)) {
        throw new Error(`Invalid namespace "${namespace}"`)
      }

      if (buses.has(namespace)) {
        throw new Error(`Bus already registered for namespace "${namespace}"`)
      }

      const bus = wrapEmitter(new Emittery())
      buses.set(namespace, bus)
      return bus
    },

    get (namespace) {
      if (!buses.has(namespace)) {
        throw new Error(`Bus for namespace '${namespace}' is not registered`)
      }
      return buses.get(namespace)
    },

    has (namespace) {
      return buses.has(namespace)
    },

    inspect () {
      return Array.from(buses.keys())
    },
  }

  fastify.decorate('bus', bus)

  done()
}

// Avoid encapsulation
fastifyBus[Symbol.for('skip-override')] = true

module.exports.fastifyBus = fastifyBus
