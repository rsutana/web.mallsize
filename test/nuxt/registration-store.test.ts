import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useRegistrationStore } from '../../app/stores/registration'
import type { Course } from '../../app/types'

const course = (id: number, slotsLeft = 5): Course => ({
  id,
  name: `Course ${id}`,
  slug: `course-${id}`,
  description: null,
  image_url: null,
  fee: 2_250_000,
  min_down_payment: 500_000,
  status: 'open',
  status_label: 'Open',
  sort_order: 0,
  batches: [{
    id: id * 10,
    course_id: id,
    name: 'Batch 1 — January 2027',
    status: 'open',
    status_label: 'Open',
    sets: [
      { id: id * 100, batch_id: id * 10, name: 'Set A', slots: 20, slots_taken: 20 - slotsLeft, slots_left: slotsLeft, start_date: '2027-01-11', end_date: '2027-01-20', training_days: 10, time_label: '8 AM – 5 PM' },
      { id: id * 100 + 1, batch_id: id * 10, name: 'Set B', slots: 20, slots_taken: 0, slots_left: 20, start_date: '2027-01-25', end_date: '2027-02-03', training_days: 10, time_label: '8 AM – 5 PM' }
    ]
  }]
})

describe('registration store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('validates the account step', () => {
    const reg = useRegistrationStore()
    reg.start(false)

    expect(reg.errorsFor('account')).toHaveLength(3)

    Object.assign(reg.account, { email: 'juan@email.com', mobile: '0917 555 0148', password: 'secret123', password_confirmation: 'secret123' })
    expect(reg.errorsFor('account')).toEqual([])
  })

  it('selects the first open set and totals the fees', () => {
    const reg = useRegistrationStore()
    reg.start(false)
    reg.courses = [course(1), course(2, 0)]

    reg.toggleCourse(reg.courses[0]!)
    reg.toggleCourse(reg.courses[1]!)

    expect(reg.selections).toEqual({ 1: 100, 2: 201 })
    expect(reg.totalFee).toBe(4_500_000)
    expect(reg.totalDownPayment).toBe(1_000_000)
  })

  it('skips account steps for existing students', () => {
    const reg = useRegistrationStore()
    reg.start(true)

    expect(reg.steps).toEqual(['location', 'courses', 'review', 'payment'])
    expect(reg.step).toBe('location')
  })

  it('locks earlier steps once enrollments exist', () => {
    const reg = useRegistrationStore()
    reg.start(false)
    reg.stepIndex = 5
    reg.enrollments = [{ id: 1 } as never]

    reg.back()
    reg.goTo('account')

    expect(reg.step).toBe('payment')
  })
})
