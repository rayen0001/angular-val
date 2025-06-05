import { Component, inject } from "@angular/core"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule, FormBuilder, type FormGroup, Validators } from "@angular/forms"
import { Router, RouterModule } from "@angular/router"
import { PitchService } from "../../core/services/pitch.service"
import { CreatePitchRequest } from "../../core/models/pitch.model"

@Component({
  selector: "app-create-pitch",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: "./create-pitch.component.html",
  styleUrls: ["./create-pitch.component.scss"],
})
export class CreatePitchComponent {
  private fb = inject(FormBuilder)
  private pitchService = inject(PitchService)
  private router = inject(Router)

  pitchForm: FormGroup
  loading = false
  currentStep = 1
  totalSteps = 4

  industries = ["Technology", "Healthcare", "Finance", "Education", "E-commerce", "SaaS", "Mobile", "AI/ML", "Other"]
  stages = [
    { value: "idea", label: "Idea Stage" },
    { value: "prototype", label: "Prototype" },
    { value: "mvp", label: "MVP" },
    { value: "growth", label: "Growth" },
    { value: "scale", label: "Scale" },
  ]

  constructor() {
    this.pitchForm = this.fb.group({
      // Step 1: Basic Information
      title: ["", [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      description: ["", [Validators.required, Validators.minLength(50), Validators.maxLength(500)]],
      industry: ["", [Validators.required]],
      stage: ["", [Validators.required]],
      location: ["", [Validators.required]],

      // Step 2: Problem & Solution
      problem: ["", [Validators.required, Validators.minLength(100)]],
      solution: ["", [Validators.required, Validators.minLength(100)]],
      market: ["", [Validators.required, Validators.minLength(50)]],

      // Step 3: Business Details
      businessModel: ["", [Validators.required, Validators.minLength(50)]],
      competition: ["", [Validators.required, Validators.minLength(50)]],
      team: ["", [Validators.required, Validators.minLength(50)]],

      // Step 4: Financials
      financials: ["", [Validators.required, Validators.minLength(50)]],
      fundingAmount: ["", [Validators.required, Validators.min(1000), Validators.max(100000000)]],
      equity: ["", [Validators.required, Validators.min(0.1), Validators.max(100)]],
    })
  }

  nextStep(): void {
    if (this.isCurrentStepValid()) {
      this.currentStep++
    } else {
      this.markCurrentStepTouched()
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--
    }
  }

  onSubmit(): void {
    if (this.pitchForm.valid) {
      this.loading = true
      const pitchData: CreatePitchRequest = this.pitchForm.value

      this.pitchService.createPitch(pitchData).subscribe({
        next: (pitch) => {
          this.router.navigate(["/founder"], {
            queryParams: { created: "true" },
          })
        },
        error: (error) => {
          console.error("Error creating pitch:", error)
          alert("Error creating pitch. Please try again.")
          this.loading = false
        },
      })
    } else {
      this.markFormGroupTouched()
    }
  }

  private isCurrentStepValid(): boolean {
    const stepFields = this.getStepFields(this.currentStep)
    return stepFields.every((field) => {
      const control = this.pitchForm.get(field)
      return control?.valid
    })
  }

  private markCurrentStepTouched(): void {
    const stepFields = this.getStepFields(this.currentStep)
    stepFields.forEach((field) => {
      const control = this.pitchForm.get(field)
      control?.markAsTouched()
    })
  }

  private markFormGroupTouched(): void {
    Object.keys(this.pitchForm.controls).forEach((key) => {
      const control = this.pitchForm.get(key)
      control?.markAsTouched()
    })
  }

  private getStepFields(step: number): string[] {
    switch (step) {
      case 1:
        return ["title", "description", "industry", "stage", "location"]
      case 2:
        return ["problem", "solution", "market"]
      case 3:
        return ["businessModel", "competition", "team"]
      case 4:
        return ["financials", "fundingAmount", "equity"]
      default:
        return []
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.pitchForm.get(fieldName)
    if (field?.errors && field.touched) {
      if (field.errors["required"]) return `${fieldName} is required`
      if (field.errors["minlength"])
        return `${fieldName} must be at least ${field.errors["minlength"].requiredLength} characters`
      if (field.errors["maxlength"])
        return `${fieldName} cannot exceed ${field.errors["maxlength"].requiredLength} characters`
      if (field.errors["min"]) return `${fieldName} must be at least ${field.errors["min"].min}`
      if (field.errors["max"]) return `${fieldName} cannot exceed ${field.errors["max"].max}`
    }
    return ""
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }
}
