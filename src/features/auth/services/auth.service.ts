import axiosInstance from '@/shared/lib/axios-instance'
import type { LoginRequest, LoginResponse } from '../types/auth.types'

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const { data } = await axiosInstance.post<LoginResponse>('/auth/login', credentials)
  return data
}
