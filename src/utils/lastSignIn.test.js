import { describe, it, expect, beforeEach } from 'vitest'
import {
  getLastSignIn, recordSignIn, markPendingSignIn, clearPendingSignIn,
  commitPendingSignIn, forgetLastSignIn,
} from './lastSignIn.js'

function memoryStorage() {
  const map = new Map()
  return {
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: k => map.delete(k),
  }
}

beforeEach(() => {
  globalThis.localStorage = memoryStorage()
  globalThis.sessionStorage = memoryStorage()
})

describe('lastSignIn', () => {
  it('has nothing before any sign-in', () => {
    expect(getLastSignIn()).toBe(null)
  })

  it('records a direct sign-in', () => {
    recordSignIn('email')
    expect(getLastSignIn()).toBe('email')
  })

  it('does not count a pending OAuth click until it is committed', () => {
    markPendingSignIn('google')
    expect(getLastSignIn()).toBe(null)
    commitPendingSignIn()
    expect(getLastSignIn()).toBe('google')
  })

  it('commits a pending click only once', () => {
    markPendingSignIn('github')
    commitPendingSignIn()
    recordSignIn('email')
    commitPendingSignIn()
    expect(getLastSignIn()).toBe('email')
  })

  it('drops an abandoned OAuth click', () => {
    recordSignIn('email')
    markPendingSignIn('google')
    clearPendingSignIn()
    commitPendingSignIn()
    expect(getLastSignIn()).toBe('email')
  })

  it('forgets everything', () => {
    recordSignIn('google')
    markPendingSignIn('github')
    forgetLastSignIn()
    commitPendingSignIn()
    expect(getLastSignIn()).toBe(null)
  })

  it('survives storage being unavailable', () => {
    delete globalThis.localStorage
    delete globalThis.sessionStorage
    expect(() => { markPendingSignIn('google'); commitPendingSignIn(); recordSignIn('email') }).not.toThrow()
    expect(getLastSignIn()).toBe(null)
  })
})
