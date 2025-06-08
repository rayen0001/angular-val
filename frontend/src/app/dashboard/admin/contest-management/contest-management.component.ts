import { Component, type OnInit, inject } from "@angular/core"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule, FormBuilder, type FormGroup, Validators } from "@angular/forms"
import { RouterModule } from "@angular/router"
import { ContestService } from "../../../core/services/contest.service"
import { PitchService } from "../../../core/services/pitch.service"
import { ContestListComponent } from "../../../shared/components/contest-list/contest-list.component"
import  { Contest, CreateContestRequest } from "../../../core/models/contest.model"
import { Pitch } from "../../../core/models/pitch.model"

@Component({
  selector: "app-contest-management",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: "./contest-management.component.html",
  styleUrls: ["./contest-management.component.scss"],
})
export class ContestManagementComponent implements OnInit {
  private contestService = inject(ContestService)
  private pitchService = inject(PitchService)
  private fb = inject(FormBuilder)

  contests: Contest[] = []
  pitches: Pitch[] = []
  loading = true

  // Contest creation/editing
  showCreateForm = false
  showEditForm = false
  contestForm: FormGroup
  editingContestId = ""
  submitting = false

  // Winner selection
  showWinnerModal = false
  selectedContestId = ""
  contestPitches: Pitch[] = []

  // Pitch assignment
  showPitchModal = false
  availablePitches: Pitch[] = []

  constructor() {
    this.contestForm = this.fb.group({
      title: ["", [Validators.required, Validators.minLength(3)]],
      description: ["", [Validators.required, Validators.minLength(10)]],
      startDate: ["", [Validators.required]],
      endDate: ["", [Validators.required]],
      prize: ["", [Validators.required]],
    })
  }

  ngOnInit(): void {
    this.loadData()
  }

  public loadData(): void {
    Promise.all([this.contestService.getAllContests().toPromise(), this.pitchService.getAllPitches().toPromise()])
      .then(([contests, pitches]) => {
        this.contests = contests || []
        this.pitches = pitches || []
        this.loading = false
      })
      .catch((error) => {
        console.error("Error loading data:", error)
        this.loading = false
      })
  }

  // Contest CRUD operations
  onCreateContest(): void {
    this.showCreateForm = true
    this.showEditForm = false
    this.editingContestId = ""
    this.contestForm.reset()
  }

  onEditContest(contestId: string): void {
    const contest = this.contests.find((c) => c.id === contestId)
    if (contest) {
      this.showEditForm = true
      this.showCreateForm = false
      this.editingContestId = contestId
      this.contestForm.patchValue({
        title: contest.title,
        description: contest.description,
        startDate: this.formatDateForInput(contest.startDate),
        endDate: this.formatDateForInput(contest.endDate),
        prize: contest.prize,
      })
    }
  }

  onSubmitContest(): void {
    if (this.contestForm.valid) {
      this.submitting = true
      const contestData: CreateContestRequest = this.contestForm.value

      const operation = this.showEditForm
        ? this.contestService.updateContest(this.editingContestId, contestData)
        : this.contestService.createContest(contestData)

      operation.subscribe({
        next: (contest) => {
          if (this.showEditForm) {
            const index = this.contests.findIndex((c) => c.id === this.editingContestId)
            if (index !== -1) {
              this.contests[index] = contest
            }
          } else {
            this.contests.unshift(contest)
          }
          this.closeForm()
          this.submitting = false
        },
        error: (error) => {
          console.error("Error saving contest:", error)
          alert("Error saving contest. Please try again.")
          this.submitting = false
        },
      })
    } else {
      this.markFormGroupTouched()
    }
  }

  onDeleteContest(contestId: string): void {
    this.contestService.deleteContest(contestId).subscribe({
      next: () => {
        this.contests = this.contests.filter((c) => c.id !== contestId)
      },
      error: (error) => {
        console.error("Error deleting contest:", error)
        alert("Error deleting contest. Please try again.")
      },
    })
  }

  closeForm(): void {
    this.showCreateForm = false
    this.showEditForm = false
    this.editingContestId = ""
    this.contestForm.reset()
  }

  // Winner selection
  onSelectWinner(contestId: string): void {
    const contest = this.contests.find((c) => c.id === contestId)
    if (contest) {
      this.selectedContestId = contestId
      this.contestPitches = this.pitches.filter((p) => contest.pitches.includes(p.id))
      this.showWinnerModal = true
    }
  }

  selectWinner(pitchId: string): void {
    this.contestService.selectWinner(this.selectedContestId, pitchId).subscribe({
      next: (updatedContest) => {
        const index = this.contests.findIndex((c) => c.id === this.selectedContestId)
        if (index !== -1) {
          this.contests[index] = updatedContest
        }
        this.closeWinnerModal()
      },
      error: (error) => {
        console.error("Error selecting winner:", error)
        alert("Error selecting winner. Please try again.")
      },
    })
  }

  closeWinnerModal(): void {
    this.showWinnerModal = false
    this.selectedContestId = ""
    this.contestPitches = []
  }

  // Pitch assignment
  onManagePitches(contestId: string): void {
    const contest = this.contests.find((c) => c.id === contestId)
    if (contest) {
      this.selectedContestId = contestId
      this.availablePitches = this.pitches.filter((p) => !contest.pitches.includes(p.id))
      this.showPitchModal = true
    }
  }

  addPitchToContest(pitchId: string): void {
    this.contestService.addPitchToContest(this.selectedContestId, pitchId).subscribe({
      next: (updatedContest) => {
        const index = this.contests.findIndex((c) => c.id === this.selectedContestId)
        if (index !== -1) {
          this.contests[index] = updatedContest
        }
        this.availablePitches = this.availablePitches.filter((p) => p.id !== pitchId)
      },
      error: (error) => {
        console.error("Error adding pitch to contest:", error)
        alert("Error adding pitch to contest. Please try again.")
      },
    })
  }

  closePitchModal(): void {
    this.showPitchModal = false
    this.selectedContestId = ""
    this.availablePitches = []
  }

  // Utility methods
  private formatDateForInput(date: Date): string {
    return new Date(date).toISOString().slice(0, 16)
  }

  private markFormGroupTouched(): void {
    Object.keys(this.contestForm.controls).forEach((key) => {
      const control = this.contestForm.get(key)
      control?.markAsTouched()
    })
  }

  getFieldError(fieldName: string): string {
    const field = this.contestForm.get(fieldName)
    if (field?.errors && field.touched) {
      if (field.errors["required"]) return `${fieldName} is required`
      if (field.errors["minlength"])
        return `${fieldName} must be at least ${field.errors["minlength"].requiredLength} characters`
    }
    return ""
  }

  getContestStats() {
    return {
      total: this.contests.length,
      active: this.contests.filter((c) => c.status === "active").length,
      upcoming: this.contests.filter((c) => c.status === "upcoming").length,
      ended: this.contests.filter((c) => c.status === "ended").length,
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }
}
