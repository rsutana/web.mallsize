import { describe, expect, it } from 'vitest'
import { friendlyError, validationErrors } from '../../app/composables/useApiError'

describe('validationErrors', () => {
  it('maps Laravel 422 errors to form errors', () => {
    const error = { status: 422, data: { message: 'Invalid', errors: { 'email': ['Taken'], 'items.0.amount': ['Too low'] } } }

    expect(validationErrors(error)).toEqual([
      { name: 'email', message: 'Taken' },
      { name: 'items.0.amount', message: 'Too low' }
    ])
  })

  it('ignores non-validation failures', () => {
    expect(validationErrors({ status: 500 })).toEqual([])
  })
})

describe('friendlyError', () => {
  it('uses the first validation message', () => {
    expect(friendlyError({ status: 422, data: { errors: { set_ids: ['Set A is fully booked.'] } } })).toBe('Set A is fully booked.')
  })

  it('explains auth and network failures plainly', () => {
    expect(friendlyError({ status: 419 })).toContain('session expired')
    expect(friendlyError({})).toContain('couldn’t reach the server')
  })
})
