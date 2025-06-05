import { Injectable } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { Observable } from "rxjs"
import { Pitch, CreatePitchRequest, Vote, Comment } from "../models/pitch.model"

@Injectable({
  providedIn: "root",
})
export class PitchService {
  private readonly API_URL = "http://localhost:5000/api"

  constructor(private http: HttpClient) {}

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
}
