import { Injectable } from "@angular/core"
import  { HttpClient } from "@angular/common/http"
import  { Observable } from "rxjs"
import  { Contest, CreateContestRequest } from "../models/contest.model"

@Injectable({
  providedIn: "root",
})
export class ContestService {
  private readonly API_URL = "http://localhost:5000/api"

  constructor(private http: HttpClient) {}

  getAllContests(): Observable<Contest[]> {
    return this.http.get<Contest[]>(`${this.API_URL}/contests`)
  }

  getContestById(id: string): Observable<Contest> {
    return this.http.get<Contest>(`${this.API_URL}/contests/${id}`)
  }

  createContest(contest: CreateContestRequest): Observable<Contest> {
    return this.http.post<Contest>(`${this.API_URL}/contests`, contest)
  }

  updateContest(id: string, contest: Partial<CreateContestRequest>): Observable<Contest> {
    return this.http.put<Contest>(`${this.API_URL}/contests/${id}`, contest)
  }

  deleteContest(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/contests/${id}`)
  }

  selectWinner(contestId: string, pitchId: string): Observable<Contest> {
    return this.http.post<Contest>(`${this.API_URL}/contests/${contestId}/winner`, { pitchId })
  }

  addPitchToContest(contestId: string, pitchId: string): Observable<Contest> {
    return this.http.post<Contest>(`${this.API_URL}/contests/${contestId}/pitches`, { pitchId })
  }
}
