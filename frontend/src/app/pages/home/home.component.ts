import { Component, type OnInit, inject } from "@angular/core"
import { CommonModule } from "@angular/common"
import { PitchService } from "../../core/services/pitch.service"
import { ContestService } from "../../core/services/contest.service"
import { AuthService } from "../../core/services/auth.service"
import { PitchCardComponent } from "../../shared/components/pitch-card/pitch-card.component"
import { ContestListComponent } from "../../shared/components/contest-list/contest-list.component"
import { Pitch } from "../../core/models/pitch.model"
import { Contest } from "../../core/models/contest.model"

@Component({
  selector: "app-home",
  standalone: true,
  imports: [CommonModule, PitchCardComponent, ContestListComponent],
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnInit {
  private pitchService = inject(PitchService)
  private contestService = inject(ContestService)
  private authService = inject(AuthService)

  pitches: Pitch[] = []
  contests: Contest[] = []
  loading = true
  currentUserRole = this.authService.currentUserRole

  ngOnInit(): void {
    this.loadData()
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

  onVote(event: { pitchId: string; score: number }): void {
    this.pitchService.votePitch(event.pitchId, event.score).subscribe({
      next: () => {
        // Reload pitches to show updated vote
        this.pitchService.getAllPitches().subscribe((pitches) => {
          this.pitches = pitches
        })
      },
      error: (error) => {
        console.error("Error voting:", error)
        alert("Error submitting vote. Please try again.")
      },
    })
  }

  getActiveContests(): Contest[] {
    return this.contests.filter((contest) => contest.status === "active")
  }
}
