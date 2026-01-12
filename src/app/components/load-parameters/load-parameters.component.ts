// src/app/components/load-parameters/load-parameters.component.ts
import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScenarioType, DurationUnit, TestType } from '../../models/load-test.models';

@Component({
  selector: 'app-load-parameters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './load-parameters.component.html',
  styleUrls: ['./load-parameters.component.scss']
})
export class LoadParametersComponent {
  // ========================================
  // INPUTS - קבלת ערכים מה-PARENT
  // ========================================
  readonly testType = input.required<TestType>();
  readonly virtualUsers = input.required<number>();
  readonly duration = input.required<number>();
  readonly durationUnit = input.required<DurationUnit>();
  readonly scenarioType = input.required<ScenarioType>();
  readonly rampUpDuration = input.required<number>();
  readonly rampDownDuration = input.required<number>();

  // ========================================
  // OUTPUTS - שליחת שינויים ל-PARENT
  // ========================================
  readonly testTypeChanged = output<TestType>();
  readonly virtualUsersChanged = output<number>();
  readonly durationChanged = output<number>();
  readonly durationUnitChanged = output<DurationUnit>();
  readonly scenarioTypeChanged = output<ScenarioType>();
  readonly rampUpChanged = output<number>();
  readonly rampDownChanged = output<number>();

  // ========================================
  // STATIC DATA
  // ========================================
  readonly testTypes: { value: TestType; label: string }[] = [
    { value: 'load', label: 'Load Test' },
    { value: 'stress', label: 'Stress Test' },
    { value: 'spike', label: 'Spike Test' },
    { value: 'soak', label: 'Soak Test' },
  ];

  readonly scenarioTypes: { value: ScenarioType; label: string }[] = [
    { value: 'fixed-vus', label: 'Fixed VUs' },
    { value: 'ramping-vus', label: 'Ramping VUs' },
    { value: 'constant-arrival-rate', label: 'Constant Arrival Rate' },
  ];

  // ========================================
  // COMPUTED
  // ========================================
  readonly showHoursOption = computed(() => this.testType() === 'soak');
  readonly showRampParameters = computed(() => this.scenarioType() === 'ramping-vus');

  // ========================================
  // EVENT HANDLERS
  // ========================================
  onTestTypeChange(type: TestType): void {
    this.testTypeChanged.emit(type);
  }

  onVirtualUsersChange(value: number): void {
    this.virtualUsersChanged.emit(value);
  }

  onDurationChange(value: number): void {
    this.durationChanged.emit(value);
  }

  onDurationUnitChange(unit: DurationUnit): void {
    this.durationUnitChanged.emit(unit);
  }

  onScenarioTypeChange(type: ScenarioType): void {
    this.scenarioTypeChanged.emit(type);
  }

  onRampUpChange(value: number): void {
    this.rampUpChanged.emit(value);
  }

  onRampDownChange(value: number): void {
    this.rampDownChanged.emit(value);
  }
}