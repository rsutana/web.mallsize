import { defineStore } from 'pinia'
import type { BatchSet, Course, Enrollment, Location } from '~/types'

export interface SelectedCourse {
  course: Course
  set: BatchSet
  batchName: string
}

export type Step = 'account' | 'personal' | 'location' | 'courses' | 'review' | 'payment'

const NEW_STUDENT_STEPS: Step[] = ['account', 'personal', 'location', 'courses', 'review', 'payment']
const EXISTING_STUDENT_STEPS: Step[] = ['location', 'courses', 'review', 'payment']

export const STEP_LABELS: Record<Step, string> = {
  account: 'Account',
  personal: 'Personal info',
  location: 'Locations',
  courses: 'Courses',
  review: 'Review',
  payment: 'Payment'
}

/**
 * Registration & enrollment wizard state. Totals here are previews only —
 * the API recomputes every amount at checkout.
 */
export const useRegistrationStore = defineStore('registration', () => {
  const existingStudent = ref(false)
  const stepIndex = ref(0)

  const account = reactive({ email: '', mobile: '', password: '', password_confirmation: '' })
  const personal = reactive({ first_name: '', middle_name: '', last_name: '', birthdate: '', sex: '', education: '', address: '' })
  const locationId = ref<number | null>(null)
  /** course id → chosen set id */
  const selections = ref<Record<number, number>>({})
  const notifications = reactive({ email: true, sms: true })
  const agreed = ref(false)

  /** Pending enrollments created on "Continue to payment". */
  const enrollments = ref<Enrollment[]>([])

  const courses = ref<Course[]>([])
  const locations = ref<Location[]>([])

  const steps = computed(() => (existingStudent.value ? EXISTING_STUDENT_STEPS : NEW_STUDENT_STEPS))
  const step = computed<Step>(() => steps.value[stepIndex.value] ?? 'account')
  const created = computed(() => enrollments.value.length > 0)

  const location = computed(() => locations.value.find(l => l.id === locationId.value) ?? null)

  const selected = computed<SelectedCourse[]>(() => courses.value.flatMap((course) => {
    const setId = selections.value[course.id]
    for (const batch of course.batches ?? []) {
      const set = batch.sets?.find(s => s.id === setId)
      if (set) return [{ course, set, batchName: batch.name }]
    }
    return []
  }))

  const totalFee = computed(() => selected.value.reduce((sum, s) => sum + s.course.fee, 0))
  const totalDownPayment = computed(() => selected.value.reduce((sum, s) => sum + s.course.min_down_payment, 0))

  function accountErrors(): string[] {
    const errors: string[] = []
    if (!/^\S+@\S+\.\S+$/.test(account.email)) errors.push('Enter a valid email address.')
    if (!/^(\+?63|0)9\d{2}\s?\d{3}\s?\d{4}$/.test(account.mobile.trim())) errors.push('Enter a mobile number like 0917 555 0148.')
    if (account.password.length < 8 || account.password !== account.password_confirmation) errors.push('Passwords must match and be at least 8 characters.')
    return errors
  }

  function personalErrors(): string[] {
    const errors: string[] = []
    if (!personal.first_name.trim()) errors.push('Enter your first name.')
    if (!personal.last_name.trim()) errors.push('Enter your last name.')
    return errors
  }

  /** Validation messages for the current step; empty when it can continue. */
  function errorsFor(s: Step = step.value): string[] {
    switch (s) {
      case 'account': return accountErrors()
      case 'personal': return personalErrors()
      case 'location': return locationId.value ? [] : ['Choose a training location to continue.']
      case 'courses': return selected.value.length ? [] : ['Select at least one course to continue.']
      case 'review': return agreed.value ? [] : ['Please confirm your information and agree to the terms.']
      default: return []
    }
  }

  const missingOptional = computed(() => {
    const missing: string[] = []
    if (!personal.birthdate) missing.push('birthdate')
    if (!personal.sex) missing.push('sex')
    if (!personal.education) missing.push('education')
    if (!personal.address) missing.push('address')
    return missing
  })

  function goTo(s: Step) {
    const i = steps.value.indexOf(s)
    if (i >= 0 && !created.value) stepIndex.value = i
  }

  function next() {
    if (stepIndex.value < steps.value.length - 1) stepIndex.value++
  }

  function back() {
    if (stepIndex.value > 0 && !created.value) stepIndex.value--
  }

  function toggleCourse(course: Course) {
    if (selections.value[course.id]) {
      const { [course.id]: _, ...rest } = selections.value
      selections.value = rest
      return
    }
    const firstOpen = (course.batches ?? []).flatMap(b => b.status === 'open' ? (b.sets ?? []) : []).find(s => s.slots_left > 0)
    if (firstOpen) selections.value = { ...selections.value, [course.id]: firstOpen.id }
  }

  function pickSet(course: Course, set: BatchSet) {
    if (set.slots_left > 0) selections.value = { ...selections.value, [course.id]: set.id }
  }

  function preselect(slug: string | undefined) {
    const course = courses.value.find(c => c.slug === slug)
    if (course && !selections.value[course.id]) toggleCourse(course)
  }

  function registrationPayload() {
    return {
      ...account,
      ...personal,
      middle_name: personal.middle_name || null,
      birthdate: personal.birthdate || null,
      sex: personal.sex || null,
      education: personal.education || null,
      address: personal.address || null,
      location_id: locationId.value,
      set_ids: Object.values(selections.value),
      is_email_notifications: notifications.email,
      is_sms_notifications: notifications.sms,
      is_agreed: agreed.value
    }
  }

  function start(existing: boolean) {
    $reset()
    existingStudent.value = existing
  }

  function $reset() {
    stepIndex.value = 0
    Object.assign(account, { email: '', mobile: '', password: '', password_confirmation: '' })
    Object.assign(personal, { first_name: '', middle_name: '', last_name: '', birthdate: '', sex: '', education: '', address: '' })
    locationId.value = null
    selections.value = {}
    Object.assign(notifications, { email: true, sms: true })
    agreed.value = false
    enrollments.value = []
  }

  return {
    existingStudent, stepIndex, steps, step, account, personal, locationId, selections, notifications, agreed,
    enrollments, courses, locations, created, location, selected, totalFee, totalDownPayment, missingOptional,
    errorsFor, goTo, next, back, toggleCourse, pickSet, preselect, registrationPayload, start, $reset
  }
})
