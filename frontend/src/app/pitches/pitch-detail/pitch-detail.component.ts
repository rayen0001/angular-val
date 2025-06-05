import { Component, type OnInit, inject } from "@angular/core"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule, FormBuilder, type FormGroup, Validators } from "@angular/forms"
import { ActivatedRoute, RouterModule } from "@angular/router"
import { PitchService } from "../../core/services/pitch.service"
import { AuthService } from "../../core/services/auth.service"
import { Pitch, Comment } from "../../core/models/pitch.model"

@Component({
  selector: "app-pitch-detail",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: "./pitch-detail.component.html",
  styleUrls: ["./pitch-detail.component.scss"],
})
export class PitchDetailComponent implements OnInit {
  private route = inject(ActivatedRoute)
  private pitchService = inject(PitchService)
  private authService = inject(AuthService)
  private fb = inject(FormBuilder)

  pitch: Pitch | null = null
  comments: Comment[] = []
  loading = true
  votingLoading = false
  commentLoading = false
  currentUser = this.authService.getCurrentUser()
  pitchId = ""

  commentForm: FormGroup
  userVote: number | null = null

  constructor() {
    this.commentForm = this.fb.group({
      content: ["", [Validators.required, Validators.minLength(10)]],
    })
  }

  ngOnInit(): void {
    this.pitchId = this.route.snapshot.params["id"]
    this.loadPitchDetails()
  }

  private loadPitchDetails(): void {
    Promise.all([
      this.pitchService.getPitchById(this.pitchId).toPromise(),
      this.pitchService.getPitchComments(this.pitchId).toPromise(),
    ])
      .then(([pitch, comments]) => {
        this.pitch = pitch!
        this.comments = comments || []
        this.checkUserVote()
        this.loading = false
      })
      .catch((error) => {
        console.error("Error loading pitch details:", error)
        this.loading = false
      })
  }

  private checkUserVote(): void {
    if (this.pitch && this.currentUser) {
      const vote = this.pitch.votes?.find((v) => v.investorId === this.currentUser!.id)
      this.userVote = vote ? vote.score : null
    }
  }

  onVote(score: number): void {
    if (this.votingLoading) return

    this.votingLoading = true
    this.pitchService.votePitch(this.pitchId, score).subscribe({
      next: (vote) => {
        this.userVote = score
        // Reload pitch to get updated votes
        this.pitchService.getPitchById(this.pitchId).subscribe((pitch) => {
          this.pitch = pitch
          this.votingLoading = false
        })
      },
      error: (error) => {
        console.error("Error voting:", error)
        alert("Error submitting vote. Please try again.")
        this.votingLoading = false
      },
    })
  }

  onSubmitComment(): void {
    if (this.commentForm.valid && !this.commentLoading) {
      this.commentLoading = true
      const content = this.commentForm.get("content")?.value

      this.pitchService.commentPitch(this.pitchId, content).subscribe({
        next: (comment) => {
          this.comments.unshift(comment)
          this.commentForm.reset()
          this.commentLoading = false
        },
        error: (error) => {
          console.error("Error submitting comment:", error)
          alert("Error submitting comment. Please try again.")
          this.commentLoading = false
        },
      })
    }
  }

  getAverageScore(): number {
    if (!this.pitch?.votes || this.pitch.votes.length === 0) return 0
    const total = this.pitch.votes.reduce((sum, vote) => sum + vote.score, 0)
    return Math.round((total / this.pitch.votes.length) * 10) / 10
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
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

  getFieldError(fieldName: string): string {
    const field = this.commentForm.get(fieldName)
    if (field?.errors && field.touched) {
      if (field.errors["required"]) return `${fieldName} is required`
      if (field.errors["minlength"])
        return `${fieldName} must be at least ${field.errors["minlength"].requiredLength} characters`
    }
    return ""
  }
}
