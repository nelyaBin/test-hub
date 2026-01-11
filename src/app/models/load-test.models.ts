// src/app/models/load-test.models.ts

export type TestType = 'load' | 'stress' | 'spike' | 'soak';
export type ScenarioType = 'fixed-vus' | 'ramping-vus' | 'constant-arrival-rate';
export type DurationUnit = 'minutes' | 'hours';

export interface ControlPoint {
  time: number;
  vus: number;
}

export interface TestTypeState {
  virtualUsers: number;
  duration: number;
  durationUnit: DurationUnit;
  scenarioType: ScenarioType;
  rampUpDuration: number;
  rampDownDuration: number;
  controlPoints: ControlPoint[];
  isCustomMode: boolean;
  hasBeenEdited: boolean;
}

export interface LoadTestConfiguration {
  component: string;
  targetUrl: string;
  testType: TestType;
  virtualUsers: number;
  duration: number;
  durationUnit: DurationUnit;
  scenarioType: ScenarioType;
  rampUpDuration?: number;
  rampDownDuration?: number;
  headers: { key: string; value: string }[];
  thresholds: { metric: string; condition: string }[];
  environmentVariables: { key: string; value: string }[];
  controlPoints: ControlPoint[];
}

export interface ExecutionStatus {
  status: 'idle' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  elapsedTime?: number;
  currentVUs?: number;
  progress?: number;
  testId?: string;
}