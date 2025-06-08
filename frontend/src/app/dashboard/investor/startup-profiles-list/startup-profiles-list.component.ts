import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, switchMap, startWith } from 'rxjs';
import { StartupProfileService, StartupProfile, ProfilesResponse, SearchFilters } from '../../../core/services/startup-profile.service';

@Component({
  selector: 'app-startup-profiles-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './startup-profiles-list.component.html',
  styleUrls: ['./startup-profiles-list.component.scss']
})
export class StartupProfilesListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Signals
  profiles = signal<StartupProfile[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  totalProfiles = signal<number>(0);
  currentPage = signal<number>(1);
  pageSize = signal<number>(12);
  industries = signal<string[]>([]);
  locations = signal<string[]>([]);

  // Computed
  uniqueIndustries = computed(() => new Set(this.profiles().map(p => p.industry)).size);

  // Form
  filtersForm: FormGroup;

  constructor(
    private startupService: StartupProfileService,
    private fb: FormBuilder
  ) {
    this.filtersForm = this.fb.group({
      search: [''],
      industry: [''],
      stage: [''],
      location: [''],
      sortBy: ['createdAt']
    });
  }

  ngOnInit() {
    this.loadFilterOptions();
    this.setupFormSubscription();
    this.loadProfiles();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFormSubscription() {
    this.filtersForm.valueChanges.pipe(
      startWith(this.filtersForm.value),
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage.set(1);
      this.loadProfiles();
    });
  }

  private loadFilterOptions() {
    this.startupService.getFilterOptions().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (options) => {
        this.industries.set(options.industries);
        this.locations.set(options.locations);
      },
      error: (err) => console.error('Failed to load filter options:', err)
    });
  }

  loadProfiles() {
    this.loading.set(true);
    this.error.set(null);

    const filters: SearchFilters = {
      ...this.filtersForm.value,
      page: this.currentPage(),
      limit: this.pageSize(),
      sortOrder: 'desc' as const
    };

    // Remove empty values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof SearchFilters] === '' || filters[key as keyof SearchFilters] === null) {
        delete filters[key as keyof SearchFilters];
      }
    });

    this.startupService.getAllProfiles(filters).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: ProfilesResponse) => {
        this.profiles.set(response.profiles);
        this.totalProfiles.set(response.pagination.totalProfiles);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadProfiles();
  }

  clearFilters() {
    this.filtersForm.reset({
      search: '',
      industry: '',
      stage: '',
      location: '',
      sortBy: 'createdAt'
    });
  }

  trackByProfileId(index: number, profile: StartupProfile): string {
    return profile.id || index.toString();
  }

  getSocialIcon(platform: string): string {
    const iconMap: { [key: string]: string } = {
      'linkedin': 'business',
      'twitter': 'alternate_email',
      'facebook': 'facebook',
      'instagram': 'camera_alt',
      'github': 'code',
      'website': 'language'
    };
    return iconMap[platform.toLowerCase()] || 'link';
  }

  openWebsite(url: string) {
    window.open(url, '_blank');
  }

  openSocialLink(url: string) {
    window.open(url, '_blank');
  }

  viewProfile(profile: StartupProfile) {
    // Navigate to profile detail page
    console.log('View profile:', profile);
  }

  contactFounder(profile: StartupProfile) {
    // Open contact modal or navigate to contact page
    console.log('Contact founder:', profile);
  }
}