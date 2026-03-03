import { User } from '../entities/User'

export interface RegisterData {
  email: string
  password: string
  nombre?: string
  apellido?: string
  telefono?: string
  rancho?: string
  rancho_hectareas?: number
  rancho_pais?: string
  rancho_ciudad?: string
  rancho_direccion?: string
  rancho_descripcion?: string
  moneda?: string
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
  sendPasswordResetEmail(email: string): Promise<{ success: boolean; error: string | null }>
}

