import { describe, it, expect } from 'vitest'
import { codeFromText } from './signInCode.js'

describe('codeFromText', () => {
  it('takes a bare code', () => {
    expect(codeFromText('482917')).toBe('482917')
  })

  it('finds the code inside the email preview line', () => {
    expect(codeFromText('Your Lantern sign-in code is 482917. It expires in 10 minutes.')).toBe('482917')
  })

  it('joins a code split by a space or dash', () => {
    expect(codeFromText('482 917')).toBe('482917')
    expect(codeFromText('482-917')).toBe('482917')
  })

  it('trims surrounding whitespace and newlines', () => {
    expect(codeFromText('\n  482917 \n')).toBe('482917')
  })

  it('rejects text with no run of the right length', () => {
    expect(codeFromText('expires in 10 minutes')).toBeNull()
    expect(codeFromText('12345')).toBeNull()
    expect(codeFromText('1234567')).toBeNull()
    expect(codeFromText('')).toBeNull()
  })
})
