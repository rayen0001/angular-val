import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

export interface SocialLink {
  platform: string;
  url: string;
}

export interface Founder {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface StartupProfile {
  id?: string;
  companyName: string;
  website?: string;
  industry: string;
  stage: string;
  location: string;
  foundedYear: number;
  teamSize: number;
  description: string;
  mission: string;
  vision: string;
  socialLinks: SocialLink[];
  founder?: Founder;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalProfiles: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ProfilesResponse {
  profiles: StartupProfile[];
  pagination: PaginationInfo;
}

export interface Statistics {
  avgTeamSize: number;
  industries: string[];
  stages: string[];
  locations: string[];
}

export interface AdvancedSearchResponse extends ProfilesResponse {
  statistics: Statistics;
}

export interface SearchFilters {
  industry?: string;
  stage?: string;
  location?: string;
  minTeamSize?: number;
  maxTeamSize?: number;
  minFoundedYear?: number;
  maxFoundedYear?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root',
})
export class StartupProfileService {
  private apiUrl = 'http://localhost:5000/api/startup-profile';

  constructor(private http: HttpClient) {}

  // Get authenticated user's profile
  getProfile(): Observable<StartupProfile> {
    return this.http.get<StartupProfile>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  // Get all startup profiles (public)
  getAllProfiles(filters?: {
    page?: number;
    limit?: number;
    industry?: string;
    stage?: string;
    location?: string;
  }): Observable<ProfilesResponse> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.industry) params = params.set('industry', filters.industry);
      if (filters.stage) params = params.set('stage', filters.stage);
      if (filters.location) params = params.set('location', filters.location);
    }

    return this.http.get<ProfilesResponse>(`${this.apiUrl}/all`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  // Get startup profile by ID (public)
  getProfileById(id: string): Observable<StartupProfile> {
    return this.http.get<StartupProfile>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Advanced search for investors
  advancedSearch(filters: SearchFilters): Observable<AdvancedSearchResponse> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof SearchFilters];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<AdvancedSearchResponse>(`${this.apiUrl}/search/advanced`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  // Create or update profile
  updateProfile(profile: StartupProfile): Observable<StartupProfile> {
    return this.http.put<StartupProfile>(this.apiUrl, profile).pipe(
      tap(() => console.log('Profile updated successfully')),
      catchError(this.handleError)
    );
  }

  // Delete profile
  deleteProfile(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(this.apiUrl).pipe(
      tap(() => console.log('Profile deleted successfully')),
      catchError(this.handleError)
    );
  }

  // Helper method to get unique values for filters
  getFilterOptions(): Observable<{
    industries: string[];
    stages: string[];
    locations: string[];
  }> {
    return this.advancedSearch({ limit: 1 }).pipe(
      map(response => ({
        industries: response.statistics.industries,
        stages: response.statistics.stages,
        locations: response.statistics.locations
      })),
      catchError(this.handleError)
    );
  }

  // Search profiles with text query
  searchProfiles(
    query: string, 
    filters?: Omit<SearchFilters, 'search'>
  ): Observable<AdvancedSearchResponse> {
    return this.advancedSearch({ ...filters, search: query });
  }

  // Get profiles by industry
  getProfilesByIndustry(
    industry: string, 
    page: number = 1, 
    limit: number = 10
  ): Observable<ProfilesResponse> {
    return this.getAllProfiles({ industry, page, limit });
  }

  // Get profiles by stage
  getProfilesByStage(
    stage: string, 
    page: number = 1, 
    limit: number = 10
  ): Observable<ProfilesResponse> {
    return this.getAllProfiles({ stage, page, limit });
  }

  // Get profiles by location
  getProfilesByLocation(
    location: string, 
    page: number = 1, 
    limit: number = 10
  ): Observable<ProfilesResponse> {
    return this.getAllProfiles({ location, page, limit });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred. Please try again.';
    
    if (error.status === 400) {
      errorMessage = error.error.errors?.map((err: any) => err.msg).join(' ') || 'Invalid input.';
    } else if (error.status === 401) {
      errorMessage = 'Unauthorized. Please log in.';
    } else if (error.status === 403) {
      errorMessage = 'Access denied. Insufficient permissions.';
    } else if (error.status === 404) {
      errorMessage = 'Profile not found.';
    } else if (error.status === 500) {
      errorMessage = 'Server error. Please try again later.';
    }
    
    console.error('StartupProfileService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}