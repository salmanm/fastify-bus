import { FastifyPluginCallback } from 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    bus: FastifyBus
  }
}

export type Events = Record<string, any>

export interface EventsRegistry {}

type Listener<T extends Events, K extends keyof T> = (payload: T[K]) => void | Promise<void>

export interface EventBus<T extends Events> {
  emit<K extends keyof T>(event: K, payload?: T[K]): Promise<void>
  on<K extends keyof T>(event: K, listener: Listener<T, K>): VoidFunction
  off<K extends keyof T>(event: K, listener: Listener<T, K>): VoidFunction
  once<K extends keyof T>(event: K, listener: Listener<T, K>): VoidFunction
  clearListeners<K extends keyof T>(event: K): void
}

export interface FastifyBus {
  register<T extends keyof EventsRegistry>(namespace: T): EventBus<EventsRegistry[T]>
  get<T extends keyof EventsRegistry>(namespace: T): EventBus<EventsRegistry[T]>
  has<T extends keyof EventsRegistry>(namespace: T): boolean
  inspect<T extends keyof EventsRegistry>(): T[]
}

export const fastifyBus: FastifyPluginCallback

export default fastifyBus
