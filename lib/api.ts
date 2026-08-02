const API_URL = process.env.NEXT_PUBLIC_API_URL

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not set in .env.local')
}

export type Role = 'customer' | 'provider'

export interface AuthUser {
  id: string
  full_name: string
  email: string
  phone_number: string | null
  roles: Role[]
}

export interface AdminUser {
  id: string
  full_name: string
  email: string
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include', // required for HTTP-only cookies — see servifind-stack.md
    headers: isFormData
      ? { ...(options.headers || {}) }
      : { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new ApiError(data.error || 'Something went wrong', res.status)
  }

  return data as T
}

// -----------------------------
// Public auth — /api/auth/*
// -----------------------------

export function registerUser(input: {
  full_name: string
  email: string
  password: string
  phone_number?: string
  role: Role
}): Promise<AuthUser> {
  return request<AuthUser>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function loginUser(input: { email: string; password: string }): Promise<AuthUser> {
  return request<AuthUser>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function logoutUser(): Promise<{ message: string }> {
  return request('/api/auth/logout', { method: 'POST' })
}

export function getCurrentUser(): Promise<AuthUser> {
  return request<AuthUser>('/api/auth/me', { method: 'GET' })
}

// -----------------------------
// Admin auth — /api/admin/*
// -----------------------------

export function loginAdmin(input: { email: string; password: string }): Promise<AdminUser> {
  return request<AdminUser>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function logoutAdmin(): Promise<{ message: string }> {
  return request('/api/admin/logout', { method: 'POST' })
}

// -----------------------------
// Categories — /api/categories
// -----------------------------

export interface Category {
  id: string
  name: string
  slug: string
}

export function getCategories(): Promise<Category[]> {
  return request<Category[]>('/api/categories', { method: 'GET' })
}

// -----------------------------
// Provider profiles — /api/providers/*
// -----------------------------

export type ResponseChannel = 'whatsapp' | 'call' | 'both'
export type VerificationStatus = 'pending' | 'verified' | 'rejected'

export interface ProviderCategoryLink {
  id: string
  provider_profile_id: string
  category_id: string
  created_at: string
  category: Category
}

export interface ProviderProfile {
  id: string
  user_id: string
  profile_photo: string | null
  whatsapp_number: string | null
  phone_number: string | null
  bio: string | null
  years_of_experience: number | null
  price_range: string | null
  location_area: string
  response_channel: ResponseChannel
  verification_status: VerificationStatus
  is_admin_created: boolean
  created_at: string
  updated_at: string
  categories?: ProviderCategoryLink[]
}

export interface PublicProviderProfile extends ProviderProfile {
  full_name: string
  average_rating: number | null
  review_count: number
}

export interface EditRequest {
  id: string
  provider_profile_id: string
  field_name: 'profile_photo' | 'phone_number' | 'whatsapp_number' | 'location_area'
  old_value: string | null
  new_value: string
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  created_at: string
  reviewed_at: string | null
}

export function createProviderProfile(input: {
  whatsapp_number: string
  phone_number?: string
  bio?: string
  years_of_experience?: number
  price_range?: string
  location_area: string
  response_channel: ResponseChannel
  profile_photo?: File
}): Promise<ProviderProfile> {
  const formData = new FormData()
  formData.append('whatsapp_number', input.whatsapp_number)
  if (input.phone_number) formData.append('phone_number', input.phone_number)
  if (input.bio) formData.append('bio', input.bio)
  if (input.years_of_experience !== undefined) {
    formData.append('years_of_experience', String(input.years_of_experience))
  }
  if (input.price_range) formData.append('price_range', input.price_range)
  formData.append('location_area', input.location_area)
  formData.append('response_channel', input.response_channel)
  if (input.profile_photo) formData.append('profile_photo', input.profile_photo)

  return request<ProviderProfile>('/api/providers/profile', {
    method: 'POST',
    body: formData,
  })
}

export function getMyProviderProfile(): Promise<ProviderProfile> {
  return request<ProviderProfile>('/api/providers/me', { method: 'GET' })
}

export function getPublicProviderProfile(id: string): Promise<PublicProviderProfile> {
  return request<PublicProviderProfile>(`/api/providers/${id}`, { method: 'GET' })
}

export interface SearchProvidersParams {
  category?: string
  location?: string
  verified?: boolean
  response_channel?: ResponseChannel
  min_rating?: number
  price_range?: string
}

export function searchProviders(
  params: SearchProvidersParams = {}
): Promise<PublicProviderProfile[]> {
  const query = new URLSearchParams()

  if (params.category) query.set('category', params.category)
  if (params.location) query.set('location', params.location)
  if (params.verified !== undefined) query.set('verified', String(params.verified))
  if (params.response_channel) query.set('response_channel', params.response_channel)
  if (params.min_rating !== undefined) query.set('min_rating', String(params.min_rating))
  if (params.price_range) query.set('price_range', params.price_range)

  const queryString = query.toString()

  return request<PublicProviderProfile[]>(
    `/api/providers/search${queryString ? `?${queryString}` : ''}`,
    { method: 'GET' }
  )
}

export function updateFreeFields(input: {
  bio?: string
  price_range?: string
  years_of_experience?: number
  response_channel?: ResponseChannel
}): Promise<ProviderProfile> {
  return request<ProviderProfile>('/api/providers/me/free-fields', {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function submitEditRequest(input: {
  field_name: 'profile_photo' | 'phone_number' | 'whatsapp_number' | 'location_area'
  new_value?: string
  photo?: File
}): Promise<EditRequest> {
  const formData = new FormData()
  formData.append('field_name', input.field_name)
  if (input.new_value) formData.append('new_value', input.new_value)
  if (input.photo) formData.append('profile_photo', input.photo)

  return request<EditRequest>('/api/providers/me/edit-request', {
    method: 'POST',
    body: formData,
  })
}

export function assignCategories(category_ids: string[]): Promise<ProviderCategoryLink[]> {
  return request<ProviderCategoryLink[]>('/api/providers/me/categories', {
    method: 'POST',
    body: JSON.stringify({ category_ids }),
  })
}

// -----------------------------
// Reviews — /api/reviews
// -----------------------------

export interface Review {
  id: string
  provider_profile_id: string
  reviewer_id: string
  rating: number
  comment: string | null
  is_flagged: boolean
  flag_reason: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface ProviderReview extends Review {
  reviewer: { full_name: string }
}

export function getProviderReviews(providerId: string): Promise<ProviderReview[]> {
  return request<ProviderReview[]>(`/api/reviews/provider/${providerId}`, { method: 'GET' })
}

export function submitReview(input: {
  provider_profile_id: string
  rating: number
  comment?: string
}): Promise<Review> {
  return request<Review>('/api/reviews', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function flagReview(id: string, reason: string): Promise<Review> {
  return request<Review>(`/api/reviews/${id}/flag`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

// -----------------------------
// Admin — /api/admin/*
// -----------------------------

export interface AdminProviderProfile extends ProviderProfile {
  rejection_reason: string | null
  user: {
    full_name: string
    email: string
    is_active: boolean
  }
}

export interface AdminCustomer {
  id: string
  full_name: string
  email: string
  phone_number: string | null
  is_active: boolean
  created_at: string
  roles: { role: Role }[]
}

export interface AdminEditRequest extends EditRequest {
  provider_profile: {
    id: string
    user: { full_name: string }
  }
}

export interface AdminReview extends Review {
  reviewer: { full_name: string; email: string }
  provider_profile: { id: string; user: { full_name: string } }
}

export interface PlatformStats {
  total_providers: number
  total_customers: number
  total_reviews: number
}

export function getStats(): Promise<PlatformStats> {
  return request<PlatformStats>('/api/admin/stats', { method: 'GET' })
}

export function listAdminProviders(): Promise<AdminProviderProfile[]> {
  return request<AdminProviderProfile[]>('/api/admin/providers', { method: 'GET' })
}

export function verifyProvider(id: string): Promise<AdminProviderProfile> {
  return request<AdminProviderProfile>(`/api/admin/providers/${id}/verify`, { method: 'PATCH' })
}

export function rejectProvider(id: string, reason: string): Promise<AdminProviderProfile> {
  return request<AdminProviderProfile>(`/api/admin/providers/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  })
}

export function suspendProvider(
  id: string
): Promise<{ provider_profile_id: string; user_id: string; is_active: boolean }> {
  return request(`/api/admin/providers/${id}/suspend`, { method: 'PATCH' })
}

export function reactivateProvider(
  id: string
): Promise<{ provider_profile_id: string; user_id: string; is_active: boolean }> {
  return request(`/api/admin/providers/${id}/reactivate`, { method: 'PATCH' })
}

export function deleteProvider(id: string): Promise<{ message: string }> {
  return request(`/api/admin/providers/${id}`, { method: 'DELETE' })
}

export function createProviderByAdmin(input: {
  full_name: string
  email: string
  password: string
  user_phone_number?: string
  whatsapp_number: string
  phone_number?: string
  bio?: string
  years_of_experience?: number
  price_range?: string
  location_area: string
  response_channel: ResponseChannel
  category_ids: string[]
}): Promise<AdminProviderProfile> {
  return request<AdminProviderProfile>('/api/admin/providers', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function listEditRequests(): Promise<AdminEditRequest[]> {
  return request<AdminEditRequest[]>('/api/admin/edit-requests', { method: 'GET' })
}

export function reviewEditRequest(
  id: string,
  action: 'approve' | 'reject',
  admin_note?: string
): Promise<EditRequest> {
  return request<EditRequest>(`/api/admin/edit-requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action, admin_note }),
  })
}

export function listAdminCustomers(): Promise<AdminCustomer[]> {
  return request<AdminCustomer[]>('/api/admin/customers', { method: 'GET' })
}

export function suspendCustomer(id: string): Promise<{ id: string; is_active: boolean }> {
  return request(`/api/admin/customers/${id}/suspend`, { method: 'PATCH' })
}

export function reactivateCustomer(id: string): Promise<{ id: string; is_active: boolean }> {
  return request(`/api/admin/customers/${id}/reactivate`, { method: 'PATCH' })
}

export function deleteCustomer(
  id: string
): Promise<{ message: string; user_id: string; account_deactivated: boolean }> {
  return request(`/api/admin/customers/${id}`, { method: 'DELETE' })
}

export function listAdminReviews(): Promise<AdminReview[]> {
  return request<AdminReview[]>('/api/admin/reviews', { method: 'GET' })
}

export function deleteReview(id: string): Promise<Review> {
  return request<Review>(`/api/admin/reviews/${id}`, { method: 'DELETE' })
}