import { User } from '../entities/User'

export interface RegisterData {
  email: string
  password: string
  nombre?: string
  apellido?: string
  telefono?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthRepository {
  register(data: RegisterData): Promise<{ user: User | null; error: string | null }>
  login(data: LoginData): Promise<{ user: User | null; error: string | null }>
  logout(): Promise<void>
  getCurrentUser(): Promise<User | null>
}

