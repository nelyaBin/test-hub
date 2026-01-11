// src/app/services/load-test-state.service.ts
import { Injectable, signal } from '@angular/core';
import { TestType, TestTypeState } from '../models/load-test.models';

@Injectable({
  providedIn: 'root'
})
export class LoadTestStateService {
  private testTypeStates: Record<TestType, TestTypeState> = {
    load: {
      virtualUsers: 50,
      duration: 5,
      durationUnit: 'minutes',
      scenarioType: 'ramping-vus',
      rampUpDuration: 1,
      rampDownDuration: 0.5,
      controlPoints: [
        { time: 0, vus: 0 },
        { time: 5, vus: 50 },
      ],
      isCustomMode: false,
      hasBeenEdited: false,
    },
    stress: {
      virtualUsers: 200,
      duration: 10,
      durationUnit: 'minutes',
      scenarioType: 'ramping-vus',
      rampUpDuration: 3,
      rampDownDuration: 1,
      controlPoints: [
        { time: 0, vus: 0 },
        { time: 10, vus: 200 },
      ],
      isCustomMode: false,
      hasBeenEdited: false,
    },
    spike: {
      virtualUsers: 100,
      duration: 1,
      durationUnit: 'minutes',
      scenarioType: 'ramping-vus',
      rampUpDuration: 0.08,
      rampDownDuration: 0.08,
      controlPoints: [
        { time: 0, vus: 0 },
        { time: 1, vus: 100 },
      ],
      isCustomMode: false,
      hasBeenEdited: false,
    },
    soak: {
      virtualUsers: 20,
      duration: 1,
      durationUnit: 'hours',
      scenarioType: 'fixed-vus',
      rampUpDuration: 0,
      rampDownDuration: 0,
      controlPoints: [
        { time: 0, vus: 0 },
        { time: 6, vus: 20 },
        { time: 54, vus: 20 },
        { time: 60, vus: 0 },
      ],
      isCustomMode: false,
      hasBeenEdited: false,
    },
  };

  getState(testType: TestType): TestTypeState {
    return { ...this.testTypeStates[testType] };
  }

  updateState(testType: TestType, updates: Partial<TestTypeState>): void {
    this.testTypeStates[testType] = {
      ...this.testTypeStates[testType],
      ...updates,
    };
  }

  markAsEdited(testType: TestType): void {
    this.testTypeStates[testType].hasBeenEdited = true;
  }

  hasBeenEdited(testType: TestType): boolean {
    return this.testTypeStates[testType].hasBeenEdited;
  }

  resetAll(): void {
    Object.keys(this.testTypeStates).forEach(key => {
      const testType = key as TestType;
      this.testTypeStates[testType].hasBeenEdited = false;
      this.testTypeStates[testType].isCustomMode = false;
    });
  }
}