export interface Pitch {
  id: string
  title: string
  description: string
  problem: string
  solution: string
  market: string
  businessModel: string
  competition: string
  team: string
  financials: string
  fundingAmount: number
  equity: number
  stage: "idea" | "prototype" | "mvp" | "growth" | "scale"
  industry: string
  location: string
  founderId: string
  founder: {
    firstName: string
    lastName: string
    email: string
  }
  votes: Vote[]
  comments: Comment[]
  contestId?: string
  createdAt: Date
  updatedAt: Date
}

export interface Vote {
  id: string
  pitchId: string
  investorId: string
  score: number
  createdAt: Date
}

export interface Comment {
  id: string
  pitchId: string
  investorId: string
  content: string
  investor: {
    firstName: string
    lastName: string
  }
  createdAt: Date
}

export interface CreatePitchRequest {
  title: string
  description: string
  problem: string
  solution: string
  market: string
  businessModel: string
  competition: string
  team: string
  financials: string
  fundingAmount: number
  equity: number
  stage: string
  industry: string
  location: string
}
