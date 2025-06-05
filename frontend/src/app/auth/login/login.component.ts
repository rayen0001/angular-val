import { Component, inject } from "@angular/core"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule, FormBuilder, type FormGroup, Validators } from "@angular/forms"
import { Router, RouterModule, ActivatedRoute } from "@angular/router"
import { AuthService } from "../../core/services/auth.service"

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent {
  private fb = inject(FormBuilder)
  private authService = inject(AuthService)
  private router = inject(Router)
  private route = inject(ActivatedRoute)

  loginForm: FormGroup
  loading = false
  error = ""

  constructor() {
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
    })
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true
      this.error = ""

      this.authService.login(this.loginForm.value).subscribe({

        
        next: (response) => {
          console.log(this.loginForm.value);
          
          const returnUrl = this.route.snapshot.queryParams["returnUrl"] || `/${response.user.role}`
          this.router.navigate([returnUrl])
        },
        error: (error) => {
          this.error = error.error?.message || "Login failed. Please try again."
          this.loading = false
        },
      })
    } else {
      this.markFormGroupTouched()
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key)
      control?.markAsTouched()
    })
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName)
    if (field?.errors && field.touched) {
      if (field.errors["required"]) return `${fieldName} is required`
      if (field.errors["email"]) return "Please enter a valid email"
      if (field.errors["minlength"])
        return `${fieldName} must be at least ${field.errors["minlength"].requiredLength} characters`
    }
    return ""
  }
}
