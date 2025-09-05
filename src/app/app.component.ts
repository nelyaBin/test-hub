import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
  ],
  template: `
    <app-navbar></app-navbar>
    <div class="page-container">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 20px;
      font-family: Arial, sans-serif;
    }
  `]
})
export class AppComponent {}
