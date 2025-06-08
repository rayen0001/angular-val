import { Component, type OnInit, inject } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import { FormsModule } from "@angular/forms"
import { PitchService } from "../../core/services/pitch.service"
import { ContestService } from "../../core/services/contest.service"
import { AuthService } from "../../core/services/auth.service"
import { PitchCardComponent } from "../../shared/components/pitch-card/pitch-card.component"
import { ContestListComponent } from "../../shared/components/contest-list/contest-list.component"
import { Pitch } from "../../core/models/pitch.model"
import { Contest } from "../../core/models/contest.model"
import { map, Observable } from "rxjs"

@Component({
  selector: "app-investor-dashboard",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PitchCardComponent, ContestListComponent],
  templateUrl: "./investor-dashboard.component.html",
  styleUrls: ["./investor-dashboard.component.scss"],
})
export class InvestorDashboardComponent implements OnInit {
  private pitchService = inject(PitchService)
  private contestService = inject(ContestService)
  private authService = inject(AuthService)

  pitches: Pitch[] = []
  filteredPitches: Pitch[] = []
  contests: Contest[] = []
  loading = true
  currentUser = this.authService.getCurrentUser()
  
  // Add property to store comment count
  myCommentsCount = 0
  
  // Filters
  selectedStage = ""
  selectedIndustry = ""
  minFunding = 0
  maxFunding = 10000000
  searchTerm = ""

  // Available filter options
  stages = ["idea", "prototype", "mvp", "growth", "scale"]
  industries = ["Technology", "Healthcare", "Finance", "Education", "E-commerce", "SaaS", "Mobile", "AI/ML"]

  ngOnInit(): void {
    this.loadData()
    this.loadCommentStats()
  }

  private loadData(): void {
    Promise.all([this.pitchService.getAllPitches().toPromise(), this.contestService.getAllContests().toPromise()])
      .then(([pitches, contests]) => {
        this.pitches = pitches || []
        this.filteredPitches = [...this.pitches]
        this.contests = contests || []
        this.loading = false
      })
      .catch((error) => {
        console.error("Error loading data:", error)
        this.loading = false
      })
  }

  private loadCommentStats(): void {
    this.getMyCommentsCount().subscribe({
      next: (count) => {
        console.log('Comment stats response:', count) // Debug log
        this.myCommentsCount = count
      },
      error: (error) => {
        console.error("Error loading comment stats:", error)
        this.myCommentsCount = 0
      }
    })
  }

  onVote(event: { pitchId: string; score: number }): void {
    this.pitchService.votePitch(event.pitchId, event.score).subscribe({
      next: () => {
        // Reload pitches to show updated vote
        this.pitchService.getAllPitches().subscribe((pitches) => {
          this.pitches = pitches
          this.applyFilters()
        })
      },
      error: (error) => {
        console.error("Error voting:", error)
        alert("Error submitting vote. Please try again.")
      },
    })
  }

  applyFilters(): void {
    this.filteredPitches = this.pitches.filter((pitch) => {
      const matchesStage = !this.selectedStage || pitch.stage === this.selectedStage
      const matchesIndustry = !this.selectedIndustry || pitch.industry === this.selectedIndustry
      const matchesFunding = pitch.fundingAmount >= this.minFunding && pitch.fundingAmount <= this.maxFunding
      const matchesSearch =
        !this.searchTerm ||
        pitch.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        pitch.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        pitch.industry.toLowerCase().includes(this.searchTerm.toLowerCase())

      return matchesStage && matchesIndustry && matchesFunding && matchesSearch
    })
  }

  clearFilters(): void {
    this.selectedStage = ""
    this.selectedIndustry = ""
    this.minFunding = 0
    this.maxFunding = 10000000
    this.searchTerm = ""
    this.filteredPitches = [...this.pitches]
  }

  getMyVotesCount(): number {
    return this.pitches.reduce((count, pitch) => {
      const hasVoted = pitch.votes?.some((vote) => vote.investorId === this.currentUser?.id)
      return hasVoted ? count + 1 : count
    }, 0)
  }

  getMyCommentsCount(): Observable<number> {
    return this.pitchService.getUserCommentStats().pipe(
      map(stats => {
        console.log('Raw stats from API:', stats) // Debug log
        return stats.totalComments
      })
    )
  }

  // Add getter for template usage
  getMyCommentsCountSync(): number {
    return this.myCommentsCount
  }

  getActiveContests(): Contest[] {
    return this.contests.filter((contest) => contest.status === "active")
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