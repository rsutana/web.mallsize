/**
 * Mirrors api.mallsize JSON resources one for one.
 * Money fields are integers in centavos. Dates are ISO strings.
 * Coded fields (status, method, …) hold lookup `code`s; `*_label` is display text.
 */

export interface Option {
  code: string
  label: string
}

export type LookupTable
  = 'user_roles' | 'course_statuses' | 'batch_statuses' | 'enrollment_statuses' | 'enrollment_payment_statuses'
    | 'payment_statuses' | 'payment_methods' | 'payment_amount_types' | 'location_types' | 'news_categories'
    | 'post_statuses' | 'orientation_formats' | 'social_platforms' | 'orientation_link_modes' | 'sexes'
    | 'education_levels' | 'gallery_tags'

export type Lookups = Record<LookupTable, Option[]>

export type Role = 'student' | 'staff' | 'admin'

export interface Student {
  id: number
  reference_no: string
  first_name: string
  middle_name: string | null
  last_name: string
  full_name: string
  birthdate: string | null
  sex: string | null
  sex_label: string | null
  education: string | null
  education_label: string | null
  address: string | null
  email?: string
  mobile?: string | null
}

export interface User {
  id: number
  name: string
  email: string
  mobile: string | null
  role: Role
  role_label: string
  is_email_notifications: boolean
  is_sms_notifications: boolean
  student?: Student | null
}

export interface Location {
  id: number
  name: string
  type: string
  type_label: string
  contact_person: string
  mobile: string
  email: string | null
  street: string | null
  barangay: string | null
  city: string
  province: string | null
  zip: string | null
  map_url: string | null
  notes?: string | null
  is_active: boolean
}

export interface BatchSet {
  id: number
  batch_id: number
  name: string
  slots: number
  slots_taken: number
  slots_left: number
  start_date: string
  end_date: string
  training_days: number
  time_label: string
}

export interface Batch {
  id: number
  course_id: number
  name: string
  status: string
  status_label: string
  sets?: BatchSet[]
}

export interface Course {
  id: number
  name: string
  slug: string
  description: string | null
  image_url: string | null
  fee: number
  min_down_payment: number
  status: string
  status_label: string
  sort_order: number
  batches?: Batch[]
  next_start_date?: string | null
  training_days?: number | null
  total_slots?: number
  slots_taken?: number
  enrolled_count?: number
}

export interface Enrollment {
  id: number
  status: string
  status_label: string
  fee: number
  min_down_payment: number
  amount_paid: number
  balance: number
  payment_status: 'fully_paid' | 'down_payment_only' | 'awaiting_payment'
  payment_status_label: string
  expires_at: string | null
  enrolled_at: string | null
  course?: { id: number, name: string, slug: string }
  batch?: Batch
  set?: BatchSet
  location?: Location
  student?: Student
}

export interface PaymentAllocation {
  enrollment_id: number
  amount: number
  amount_type: string
  amount_type_label: string
  course_name: string | null
}

export interface Payment {
  id: number
  reference_no: string
  amount: number
  method: string
  method_label: string
  status: 'pending' | 'paid' | 'verified' | 'failed' | 'rejected'
  status_label: string
  provider: string
  provider_reference: string | null
  failure_reason: string | null
  rejected_reason: string | null
  paid_at: string | null
  verified_at: string | null
  created_at: string | null
  allocations?: PaymentAllocation[]
  student?: Student
}

export interface NextAction {
  type: 'redirect' | 'qr'
  url?: string | null
  image_url?: string | null
}

export interface Checkout {
  payment: Payment
  next_action: NextAction | null
}

export interface PaymentConfig {
  driver: 'fake' | 'paymongo'
  public_key: string | null
  methods: Option[]
}

export interface NewsPost {
  id: number
  title: string
  slug: string
  category: string
  category_label: string
  summary: string | null
  body: string | null
  cover_url: string | null
  status: string
  status_label: string
  published_on: string | null
  is_featured: boolean
}

export interface Orientation {
  id: number
  title: string
  course_id: number | null
  course_name: string | null
  details: string | null
  date: string
  time_label: string | null
  format: string
  format_label: string
  venue: string | null
  is_social_linked: boolean
  social_platform: string | null
  social_platform_label: string | null
  social_url: string | null
  link_mode: 'direct' | 'details'
  link_mode_label: string
  status: string
  status_label: string
  is_notify_students: boolean
  notified_at: string | null
}

export interface GalleryPhoto {
  id: number
  title: string
  tag: string
  tag_label: string
  image_url: string | null
}

export interface Testimonial {
  id: number
  quote: string
  student_name: string
  course_label: string
  rating: number
}

export interface NotificationLog {
  id: number
  title: string
  channels: string
  recipients_count: number
  sent_at: string
}

export interface StudentDashboard {
  total_fee: number
  total_paid: number
  total_balance: number
  courses_count: number
  fully_paid_count: number
  with_balance_count: number
  next_training: { course_name: string, start_date: string } | null
  enrollments: Enrollment[]
}

/** Seat usage; pending_count = unexpired pending-payment holds. */
export interface SeatTotals {
  slots: number
  enrolled_count: number
  pending_count: number
  slots_taken: number
  slots_left: number
}

export interface SetCapacity extends SeatTotals {
  id: number
  name: string
  start_date: string
  end_date: string
  training_days: number
  time_label: string
}

export interface BatchCapacity extends SeatTotals {
  id: number
  name: string
  status: string
  status_label: string
  sets: SetCapacity[]
}

export interface CourseCapacity extends SeatTotals {
  id: number
  name: string
  status: string
  status_label: string
  batches: BatchCapacity[]
}

export interface AdminOverview {
  payments_to_verify: number
  enrolled_count: number
  collected: number
  outstanding: number
  due_soon: Enrollment[]
  notifications: NotificationLog[]
  courses: CourseCapacity[]
}

export interface Registration {
  user: User
  enrollments: Enrollment[]
}

export interface Wrapped<T> {
  data: T
}

export interface Paginated<T> {
  data: T[]
  meta: { current_page: number, last_page: number, per_page: number, total: number, from: number | null, to: number | null }
}
