import { Component, Input, Output, EventEmitter } from "@angular/core"
import { CommonModule } from "@angular/common"
import { Contest } from "../../../core/models/contest.model"

@Component({
  selector: "app-contest-list",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./contest-list.component.html",
  styleUrls: ["./contest-list.component.scss"],
})
export class ContestListComponent {
  @Input() contests: Contest[] = []
  @Input() showActions = false
  @Output() edit = new EventEmitter<string>()
  @Output() delete = new EventEmitter<string>()
  @Output() selectWinner = new EventEmitter<string>()

  onEdit(contestId: string): void {
    this.edit.emit(contestId)
  }

  onDelete(contestId: string): void {
    if (confirm("Are you sure you want to delete this contest?")) {
      this.delete.emit(contestId)
    }
  }

  onSelectWinner(contestId: string): void {
    this.selectWinner.emit(contestId)
  }

  getStatusClass(status: string): string {
    switch (status) {
      case "upcoming":
        return "status-upcoming"
      case "active":
        return "status-active"
      case "ended":
        return "status-ended"
      default:
        return ""
    }
  }

  isContestActive(contest: Contest): boolean {
    const now = new Date()
    return new Date(contest.startDate) <= now && new Date(contest.endDate) >= now
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }
}
