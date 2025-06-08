import { Component, inject } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule, Router } from "@angular/router"
import { AuthService } from "../../../core/services/auth.service"

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./navbar.component.html",
  styleUrls: ["./navbar.component.scss"],
})
export class NavbarComponent {
  private authService = inject(AuthService)
  private router = inject(Router)
  
  isAuthenticated = this.authService.isAuthenticated
  currentUser = this.authService.currentUser$
  currentUserRole = this.authService.currentUserRole

  logout(): void {
    this.authService.logout()
  }

  navigateToDashboard(): void {
    const role = this.currentUserRole()
    if (role) {
      this.router.navigate([`/${role}`])
    }
  }
}