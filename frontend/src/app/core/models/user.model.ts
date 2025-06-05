export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: "founder" | "investor" | "admin"
  createdAt: Date
  updatedAt: Date
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  role: "founder" | "investor"
}

export interface AuthResponse {
  token: string
  user: User
}
