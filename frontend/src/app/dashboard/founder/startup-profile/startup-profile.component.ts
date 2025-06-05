import { Component, type OnInit, inject } from "@angular/core"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule, FormBuilder, type FormGroup, Validators } from "@angular/forms"
import { RouterModule } from "@angular/router"
import { AuthService } from "../../../core/services/auth.service"

@Component({
  selector: "app-startup-profile",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: "./startup-profile.component.html",
  styleUrls: ["./startup-profile.component.scss"],
})
export class StartupProfileComponent implements OnInit {
  private fb = inject(FormBuilder)
  private authService = inject(AuthService)

  profileForm: FormGroup
  loading = false
  success = false
  currentUser = this.authService.getCurrentUser()

  constructor() {
    this.profileForm = this.fb.group({
      companyName: ["", [Validators.required, Validators.minLength(2)]],
      website: ["", [Validators.pattern(/^https?:\/\/.+/)]],
      industry: ["", [Validators.required]],
      stage: ["", [Validators.required]],
      location: ["", [Validators.required]],
      foundedYear: ["", [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear())]],
      teamSize: ["", [Validators.required, Validators.min(1)]],
      description: ["", [Validators.required, Validators.minLength(50)]],
      mission: ["", [Validators.required, Validators.minLength(20)]],
      vision: ["", [Validators.required, Validators.minLength(20)]],
      linkedIn: [""],
      twitter: [""],
      facebook: [""],
    })
  }

  ngOnInit(): void {
    this.loadProfile()
  }

  private loadProfile(): void {
    // In a real app, this would load from an API
    // For now, we'll use mock data
    const mockProfile = {
      companyName: "TechStart Inc.",
      website: "https://techstart.com",
      industry: "Technology",
      stage: "mvp",
      location: "San Francisco, CA",
      foundedYear: 2023,
      teamSize: 5,
      description: "We're building the next generation of AI-powered productivity tools for remote teams.",
      mission: "To make remote work more efficient and collaborative through intelligent automation.",
      vision: "A world where distance doesn't limit productivity and innovation.",
      linkedIn: "https://linkedin.com/company/techstart",
      twitter: "https://twitter.com/techstart",
      facebook: "",
    }

    this.profileForm.patchValue(mockProfile)
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.loading = true
      this.success = false

      // Simulate API call
      setTimeout(() => {
        console.log("Profile updated:", this.profileForm.value)
        this.loading = false
        this.success = true

        // Hide success message after 3 seconds
        setTimeout(() => {
          this.success = false
        }, 3000)
      }, 1000)
    } else {
      this.markFormGroupTouched()
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.profileForm.controls).forEach((key) => {
      const control = this.profileForm.get(key)
      control?.markAsTouched()
    })
  }

  getFieldError(fieldName: string): string {
    const field = this.profileForm.get(fieldName)
    if (field?.errors && field.touched) {
      if (field.errors["required"]) return `${fieldName} is required`
      if (field.errors["minlength"])
        return `${fieldName} must be at least ${field.errors["minlength"].requiredLength} characters`
      if (field.errors["pattern"]) return `Please enter a valid ${fieldName}`
      if (field.errors["min"]) return `${fieldName} must be at least ${field.errors["min"].min}`
      if (field.errors["max"]) return `${fieldName} cannot exceed ${field.errors["max"].max}`
    }
    return ""
  }

  industries = ["Technology", "Healthcare", "Finance", "Education", "E-commerce", "SaaS", "Mobile", "AI/ML", "Other"]
  stages = [
    { value: "idea", label: "Idea Stage" },
    { value: "prototype", label: "Prototype" },
    { value: "mvp", label: "MVP" },
    { value: "growth", label: "Growth" },
    { value: "scale", label: "Scale" },
  ]
}
