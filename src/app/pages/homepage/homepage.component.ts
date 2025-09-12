// pages/homepage/homepage.component.ts
import { Component } from '@angular/core';
import { ComponentListComponent } from '../../components/component-list/component-list.component';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [ComponentListComponent],
  template: `
    <div class="homepage-container">
      <app-component-list></app-component-list>
    </div>
  `,
  styles: [`
    .homepage-container {
      padding: 20px;
    }
  `]
})
export class HomepageComponent {}