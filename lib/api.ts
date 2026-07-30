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
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include', // required for HTTP-only cookies — see servifind-stack.md
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
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