import { Component, type OnInit, inject } from "@angular/core"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule, FormBuilder, type FormGroup, Validators } from "@angular/forms"
import { Router, ActivatedRoute, RouterModule } from "@angular/router"
import { PitchService } from "../../core/services/pitch.service"
import { Pitch, CreatePitchRequest } from "../../core/models/pitch.model"

@Component({
  selector: "app-edit-pitch",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: "./edit-pitch.component.html",
  styleUrls: ["./edit-pitch.component.scss"],
})
export class EditPitchComponent implements OnInit {
  private fb = inject(FormBuilder)
  private pitchService = inject(PitchService)
  private router = inject(Router)
  private route = inject(ActivatedRoute)

  pitchForm: FormGroup
  loading = false
  loadingPitch = true
  pitchId = ""
  pitch: Pitch | null = null

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
      title: ["", [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      description: ["", [Validators.required, Validators.minLength(50), Validators.maxLength(500)]],
      industry: ["", [Validators.required]],
      stage: ["", [Validators.required]],
      location: ["", [Validators.required]],
      problem: ["", [Validators.required, Validators.minLength(100)]],
      solution: ["", [Validators.required, Validators.minLength(100)]],
      market: ["", [Validators.required, Validators.minLength(50)]],
      businessModel: ["", [Validators.required, Validators.minLength(50)]],
      competition: ["", [Validators.required, Validators.minLength(50)]],
      team: ["", [Validators.required, Validators.minLength(50)]],
      financials: ["", [Validators.required, Validators.minLength(50)]],
      fundingAmount: ["", [Validators.required, Validators.min(1000), Validators.max(100000000)]],
      equity: ["", [Validators.required, Validators.min(0.1), Validators.max(100)]],
    })
  }

  ngOnInit(): void {
    this.pitchId = this.route.snapshot.params["id"]
    this.loadPitch()
  }

  private loadPitch(): void {
    this.pitchService.getPitchById(this.pitchId).subscribe({
      next: (pitch) => {
        this.pitch = pitch
        this.pitchForm.patchValue({
          title: pitch.title,
          description: pitch.description,
          industry: pitch.industry,
          stage: pitch.stage,
          location: pitch.location,
          problem: pitch.problem,
          solution: pitch.solution,
          market: pitch.market,
          businessModel: pitch.businessModel,
          competition: pitch.competition,
          team: pitch.team,
          financials: pitch.financials,
          fundingAmount: pitch.fundingAmount,
          equity: pitch.equity,
        })
        this.loadingPitch = false
      },
      error: (error) => {
        console.error("Error loading pitch:", error)
        alert("Error loading pitch. Please try again.")
        this.router.navigate(["/founder"])
      },
    })
  }

  onSubmit(): void {
    if (this.pitchForm.valid) {
      this.loading = true
      const pitchData: Partial<CreatePitchRequest> = this.pitchForm.value

      this.pitchService.updatePitch(this.pitchId, pitchData).subscribe({
        next: (pitch) => {
          this.router.navigate(["/founder"], {
            queryParams: { updated: "true" },
          })
        },
        error: (error) => {
          console.error("Error updating pitch:", error)
          alert("Error updating pitch. Please try again.")
          this.loading = false
        },
      })
    } else {
      this.markFormGroupTouched()
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.pitchForm.controls).forEach((key) => {
      const control = this.pitchForm.get(key)
      control?.markAsTouched()
    })
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
