import { Routes } from "@angular/router"
import { authGuard } from "./core/guards/auth.guard"
import { roleGuard } from "./core/guards/role.guard"

export const routes: Routes = [
  {
    path: "",
    loadComponent: () => import("./pages/home/home.component").then((m) => m.HomeComponent),
  },
  {
    path: "login",
    loadComponent: () => import("./auth/login/login.component").then((m) => m.LoginComponent),
  },
  {
    path: "register",
    loadComponent: () => import("./auth/register/register.component").then((m) => m.RegisterComponent),
  },
  {
    path: "founder",
    canActivate: [authGuard, roleGuard],
    data: { roles: ["founder"] },
    children: [
      {
        path: "",
        loadComponent: () =>
          import("./dashboard/founder/founder-dashboard.component").then((m) => m.FounderDashboardComponent),
      },
      {
        path: "pitch/create",
        loadComponent: () =>
          import("./pitches/create-pitch/create-pitch.component").then((m) => m.CreatePitchComponent),
      },
      {
        path: "pitch/edit/:id",
        loadComponent: () => import("./pitches/edit-pitch/edit-pitch.component").then((m) => m.EditPitchComponent),
      },
      {
        path: "profile",
        loadComponent: () =>
          import("./dashboard/founder/startup-profile/startup-profile.component").then(
            (m) => m.StartupProfileComponent,
          ),
      },
    ],
  },
  {
    path: "investor",
    canActivate: [authGuard, roleGuard],
    data: { roles: ["investor"] },
    children: [
      {
        path: "",
        loadComponent: () =>
          import("./dashboard/investor/investor-dashboard.component").then((m) => m.InvestorDashboardComponent),
      },
      {
        path: "pitch/:id",
        loadComponent: () =>
          import("./pitches/pitch-detail/pitch-detail.component").then((m) => m.PitchDetailComponent),
      },
            {
        path: "startup-profiles",
        loadComponent: () =>
          import("./dashboard/investor/startup-profiles-list/startup-profiles-list.component").then((m) => m.StartupProfilesListComponent),
      },
    ],
  },
  {
    path: "admin",
    canActivate: [authGuard, roleGuard],
    data: { roles: ["admin"] },
    children: [
      {
        path: "",
        loadComponent: () =>
          import("./dashboard/admin/admin-dashboard.component").then((m) => m.AdminDashboardComponent),
      },
      {
        path: "contests",
        loadComponent: () =>
          import("./dashboard/admin/contest-management/contest-management.component").then(
            (m) => m.ContestManagementComponent,
          ),
      },
    ],
  },
  {
    path: "**",
    redirectTo: "",
  },
]
