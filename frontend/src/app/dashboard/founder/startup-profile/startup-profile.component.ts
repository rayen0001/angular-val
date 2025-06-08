import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StartupProfileService, StartupProfile, SocialLink } from '../../../core/services/startup-profile.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-startup-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './startup-profile.component.html',
  styleUrls: ['./startup-profile.component.scss'],
})
export class StartupProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private startupProfileService = inject(StartupProfileService);
  private authService = inject(AuthService);

  profileForm: FormGroup;
  loading = false;
  success = false;
  errorMessage: string | null = null;
  currentUser = this.authService.getCurrentUser();
  suggestedIndustries = ['Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 'SaaS', 'Mobile', 'AI/ML', 'Other'];

  stages = [
    { value: 'idea', label: 'Idea Stage' },
    { value: 'prototype', label: 'Prototype' },
    { value: 'mvp', label: 'MVP' },
    { value: 'growth', label: 'Growth' },
    { value: 'scale', label: 'Scale' },
  ];

  constructor() {
    this.profileForm = this.fb.group({
      companyName: ['', [Validators.required, Validators.minLength(2)]],
      website: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      industry: ['', [Validators.required]],
      stage: ['', [Validators.required]],
      location: ['', [Validators.required]],
      foundedYear: ['', [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear())]],
      teamSize: ['', [Validators.required, Validators.min(1)]],
      description: ['', [Validators.required, Validators.minLength(50)]],
      mission: ['', [Validators.required, Validators.minLength(20)]],
      vision: ['', [Validators.required, Validators.minLength(20)]],
      socialLinks: this.fb.array([]),
    });
  }

  get socialLinks(): FormArray {
    return this.profileForm.get('socialLinks') as FormArray;
  }

  // Helper method to get FormControl from FormArray
  getSocialLinkControl(index: number, field: 'platform' | 'url'): FormControl {
    const group = this.socialLinks.at(index) as FormGroup;
    return group.get(field) as FormControl;
  }

  addSocialLink(platform: string = '', url: string = ''): void {
    this.socialLinks.push(
      this.fb.group({
        platform: [platform, [Validators.required]],
        url: [url, [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      })
    );
  }

  removeSocialLink(index: number): void {
    this.socialLinks.removeAt(index);
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.loading = true;
    this.startupProfileService.getProfile().subscribe({
      next: (profile: StartupProfile) => {
        this.profileForm.patchValue({
          companyName: profile.companyName,
          website: profile.website,
          industry: profile.industry,
          stage: profile.stage,
          location: profile.location,
          foundedYear: profile.foundedYear,
          teamSize: profile.teamSize,
          description: profile.description,
          mission: profile.mission,
          vision: profile.vision,
        });

        // Clear existing social links and populate from profile
        while (this.socialLinks.length) {
          this.socialLinks.removeAt(0);
        }
        profile.socialLinks.forEach(link => this.addSocialLink(link.platform, link.url));

        this.loading = false;
      },
      error: (error: Error) => {
        this.errorMessage = error.message;
        this.loading = false;
      },
    });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.loading = true;
      this.success = false;
      this.errorMessage = null;

      this.startupProfileService.updateProfile(this.profileForm.value).subscribe({
        next: (profile: StartupProfile) => {
          this.profileForm.patchValue({
            companyName: profile.companyName,
            website: profile.website,
            industry: profile.industry,
            stage: profile.stage,
            location: profile.location,
            foundedYear: profile.foundedYear,
            teamSize: profile.teamSize,
            description: profile.description,
            mission: profile.mission,
            vision: profile.vision,
          });

          // Update socialLinks FormArray
          while (this.socialLinks.length) {
            this.socialLinks.removeAt(0);
          }
          profile.socialLinks.forEach(link => this.addSocialLink(link.platform, link.url));

          this.loading = false;
          this.success = true;
          setTimeout(() => {
            this.success = false;
          }, 3000);
        },
        error: (error: Error) => {
          this.errorMessage = error.message;
          this.loading = false;
        },
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.profileForm.controls).forEach((key) => {
      const control = this.profileForm.get(key);
      if (control instanceof FormArray) {
        control.controls.forEach((group) => {
          Object.keys((group as FormGroup).controls).forEach((field) => {
            (group as FormGroup).get(field)?.markAsTouched();
          });
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  getFieldError(fieldName: string, index?: number): string {
    let field;
    if (index !== undefined && fieldName.includes('socialLinks')) {
      const [arrayName, subField] = fieldName.split('.');
      field = this.socialLinks.at(index).get(subField);
    } else {
      field = this.profileForm.get(fieldName);
    }
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName.split('.').pop()} is required`;
      if (field.errors['minlength'])
        return `${fieldName.split('.').pop()} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['pattern']) return `Please enter a valid URL for ${fieldName.split('.').pop()}`;
      if (field.errors['min']) return `${fieldName.split('.').pop()} must be at least ${field.errors['min'].min}`;
      if (field.errors['max']) return `${fieldName.split('.').pop()} cannot exceed ${field.errors['max'].max}`;
    }
    return '';
  }
}