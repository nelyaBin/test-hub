// src/app/components/load-test-form/load-test-form.component.ts
import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestType, ScenarioType, DurationUnit } from '../../models/load-test.models';

@Component({
  selector: 'app-load-test-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './load-test-form.component.html',
  styleUrls: ['./load-test-form.component.scss']
})
export class LoadTestFormComponent {
  readonly selectedComponent = signal<string>('');
  readonly targetUrl = signal<string>('');
  readonly targetUrlError = signal<string>('');
  
  readonly components = signal<string[]>([
    'API Gateway',
    'User Service',
    'Payment Service',
    'Notification Service',
    'Analytics Service',
  ]);

  // Outputs
  readonly componentChanged = output<string>();
  readonly urlChanged = output<string>();

  onComponentChange(component: string): void {
    this.selectedComponent.set(component);
    this.componentChanged.emit(component);
  }

  onTargetUrlChange(value: string): void {
    this.targetUrl.set(value);
    this.validateUrl(value);
    this.urlChanged.emit(value);
  }

  private validateUrl(url: string): void {
    if (!url.trim()) {
      this.targetUrlError.set('');
      return;
    }

    try {
      const urlObj = new URL(url);
      const isValid = urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
      this.targetUrlError.set(isValid ? '' : 'URL must start with http:// or https://');
    } catch {
      this.targetUrlError.set('Invalid URL format');
    }
  }

  isValid(): boolean {
    return this.selectedComponent() !== '' && 
           this.targetUrl().trim() !== '' && 
           this.targetUrlError() === '';
  }
}