import { Component, type OnInit, inject } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import { ReactiveFormsModule, FormBuilder, type FormGroup, Validators } from "@angular/forms"
import { PitchService } from "../../core/services/pitch.service"
import { ContestService } from "../../core/services/contest.service"
import { AuthService } from "../../core/services/auth.service"
import { UsersService } from "../../core/services/users.service"
import  { Pitch } from "../../core/models/pitch.model"
import  { Contest, CreateContestRequest } from "../../core/models/contest.model"
import { ContestManagementComponent } from "./contest-management/contest-management.component"

@Component({
  selector: "app-admin-dashboard",
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, ContestManagementComponent],
  templateUrl: "./admin-dashboard.component.html",
  styleUrls: ["./admin-dashboard.component.scss"],
})
export class AdminDashboardComponent implements OnInit {
  private pitchService = inject(PitchService)
  private contestService = inject(ContestService)
  private authService = inject(AuthService)
  private usersService = inject(UsersService)
  private fb = inject(FormBuilder)

  pitches: Pitch[] = []
  contests: Contest[] = []
  loading = true
  currentUser = this.authService.getCurrentUser()

  // Contest creation
  showCreateForm = false
  contestForm: FormGroup
  creatingContest = false

  // Winner selection
  showWinnerModal = false
  selectedContestId = ""
  contestPitches: Pitch[] = []
  totalUsers!: number

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
    this.loadData();
        this.usersService.getTotalUsers().subscribe(count => {
      this.totalUsers = count;
    });
  }

  private loadData(): void {
    Promise.all([this.pitchService.getAllPitches().toPromise(), this.contestService.getAllContests().toPromise()])
      .then(([pitches, contests]) => {
        this.pitches = pitches || []
        this.contests = contests || []
        this.loading = false
      })
      .catch((error) => {
        console.error("Error loading data:", error)
        this.loading = false
      })
  }

  onCreateContest(): void {
    if (this.contestForm.valid) {
      this.creatingContest = true
      const contestData: CreateContestRequest = this.contestForm.value

      this.contestService.createContest(contestData).subscribe({
        next: (contest) => {
          this.contests.unshift(contest)
          this.contestForm.reset()
          this.showCreateForm = false
          this.creatingContest = false
        },
        error: (error) => {
          console.error("Error creating contest:", error)
          alert("Error creating contest. Please try again.")
          this.creatingContest = false
        },
      })
    } else {
      this.markFormGroupTouched()
    }
  }

  onEditContest(contestId: string): void {
    // Implementation for editing contest
    console.log("Edit contest:", contestId)
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



  getActiveContests(): Contest[] {
    return this.contests.filter((contest) => contest.status === "active")
  }

  getCompletedContests(): Contest[] {
    return this.contests.filter((contest) => contest.status === "ended")
  }

  formatDate(date: string): string {
    return new Date(date).toISOString().split("T")[0]
  }
}
