import { Component, type OnInit, inject } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import { PitchService } from "../../core/services/pitch.service"
import { AuthService } from "../../core/services/auth.service"
import { PitchCardComponent } from "../../shared/components/pitch-card/pitch-card.component"
import  { Pitch } from "../../core/models/pitch.model"


@Component({
  selector: "app-founder-dashboard",
  standalone: true,
  imports: [CommonModule, RouterModule, PitchCardComponent],
  templateUrl: "./founder-dashboard.component.html",
  styleUrls: ["./founder-dashboard.component.scss"],
})
export class FounderDashboardComponent implements OnInit {
  private pitchService = inject(PitchService)
  private authService = inject(AuthService)

  pitches: Pitch[] = []
  loading = true
  currentUser = this.authService.getCurrentUser()

  ngOnInit(): void {
    this.loadFounderPitches()
  }

  private loadFounderPitches(): void {
    this.pitchService.getFounderPitches().subscribe({
      next: (pitches) => {
        this.pitches = pitches
        this.loading = false
      },
      error: (error) => {
        console.error("Error loading pitches:", error)
        this.loading = false
      },
    })
  }

  onEditPitch(pitchId: string): void {
    // Navigation handled by router
  }

  onDeletePitch(pitchId: string): void {
    this.pitchService.deletePitch(pitchId).subscribe({
      next: () => {
        this.pitches = this.pitches.filter((p) => p.id !== pitchId)
      },
      error: (error) => {
        console.error("Error deleting pitch:", error)
        alert("Error deleting pitch. Please try again.")
      },
    })
  }

  getTotalVotes(): number {
    return this.pitches.reduce((total, pitch) => total + (pitch.votes?.length || 0), 0)
  }

  getTotalComments(): number {
    return this.pitches.reduce((total, pitch) => total + (pitch.comments?.length || 0), 0)
  }

  getAverageRating(): number {
    const allVotes = this.pitches.flatMap((pitch) => pitch.votes || [])
    if (allVotes.length === 0) return 0
    const total = allVotes.reduce((sum, vote) => sum + vote.score, 0)
    return Math.round((total / allVotes.length) * 10) / 10
  }
}
