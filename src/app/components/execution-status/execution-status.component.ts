// src/app/components/execution-status/execution-status.component.ts
import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExecutionStatus } from '../../models/load-test.models';

@Component({
  selector: 'app-execution-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './execution-status.component.html',
  styleUrls: ['./execution-status.component.scss']
})
export class ExecutionStatusComponent {
  readonly status = input.required<ExecutionStatus>();
  readonly totalDuration = input.required<number>();

  readonly viewResults = output<void>();

  readonly statusClass = computed(() => `status-${this.status().status}`);

  readonly progressPercentage = computed(() => 
    Math.round(this.status().progress || 0)
  );

  readonly elapsedTimeFormatted = computed(() => {
    const elapsed = this.status().elapsedTime || 0;
    const hours = Math.floor(elapsed / 60);
    const minutes = elapsed % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  });

  onViewResults(): void {
    this.viewResults.emit();
  }
}