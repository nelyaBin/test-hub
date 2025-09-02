// run-button.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-run-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="run-btn">
    Run
    </button>
  `,
  styleUrls: ['./run-button.component.scss']
})
export class RunButtonComponent {}
