import { Injectable } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { Observable } from "rxjs"
import { Pitch, CreatePitchRequest, Vote, Comment } from "../models/pitch.model"

export interface CommentStats {
  totalComments: number
  pitchesCommentedOn: number
  commentsByPitch: Array<{
    _id: string
    count: number
    lastCommentDate: string
  }>
  recentComments: Array<{
    id: string
    content: string
    pitchTitle: string
    pitchId: string
    createdAt: string
  }>
}

export interface UserCommentsResponse {
  count: number
  comments: Comment[]
}

export interface SSEConnectionStatus {
  founderId: string
  activeConnections: number
  status: 'connected' | 'disconnected'
  serverStats: {
    totalConnections: number
    activeConnections: number
  }
}

export interface SSEAdminStats {
  totalConnections: number
  activeConnections: number
  connectedFounders: string[]
  uptime: number
  timestamp: string
}

@Injectable({
  providedIn: "root",
})
export class PitchService {
  private readonly API_URL = "http://localhost:5000/api"

  constructor(private http: HttpClient) {}

  // Existing methods
  getAllPitches(): Observable<Pitch[]> {
    return this.http.get<Pitch[]>(`${this.API_URL}/pitches`)
  }

  getPitchById(id: string): Observable<Pitch> {
    return this.http.get<Pitch>(`${this.API_URL}/pitches/${id}`)
  }

  getFounderPitches(): Observable<Pitch[]> {
    return this.http.get<Pitch[]>(`${this.API_URL}/pitches/founder`)
  }

  createPitch(pitch: CreatePitchRequest): Observable<Pitch> {
    return this.http.post<Pitch>(`${this.API_URL}/pitches`, pitch)
  }

  updatePitch(id: string, pitch: Partial<CreatePitchRequest>): Observable<Pitch> {
    return this.http.put<Pitch>(`${this.API_URL}/pitches/${id}`, pitch)
  }

  deletePitch(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/pitches/${id}`)
  }

  votePitch(pitchId: string, score: number): Observable<Vote> {
    return this.http.post<Vote>(`${this.API_URL}/pitches/${pitchId}/vote`, { score })
  }

  commentPitch(pitchId: string, content: string): Observable<Comment> {
    return this.http.post<Comment>(`${this.API_URL}/pitches/${pitchId}/comment`, { content })
  }

  getPitchVotes(pitchId: string): Observable<Vote[]> {
    return this.http.get<Vote[]>(`${this.API_URL}/pitches/${pitchId}/votes`)
  }

  getPitchComments(pitchId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.API_URL}/pitches/${pitchId}/comments`)
  }

  // New methods based on the Express router
  
  /**
   * Get user's comment statistics across all pitches (investor only)
   */
  getUserCommentStats(): Observable<CommentStats> {
    return this.http.get<CommentStats>(`${this.API_URL}/pitches/user/comment-stats`)
  }

  /**
   * Get user's comments on a specific pitch (investor only)
   */
  getUserCommentsOnPitch(pitchId: string): Observable<UserCommentsResponse> {
    return this.http.get<UserCommentsResponse>(`${this.API_URL}/pitches/${pitchId}/user-comments`)
  }

  /**
   * Get SSE connection status for the current founder
   */
  getSSEConnectionStatus(): Observable<SSEConnectionStatus> {
    return this.http.get<SSEConnectionStatus>(`${this.API_URL}/pitches/notifications/status`)
  }

  /**
   * Get SSE server statistics (admin only)
   */
  getSSEAdminStats(): Observable<SSEAdminStats> {
    return this.http.get<SSEAdminStats>(`${this.API_URL}/pitches/notifications/admin/stats`)
  }

  /**
   * Get SSE stream URL for notifications (founder only)
   * Note: This returns the URL for EventSource connection, not an Observable
   */
  getSSEStreamUrl(): string {
    return `${this.API_URL}/pitches/notifications/stream`
  }

  /**
   * Create EventSource for SSE notifications (founder only)
   * Returns EventSource instance for real-time notifications
   */
  createSSEConnection(): EventSource {
    const token = localStorage.getItem('token') // Adjust based on your auth implementation
    const url = new URL(this.getSSEStreamUrl())
    
    const eventSource = new EventSource(url.toString())
    
    // Add authorization header if needed (some browsers don't support headers in EventSource)
    // You might need to pass the token as a query parameter instead
    if (token) {
      // If your backend supports token in query params for SSE
      url.searchParams.append('token', token)
      return new EventSource(url.toString())
    }
    
    return eventSource
  }
}