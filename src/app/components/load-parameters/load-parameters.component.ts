// src/app/components/load-parameters/load-parameters.component.ts
import { Component, signal, input, output, computed } from '@angular/core';
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
  readonly virtualUsers = signal<number>(10);
  readonly duration = signal<number>(5);
  readonly durationUnit = signal<DurationUnit>('minutes');
  readonly scenarioType = signal<ScenarioType>('fixed-vus');
  readonly rampUpDuration = signal<number>(0);
  readonly rampDownDuration = signal<number>(0);
  readonly testType = input.required<TestType>();

  readonly virtualUsersChanged = output<number>();
  readonly durationChanged = output<number>();
  readonly durationUnitChanged = output<DurationUnit>();
  readonly scenarioTypeChanged = output<ScenarioType>();
  readonly rampUpChanged = output<number>();
  readonly rampDownChanged = output<number>();

  readonly scenarioTypes: { value: ScenarioType; label: string }[] = [
    { value: 'fixed-vus', label: 'Fixed VUs' },
    { value: 'ramping-vus', label: 'Ramping VUs' },
    { value: 'constant-arrival-rate', label: 'Constant Arrival Rate' },
  ];

  readonly showHoursOption = computed(() => this.testType() === 'soak');
  readonly showRampParameters = computed(() => this.scenarioType() === 'ramping-vus');

  onVirtualUsersChange(value: number): void {
    this.virtualUsers.set(value);
    this.virtualUsersChanged.emit(value);
  }

  onDurationChange(value: number): void {
    this.duration.set(value);
    this.durationChanged.emit(value);
  }

  onDurationUnitChange(unit: DurationUnit): void {
    this.durationUnit.set(unit);
    this.durationUnitChanged.emit(unit);
  }

  onScenarioTypeChange(type: ScenarioType): void {
    this.scenarioType.set(type);
    this.scenarioTypeChanged.emit(type);
  }

  onRampUpChange(value: number): void {
    this.rampUpDuration.set(value);
    this.rampUpChanged.emit(value);
  }

  onRampDownChange(value: number): void {
    this.rampDownDuration.set(value);
    this.rampDownChanged.emit(value);
  }
}