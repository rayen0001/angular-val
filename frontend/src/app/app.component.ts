import { Component, inject } from "@angular/core"
import { RouterOutlet } from "@angular/router"
import { NavbarComponent } from "./shared/components/navbar/navbar.component"


@Component({
  
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [
    `
    .main-content {
      min-height: calc(100vh - 70px);
      padding-top: 70px;
    }
  `,
  ],
})
export class AppComponent {

  title = "Pitch Platform"
}
