import { Component, inject } from "@angular/core"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule, FormBuilder, type FormGroup, Validators } from "@angular/forms"
import { Router, RouterModule } from "@angular/router"
import { AuthService } from "../../core/services/auth.service"

@Component({
  selector: "app-register",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.scss"],
})
export class RegisterComponent {
  private fb = inject(FormBuilder)
  private authService = inject(AuthService)
  private router = inject(Router)

  registerForm: FormGroup
  loading = false
  error = ""

  constructor() {
    this.registerForm = this.fb.group(
      {
        firstName: ["", [Validators.required, Validators.minLength(2)]],
        lastName: ["", [Validators.required, Validators.minLength(2)]],
        email: ["", [Validators.required, Validators.email]],
        password: ["", [Validators.required, Validators.minLength(6)]],
        confirmPassword: ["", [Validators.required]],
        role: ["founder", [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    )
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get("password")
    const confirmPassword = form.get("confirmPassword")

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true })
    } else if (confirmPassword?.errors?.["passwordMismatch"]) {
      delete confirmPassword.errors["passwordMismatch"]
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null)
      }
    }
    return null
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true
      this.error = ""

      const { confirmPassword, ...userData } = this.registerForm.value

      this.authService.register(userData).subscribe({
        next: (response) => {
          this.router.navigate([`/${response.user.role}`])
        },
        error: (error) => {
          this.error = error.error?.message || "Registration failed. Please try again."
          this.loading = false
        },
      })
    } else {
      this.markFormGroupTouched()
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach((key) => {
      const control = this.registerForm.get(key)
      control?.markAsTouched()
    })
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName)
    if (field?.errors && field.touched) {
      if (field.errors["required"]) return `${fieldName} is required`
      if (field.errors["email"]) return "Please enter a valid email"
      if (field.errors["minlength"])
        return `${fieldName} must be at least ${field.errors["minlength"].requiredLength} characters`
      if (field.errors["passwordMismatch"]) return "Passwords do not match"
    }
    return ""
  }
}
