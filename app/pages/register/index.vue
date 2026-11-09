<script setup lang="ts">
import type { Course, Enrollment, Location, Registration } from '~/types'
import type { CardDetails } from '~/composables/useCheckout'
import type { Step } from '~/stores/registration'

definePageMeta({ layout: 'register' })
useSeoMeta({ title: 'Register & enroll' })

const reg = useRegistrationStore()
const api = useApi()
const lookups = useLookups()
const route = useRoute()
const toast = useToast()
const { friendlyError, validationErrors } = useApiError()
const { user, isStudent, isStaff, refreshIdentity } = useCurrentUser()
const checkout = useCheckout()
const hydrated = useHydrated()

const tried = ref(false)
const submitting = ref(false)
const serverErrors = ref<string[]>([])
const loadError = ref('')

onMounted(async () => {
  if (!reg.created) reg.start(isStudent.value)
  try {
    const [courses, locations] = await Promise.all([
      api.get<Course[]>('/courses'),
      api.get<Location[]>('/locations'),
      lookups.load(),
      checkout.loadConfig()
    ])
    reg.courses = courses
    reg.locations = locations
    reg.preselect(typeof route.query.course === 'string' ? route.query.course : undefined)
  } catch (e) {
    loadError.value = friendlyError(e)
  }
})

const errors = computed(() => (tried.value ? reg.errorsFor() : []))

function next() {
  tried.value = true
  serverErrors.value = []
  if (reg.errorsFor().length) return
  tried.value = false
  if (reg.step === 'review') {
    createEnrollments()
    return
  }
  reg.next()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function back() {
  tried.value = false
  serverErrors.value = []
  reg.back()
}

const FIELD_STEP: Record<string, Step> = {
  email: 'account', mobile: 'account', password: 'account',
  first_name: 'personal', last_name: 'personal', middle_name: 'personal', birthdate: 'personal', sex: 'personal', education: 'personal', address: 'personal',
  location_id: 'location', set_ids: 'courses'
}

async function createEnrollments() {
  submitting.value = true
  try {
    let enrollments: Enrollment[]
    if (reg.existingStudent) {
      enrollments = await api.post<Enrollment[]>('/student/enrollments', { location_id: reg.locationId, set_ids: Object.values(reg.selections) })
    } else {
      const result = await api.post<Registration>('/registrations', reg.registrationPayload())
      enrollments = result.enrollments
      await refreshIdentity()
    }
    reg.enrollments = enrollments
    plans.value = Object.fromEntries(enrollments.map(e => [e.id, 'down_payment']))
    reg.next()
  } catch (e) {
    const fieldErrors = validationErrors(e)
    serverErrors.value = fieldErrors.length ? fieldErrors.map(f => f.message) : [friendlyError(e)]
    const first = fieldErrors.map(f => FIELD_STEP[(f.name ?? '').split('.')[0] ?? '']).find(Boolean)
    if (first) reg.goTo(first)
  } finally {
    submitting.value = false
  }
}

/* ---------- Payment step ---------- */
const plans = ref<Record<number, 'down_payment' | 'full'>>({})
const processing = ref(false)
const processingText = ref('')
const qrImage = ref<string | null>(null)

const payRows = computed(() => reg.enrollments.map((e) => {
  const plan = plans.value[e.id] ?? 'down_payment'
  return { enrollment: e, plan, amount: plan === 'full' ? e.balance : Math.min(e.min_down_payment, e.balance) }
}))
const payToday = computed(() => payRows.value.reduce((a, r) => a + r.amount, 0))
const dpTotal = computed(() => reg.enrollments.reduce((a, e) => a + Math.min(e.min_down_payment, e.balance), 0))
const feeTotal = computed(() => reg.enrollments.reduce((a, e) => a + e.fee, 0))

async function pay(method: string, card?: CardDetails) {
  processing.value = true
  const label = checkout.config.value?.methods.find(m => m.code === method)?.label ?? method
  processingText.value = method === 'card' ? 'Confirming with your bank. Please don’t close this page.' : `Waiting for ${label} to confirm. Please don’t close this page.`
  try {
    const { payment, qr } = await checkout.pay(payRows.value.map(r => ({ enrollment_id: r.enrollment.id, amount_type: r.plan })), method, card)
    let result = payment
    if (qr) {
      qrImage.value = qr.image_url ?? null
      result = await checkout.waitForResult(payment.id)
    }
    if (result.status === 'paid' || result.status === 'verified') {
      reg.$reset()
      await navigateTo({ path: '/register/success', query: { payment: result.id } })
      return
    }
    toast.add({ title: 'Payment didn’t go through', description: result.failure_reason ?? 'Please try again or use another method.', color: 'error', icon: 'i-lucide-circle-alert' })
  } catch (e) {
    toast.add({ title: 'Payment didn’t go through', description: friendlyError(e), color: 'error', icon: 'i-lucide-circle-alert' })
  } finally {
    processing.value = false
    qrImage.value = null
  }
}

const reviewRows = computed(() => ({
  password: reg.account.password ? '•'.repeat(Math.min(reg.account.password.length, 12)) : '— not provided',
  name: [reg.personal.first_name, reg.personal.middle_name, reg.personal.last_name].filter(Boolean).join(' ') || '— not provided'
}))
</script>

<template>
  <div>
    <UAlert
      v-if="isStaff"
      color="neutral"
      variant="subtle"
      title="You’re signed in with a staff account"
      description="Log out first to register a new student."
      class="mb-6"
    />
    <template v-else>
      <h1 class="display m-0 text-[40px]">
        {{ reg.existingStudent ? 'Enroll in more courses' : 'Student registration' }}
      </h1>
      <p class="mt-1.5 mb-6 text-ink-600">
        {{ reg.existingStudent
          ? `Signed in as ${user?.student?.full_name ?? user?.name}. Choose a training location and courses, then pay your down payment.`
          : 'Create your login, choose your training location and courses, then pay your down payment to enroll.' }}
      </p>
      <UAlert
        v-if="loadError"
        color="error"
        variant="subtle"
        :title="loadError"
        class="mb-4"
      />
      <EnrollStepper />

      <div class="flex flex-wrap items-start gap-6">
        <section class="min-w-0 flex-[999_1_560px] rounded-2xl border border-line bg-white p-7">
          <!-- 1 Account -->
          <template v-if="reg.step === 'account'">
            <h2 class="m-0 mb-1 text-[21px] font-semibold">
              Create your login
            </h2>
            <p class="mt-0 mb-5 text-sm text-ink-600">
              You’ll use these to access the student portal.
            </p>
            <div class="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
              <UFormField
                label="Email address"
                help="Used for login and email notifications"
                required
              >
                <UInput
                  v-model="reg.account.email"
                  type="email"
                  autocomplete="email"
                  placeholder="you@email.com"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Mobile number"
                help="For SMS updates on your application"
                required
              >
                <UInput
                  v-model="reg.account.mobile"
                  type="tel"
                  autocomplete="tel"
                  placeholder="09XX XXX XXXX"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Password"
                required
              >
                <UInput
                  v-model="reg.account.password"
                  type="password"
                  autocomplete="new-password"
                  placeholder="At least 8 characters"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Confirm password"
                required
              >
                <UInput
                  v-model="reg.account.password_confirmation"
                  type="password"
                  autocomplete="new-password"
                  placeholder="Repeat password"
                  class="w-full"
                />
              </UFormField>
            </div>
          </template>

          <!-- 2 Personal -->
          <template v-else-if="reg.step === 'personal'">
            <h2 class="m-0 mb-1 text-[21px] font-semibold">
              Personal information
            </h2>
            <p class="mt-0 mb-5 text-sm text-ink-600">
              Match the details on your valid ID — these appear on your TESDA records.
            </p>
            <div class="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
              <UFormField
                label="First name"
                required
              >
                <UInput
                  v-model="reg.personal.first_name"
                  autocomplete="given-name"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Middle name">
                <UInput
                  v-model="reg.personal.middle_name"
                  autocomplete="additional-name"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Last name"
                required
              >
                <UInput
                  v-model="reg.personal.last_name"
                  autocomplete="family-name"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Birthdate">
                <UInput
                  v-model="reg.personal.birthdate"
                  type="date"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Sex">
                <USelect
                  v-model="reg.personal.sex"
                  :items="lookups.items('sexes')"
                  placeholder="Select"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Highest education">
                <USelect
                  v-model="reg.personal.education"
                  :items="lookups.items('education_levels')"
                  placeholder="Select"
                  class="w-full"
                />
              </UFormField>
            </div>
            <UFormField
              label="Complete address"
              class="mt-4"
            >
              <UInput
                v-model="reg.personal.address"
                autocomplete="street-address"
                placeholder="House no., street, barangay, city, province"
                class="w-full"
              />
            </UFormField>
          </template>

          <!-- 3 Location -->
          <template v-else-if="reg.step === 'location'">
            <h2 class="m-0 mb-1 text-[21px] font-semibold">
              Choose your training location
            </h2>
            <p class="mt-0 mb-5 text-sm text-ink-600">
              Pick the partner meat shop where you’d like to do your hands-on training.
            </p>
            <div
              role="radiogroup"
              aria-label="Training location"
              class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-3.5"
            >
              <EnrollLocationCard
                v-for="l in reg.locations"
                :key="l.id"
                :location="l"
                :checked="reg.locationId === l.id"
                @pick="reg.locationId = l.id"
              />
            </div>
          </template>

          <!-- 4 Courses -->
          <template v-else-if="reg.step === 'courses'">
            <h2 class="m-0 mb-1 text-[21px] font-semibold">
              Choose your courses
            </h2>
            <p class="mt-0 mb-5 text-sm text-ink-600">
              Select one or more courses, then pick the batch and set (schedule) you want to join.
            </p>
            <div class="flex flex-col gap-3.5">
              <EnrollCourseSelectCard
                v-for="c in reg.courses"
                :key="c.id"
                :course="c"
                :selected-set-id="reg.selections[c.id]"
                @toggle="reg.toggleCourse(c)"
                @pick="reg.pickSet(c, $event)"
              />
            </div>
          </template>

          <!-- 5 Review -->
          <template v-else-if="reg.step === 'review'">
            <h2 class="m-0 mb-1 text-[21px] font-semibold">
              Review your details
            </h2>
            <p class="mt-0 mb-4.5 text-sm text-ink-600">
              Check everything before you continue to payment. Use Edit to change a section.
            </p>
            <div class="flex flex-col gap-3">
              <section
                v-if="!reg.existingStudent"
                class="rounded-xl border border-line px-4 py-3.5"
                aria-label="Account"
              >
                <div class="mb-2 flex items-center justify-between">
                  <h3 class="m-0 text-[15px] font-semibold">
                    Account
                  </h3>
                  <UButton
                    variant="ghost"
                    size="sm"
                    label="Edit"
                    @click="reg.goTo('account')"
                  />
                </div>
                <dl class="m-0 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-5 gap-y-2.5 text-sm">
                  <div>
                    <dt class="text-xs text-ink-500">
                      Email / login
                    </dt><dd class="m-0 font-semibold break-words">
                      {{ reg.account.email }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-xs text-ink-500">
                      Mobile
                    </dt><dd class="m-0 font-semibold">
                      {{ reg.account.mobile }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-xs text-ink-500">
                      Password
                    </dt><dd class="m-0 font-semibold">
                      {{ reviewRows.password }}
                    </dd>
                  </div>
                </dl>
              </section>
              <section
                v-if="!reg.existingStudent"
                class="rounded-xl border border-line px-4 py-3.5"
                aria-label="Personal information"
              >
                <div class="mb-2 flex items-center justify-between">
                  <h3 class="m-0 text-[15px] font-semibold">
                    Personal information
                  </h3>
                  <UButton
                    variant="ghost"
                    size="sm"
                    label="Edit"
                    @click="reg.goTo('personal')"
                  />
                </div>
                <dl class="m-0 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-5 gap-y-2.5 text-sm">
                  <div>
                    <dt class="text-xs text-ink-500">
                      Full name
                    </dt><dd class="m-0 font-semibold">
                      {{ reviewRows.name }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-xs text-ink-500">
                      Birthdate
                    </dt><dd class="m-0 font-semibold">
                      {{ reg.personal.birthdate ? fullDate(reg.personal.birthdate) : '— not provided' }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-xs text-ink-500">
                      Sex
                    </dt><dd class="m-0 font-semibold">
                      {{ lookups.label('sexes', reg.personal.sex) || '— not provided' }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-xs text-ink-500">
                      Highest education
                    </dt><dd class="m-0 font-semibold">
                      {{ lookups.label('education_levels', reg.personal.education) || '— not provided' }}
                    </dd>
                  </div>
                  <div class="col-span-full">
                    <dt class="text-xs text-ink-500">
                      Address
                    </dt><dd class="m-0 font-semibold">
                      {{ reg.personal.address || '— not provided' }}
                    </dd>
                  </div>
                </dl>
              </section>
              <section
                class="rounded-xl border border-line px-4 py-3.5"
                aria-label="Training location"
              >
                <div class="mb-2 flex items-center justify-between">
                  <h3 class="m-0 text-[15px] font-semibold">
                    Training location
                  </h3>
                  <UButton
                    variant="ghost"
                    size="sm"
                    label="Edit"
                    @click="reg.goTo('location')"
                  />
                </div>
                <dl
                  v-if="reg.location"
                  class="m-0 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-5 gap-y-2.5 text-sm"
                >
                  <div>
                    <dt class="text-xs text-ink-500">
                      Partner shop
                    </dt><dd class="m-0 font-semibold">
                      {{ reg.location.name }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-xs text-ink-500">
                      Contact
                    </dt><dd class="m-0 font-semibold">
                      {{ reg.location.contact_person }} · {{ reg.location.mobile }}
                    </dd>
                  </div>
                  <div class="col-span-full">
                    <dt class="text-xs text-ink-500">
                      Address
                    </dt><dd class="m-0 font-semibold">
                      {{ reg.location.street }}, Brgy. {{ reg.location.barangay }}, {{ reg.location.city }}, {{ reg.location.province }}
                    </dd>
                  </div>
                </dl>
              </section>
              <section
                class="rounded-xl border border-line px-4 py-3.5"
                aria-label="Courses"
              >
                <div class="mb-2 flex items-center justify-between">
                  <h3 class="m-0 text-[15px] font-semibold">
                    Courses
                  </h3>
                  <UButton
                    variant="ghost"
                    size="sm"
                    label="Edit"
                    @click="reg.goTo('courses')"
                  />
                </div>
                <ul class="m-0 flex list-none flex-col gap-2 p-0 text-sm">
                  <li
                    v-for="s in reg.selected"
                    :key="s.course.id"
                    class="flex flex-wrap justify-between gap-3"
                  >
                    <span><strong>{{ s.course.name }}</strong>
                      <span class="block text-xs text-ink-600">{{ s.batchName }} · {{ s.set.name }}</span>
                      <span class="block text-xs text-ink-600">{{ longDate(s.set.start_date) }} – {{ longDate(s.set.end_date) }} · {{ s.set.training_days }} training days · {{ s.set.time_label }}</span>
                    </span>
                    <span class="text-right"><strong>{{ peso(s.course.fee) }}</strong><span class="block text-xs text-ink-600">min. down {{ peso(s.course.min_down_payment) }}</span></span>
                  </li>
                </ul>
                <div class="mt-2.5 flex justify-between border-t border-dashed border-line-strong pt-2.5 text-sm">
                  <span>Total course fees</span><strong class="text-brand-600">{{ peso(reg.totalFee) }}</strong>
                </div>
              </section>
              <section
                class="flex flex-col gap-2.5 rounded-xl border border-line px-4 py-3.5"
                aria-label="Notifications and consent"
              >
                <h3 class="m-0 text-[15px] font-semibold">
                  Notifications
                </h3>
                <template v-if="!reg.existingStudent">
                  <UCheckbox
                    v-model="reg.notifications.email"
                    label="Email me about my application"
                  />
                  <UCheckbox
                    v-model="reg.notifications.sms"
                    label="Text me (SMS) about my application"
                  />
                </template>
                <UCheckbox
                  v-model="reg.agreed"
                  class="mt-1.5"
                  label="I confirm the information is accurate and agree to the Terms and Data Privacy Notice."
                />
              </section>
              <p
                v-if="!reg.existingStudent && reg.missingOptional.length"
                role="status"
                class="note m-0 text-[13px]"
              >
                Not filled in yet: {{ reg.missingOptional.join(', ') }}. You can still continue and complete these later in your profile.
              </p>
            </div>
          </template>

          <!-- 6 Payment -->
          <template v-else-if="reg.step === 'payment'">
            <h2 class="m-0 mb-1 text-[21px] font-semibold">
              Payment
            </h2>
            <p class="mt-0 mb-4.5 text-sm text-ink-600">
              Pay your down payment to confirm your enrollment. Your slots are held for 30 minutes.
            </p>
            <div
              role="note"
              class="note mb-4.5"
            >
              <ul class="m-0 pl-4.5">
                <li>Must have a down payment of <strong>{{ peso(dpTotal) }}</strong> and the remaining <strong>{{ peso(feeTotal - dpTotal) }}</strong> will be payable upon starting.</li>
              </ul>
              <div class="mt-1.5 text-xs text-ink-600">
                {{ reg.enrollments.map(e => `${e.course?.name}: ${peso(e.min_down_payment)} down`).join(' · ') }}
              </div>
            </div>
            <PaymentProcessing
              v-if="processing && qrImage"
              :text="processingText"
              :qr-image="qrImage"
            />
            <template v-else>
              <h3 class="m-0 mb-2.5 text-[15px] font-semibold">
                Amount to pay today
              </h3>
              <div class="mb-4.5 flex flex-col gap-2.5">
                <div
                  v-for="r in payRows"
                  :key="r.enrollment.id"
                  class="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-line px-3.5 py-3"
                >
                  <span class="flex-[1_1_200px]"><strong class="text-sm">{{ r.enrollment.course?.name }}</strong><span class="block text-xs text-ink-600">Course fee {{ peso(r.enrollment.fee) }}</span></span>
                  <span
                    role="radiogroup"
                    :aria-label="`Amount for ${r.enrollment.course?.name}`"
                    class="flex flex-wrap gap-2"
                  >
                    <button
                      v-for="opt in [{ v: 'down_payment', l: 'Down payment', a: Math.min(r.enrollment.min_down_payment, r.enrollment.balance) }, { v: 'full', l: 'Full payment', a: r.enrollment.balance }]"
                      :key="opt.v"
                      type="button"
                      role="radio"
                      :aria-checked="r.plan === opt.v"
                      class="min-h-13 cursor-pointer rounded-xl border-[1.5px] bg-white px-3 py-2 text-sm font-semibold"
                      :class="r.plan === opt.v ? 'border-brand-600 bg-brand-50 shadow-[inset_0_0_0_2px_#A3161A]' : 'border-line-strong'"
                      :disabled="processing"
                      @click="plans[r.enrollment.id] = opt.v as 'down_payment' | 'full'"
                    >
                      {{ opt.l }}<br><span class="text-xs font-medium text-ink-600">{{ peso(opt.a) }}</span>
                    </button>
                  </span>
                </div>
              </div>
              <div
                v-if="processing"
                class="mb-4"
              >
                <PaymentProcessing :text="processingText" />
              </div>
              <PaymentMethods
                :amount="payToday"
                :processing="processing"
                @pay="pay"
              />
            </template>
          </template>

          <div
            v-if="errors.length || serverErrors.length"
            role="alert"
            class="mt-4 text-sm font-medium text-brand-600"
          >
            <p
              v-for="m in [...errors, ...serverErrors]"
              :key="m"
              class="m-0"
            >
              {{ m }}
            </p>
          </div>

          <div
            v-if="reg.step !== 'payment'"
            class="mt-7 flex flex-wrap justify-between gap-3"
          >
            <UButton
              v-if="reg.stepIndex > 0"
              variant="outline"
              label="Back"
              @click="back"
            />
            <UButton
              v-else
              to="/"
              variant="outline"
              label="Cancel"
            />
            <UButton
              :label="reg.step === 'review' ? 'Continue to payment' : 'Continue'"
              :loading="submitting"
              :disabled="!hydrated || (reg.step === 'review' && !reg.agreed)"
              @click="next"
            />
          </div>
        </section>

        <EnrollSummary :paying-today="reg.step === 'payment' ? payToday : null" />
      </div>
    </template>
  </div>
</template>
