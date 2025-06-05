import { Injectable, signal } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { Router } from "@angular/router"
import { Observable, BehaviorSubject, tap } from "rxjs"
import  { User, LoginRequest, RegisterRequest, AuthResponse } from "../models/user.model"

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private readonly API_URL = "http://localhost:5000/api"
  private currentUserSubject = new BehaviorSubject<User | null>(null)
  public currentUser$ = this.currentUserSubject.asObservable()

  // Signal for reactive UI updates
  public isAuthenticated = signal<boolean>(false)
  public currentUserRole = signal<string | null>(null)

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.loadUserFromStorage()
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    console.log(credentials);
    
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials).pipe(
      tap((response) => {
        this.setAuthData(response)
      }),
    )
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/register`, userData).pipe(
      tap((response) => {
        this.setAuthData(response)
      }),
    )
  }

  logout(): void {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    this.currentUserSubject.next(null)
    this.isAuthenticated.set(false)
    this.currentUserRole.set(null)
    this.router.navigate(["/"])
  }

  getToken(): string | null {
    return localStorage.getItem("token")
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value
  }

  hasRole(roles: string[]): boolean {
    const user = this.getCurrentUser()
    return user ? roles.includes(user.role) : false
  }

  private setAuthData(response: AuthResponse): void {
    localStorage.setItem("token", response.token)
    localStorage.setItem("user", JSON.stringify(response.user))
    this.currentUserSubject.next(response.user)
    this.isAuthenticated.set(true)
    this.currentUserRole.set(response.user.role)
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem("token")
    const userStr = localStorage.getItem("user")

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        this.currentUserSubject.next(user)
        this.isAuthenticated.set(true)
        this.currentUserRole.set(user.role)
      } catch (error) {
        this.logout()
      }
    }
  }
}
