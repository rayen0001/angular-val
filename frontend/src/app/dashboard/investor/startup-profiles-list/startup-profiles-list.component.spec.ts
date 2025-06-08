import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StartupProfilesListComponent } from './startup-profiles-list.component';

describe('StartupProfilesListComponent', () => {
  let component: StartupProfilesListComponent;
  let fixture: ComponentFixture<StartupProfilesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StartupProfilesListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StartupProfilesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
