import { Component, Input, Output, EventEmitter } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import { Pitch } from "../../../core/models/pitch.model"

@Component({
  selector: "app-pitch-card",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./pitch-card.component.html",
  styleUrls: ["./pitch-card.component.scss"],
})
export class PitchCardComponent {
  @Input() pitch!: Pitch
  @Input() showActions = false
  @Input() userRole: string | null = null
  @Output() edit = new EventEmitter<string>()
  @Output() delete = new EventEmitter<string>()
  @Output() vote = new EventEmitter<{ pitchId: string; score: number }>()

  onEdit(): void {
    this.edit.emit(this.pitch.id)
  }

  onDelete(): void {
    if (confirm("Are you sure you want to delete this pitch?")) {
      this.delete.emit(this.pitch.id)
    }
  }

  onVote(score: number): void {
    this.vote.emit({ pitchId: this.pitch.id, score })
  }

  getAverageScore(): number {
    if (!this.pitch.votes || this.pitch.votes.length === 0) return 0
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
}
