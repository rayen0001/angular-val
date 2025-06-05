import { Injectable } from "@angular/core"
import  { HttpClient } from "@angular/common/http"
import  { map, Observable } from "rxjs"


@Injectable({
  providedIn: "root",
})
export class UsersService {
  private readonly API_URL = "http://localhost:5000/api/users"

  constructor(private http: HttpClient) {}

  getTotalUsers(): Observable<number> {
    // Your backend returns { count: number }, so map it accordingly
    return this.http.get<{ count: number }>(`${this.API_URL}/count`).pipe(
      map(response => response.count)
    );}

 
}
