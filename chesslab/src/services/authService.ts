import { apiFetch } from './api'
import type {
  LoginRequest,
  OnboardingRequest,
  RegisterRequest,
  TokenResponse,
  User,
} from '../types/api'

export const authService = {
  register(data: RegisterRequest): Promise<TokenResponse> {
    return apiFetch<TokenResponse>('/auth/register', { method: 'POST', body: data })
  },

  login(data: LoginRequest): Promise<TokenResponse> {
    return apiFetch<TokenResponse>('/auth/login', { method: 'POST', body: data })
  },

  me(token: string): Promise<User> {
    return apiFetch<User>('/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  onboarding(token: string, data: OnboardingRequest): Promise<User> {
    return apiFetch<User>('/users/me/onboarding', {
      method: 'PUT',
      body: data,
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}
