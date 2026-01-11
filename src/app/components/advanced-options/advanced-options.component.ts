// src/app/components/advanced-options/advanced-options.component.ts
import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-advanced-options',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './advanced-options.component.html',
  styleUrls: ['./advanced-options.component.scss']
})
export class AdvancedOptionsComponent {
  readonly showAdvanced = signal<boolean>(false);
  readonly headers = signal<{ key: string; value: string }[]>([{ key: '', value: '' }]);
  readonly thresholds = signal<{ metric: string; condition: string }[]>([{ metric: '', condition: '' }]);
  readonly environmentVariables = signal<{ key: string; value: string }[]>([{ key: '', value: '' }]);

  readonly headersChanged = output<{ key: string; value: string }[]>();
  readonly thresholdsChanged = output<{ metric: string; condition: string }[]>();
  readonly envVarsChanged = output<{ key: string; value: string }[]>();

  toggleAdvanced(): void {
    this.showAdvanced.update(v => !v);
  }

  // Headers
  addHeader(): void {
    this.headers.update(headers => {
      const updated = [...headers, { key: '', value: '' }];
      this.headersChanged.emit(updated);
      return updated;
    });
  }

  removeHeader(index: number): void {
    this.headers.update(headers => {
      const updated = headers.filter((_, i) => i !== index);
      this.headersChanged.emit(updated);
      return updated;
    });
  }

  updateHeaderKey(index: number, value: string): void {
    this.headers.update(headers => {
      const updated = [...headers];
      updated[index] = { ...updated[index], key: value };
      this.headersChanged.emit(updated);
      return updated;
    });
  }

  updateHeaderValue(index: number, value: string): void {
    this.headers.update(headers => {
      const updated = [...headers];
      updated[index] = { ...updated[index], value: value };
      this.headersChanged.emit(updated);
      return updated;
    });
  }

  // Thresholds
  addThreshold(): void {
    this.thresholds.update(thresholds => {
      const updated = [...thresholds, { metric: '', condition: '' }];
      this.thresholdsChanged.emit(updated);
      return updated;
    });
  }

  removeThreshold(index: number): void {
    this.thresholds.update(thresholds => {
      const updated = thresholds.filter((_, i) => i !== index);
      this.thresholdsChanged.emit(updated);
      return updated;
    });
  }

  updateThresholdMetric(index: number, value: string): void {
    this.thresholds.update(thresholds => {
      const updated = [...thresholds];
      updated[index] = { ...updated[index], metric: value };
      this.thresholdsChanged.emit(updated);
      return updated;
    });
  }

  updateThresholdCondition(index: number, value: string): void {
    this.thresholds.update(thresholds => {
      const updated = [...thresholds];
      updated[index] = { ...updated[index], condition: value };
      this.thresholdsChanged.emit(updated);
      return updated;
    });
  }

  // Environment Variables
  addEnvironmentVariable(): void {
    this.environmentVariables.update(envVars => {
      const updated = [...envVars, { key: '', value: '' }];
      this.envVarsChanged.emit(updated);
      return updated;
    });
  }

  removeEnvironmentVariable(index: number): void {
    this.environmentVariables.update(envVars => {
      const updated = envVars.filter((_, i) => i !== index);
      this.envVarsChanged.emit(updated);
      return updated;
    });
  }

  updateEnvVarKey(index: number, value: string): void {
    this.environmentVariables.update(envVars => {
      const updated = [...envVars];
      updated[index] = { ...updated[index], key: value };
      this.envVarsChanged.emit(updated);
      return updated;
    });
  }

  updateEnvVarValue(index: number, value: string): void {
    this.environmentVariables.update(envVars => {
      const updated = [...envVars];
      updated[index] = { ...updated[index], value: value };
      this.envVarsChanged.emit(updated);
      return updated;
    });
  }
}