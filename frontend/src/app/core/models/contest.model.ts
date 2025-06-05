export interface Contest {
  id: string
  title: string
  description: string
  startDate: Date
  endDate: Date
  prize: string
  status: "upcoming" | "active" | "ended"
  pitches: string[]
  winnerId?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateContestRequest {
  title: string
  description: string
  startDate: Date
  endDate: Date
  prize: string
}
