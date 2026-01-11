// src/app/pages/ecstasy/ecstasy.component.ts
import { Component, signal, computed, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { LoadTestFormComponent } from '../../components/load-test-form/load-test-form.component';
import { LoadGraphComponent } from '../../components/load-graph/load-graph.component';
import { LoadParametersComponent } from '../../components/load-parameters/load-parameters.component';
import { AdvancedOptionsComponent } from '../../components/advanced-options/advanced-options.component';
import { ExecutionStatusComponent } from '../../components/execution-status/execution-status.component';

import { LoadTestStateService } from '../../services/load-test-state.service';
import { LoadTestApiService } from '../../services/load-test-api.service';
import { ControlPointsCalculatorService } from '../../services/control-points-calculator.service';

import {
  TestType,
  ScenarioType,
  DurationUnit,
  ControlPoint,
  LoadTestConfiguration,
  ExecutionStatus
} from '../../models/load-test.models';

@Component({
  selector: 'app-ecstasy',
  standalone: true,
  imports: [
    CommonModule,
    LoadTestFormComponent,
    LoadGraphComponent,
    LoadParametersComponent,
    AdvancedOptionsComponent,
    ExecutionStatusComponent
  ],
  templateUrl: './ecstasy.component.html',
  styleUrls: ['./ecstasy.component.scss']
})
export class EcstasyComponent implements OnDestroy {
  // Form state
  readonly selectedComponent = signal<string>('');
  readonly targetUrl = signal<string>('');
  readonly testType = signal<TestType>('load');

  // Graph state
  readonly controlPoints = signal<ControlPoint[]>([
    { time: 0, vus: 0 },
    { time: 5, vus: 10 },
  ]);
  readonly isCustomMode = signal<boolean>(false);
  readonly showK6Phases = signal<boolean>(false);

  // Load parameters
  readonly virtualUsers = signal<number>(10);
  readonly duration = signal<number>(5);
  readonly durationUnit = signal<DurationUnit>('minutes');
  readonly scenarioType = signal<ScenarioType>('fixed-vus');
  readonly rampUpDuration = signal<number>(0);
  readonly rampDownDuration = signal<number>(0);

  // Advanced options
  readonly headers = signal<{ key: string; value: string }[]>([{ key: '', value: '' }]);
  readonly thresholds = signal<{ metric: string; condition: string }[]>([{ metric: '', condition: '' }]);
  readonly environmentVariables = signal<{ key: string; value: string }[]>([{ key: '', value: '' }]);

  // Execution state
  readonly executionStatus = signal<ExecutionStatus>({ status: 'idle' });
  readonly showResultsIframe = signal<boolean>(false);
  private executionInterval?: number;

  // Computed values
  readonly maxVUs = computed(() => {
    const points = this.controlPoints();
    return Math.max(this.virtualUsers(), ...points.map(p => p.vus), 1);
  });

  readonly totalDurationInMinutes = computed(() => {
    const duration = this.duration();
    const unit = this.durationUnit();
    return unit === 'hours' ? duration * 60 : duration;
  });

  readonly isConfigurationValid = computed(() => {
    const hasComponent = this.selectedComponent() !== '';
    const hasUrl = this.targetUrl().trim() !== '';
    const hasVUs = this.virtualUsers() > 0;
    const hasDuration = this.duration() > 0;
    
    return hasComponent && hasUrl && hasVUs && hasDuration;
  });

  readonly canRunTest = computed(() => {
    return this.isConfigurationValid() && this.executionStatus().status !== 'running';
  });

  constructor(
    private stateService: LoadTestStateService,
    private apiService: LoadTestApiService,
    private calculatorService: ControlPointsCalculatorService,
    private sanitizer: DomSanitizer
  ) {
    this.setupEffects();
  }

  private setupEffects(): void {
    // Load state when test type changes
    effect(() => {
      const type = this.testType();
      this.loadTestTypeState(type);
    });

    // Save state changes
    effect(() => {
      const type = this.testType();
      this.stateService.updateState(type, {
        virtualUsers: this.virtualUsers(),
        duration: this.duration(),
        durationUnit: this.durationUnit(),
        scenarioType: this.scenarioType(),
        rampUpDuration: this.rampUpDuration(),
        rampDownDuration: this.rampDownDuration(),
        controlPoints: [...this.controlPoints()],
        isCustomMode: this.isCustomMode(),
        hasBeenEdited: this.stateService.hasBeenEdited(type)
      });
    });

    // Adjust control points when duration changes
    effect(() => {
      this.adjustControlPointsForNewDuration();
    });

    // Update graph from config if not edited
    effect(() => {
      const vus = this.virtualUsers();
      const duration = this.totalDurationInMinutes();
      const scenario = this.scenarioType();
      const isCustom = this.isCustomMode();
      const type = this.testType();

      if (!isCustom && !this.stateService.hasBeenEdited(type)) {
        this.updateControlPointsFromConfig();
      }
    });
  }

  private loadTestTypeState(type: TestType): void {
    const state = this.stateService.getState(type);

    this.virtualUsers.set(state.virtualUsers);
    this.duration.set(state.duration);
    this.durationUnit.set(state.durationUnit);
    this.scenarioType.set(state.scenarioType);
    this.rampUpDuration.set(state.rampUpDuration);
    this.rampDownDuration.set(state.rampDownDuration);
    this.controlPoints.set([...state.controlPoints]);
    this.isCustomMode.set(state.isCustomMode);
  }

  private updateControlPointsFromConfig(): void {
    const newPoints = this.calculatorService.calculateControlPoints(
      this.scenarioType(),
      this.virtualUsers(),
      this.totalDurationInMinutes(),
      this.rampUpDuration(),
      this.rampDownDuration()
    );

    this.controlPoints.set(newPoints);
  }

  private adjustControlPointsForNewDuration(): void {
    const currentPoints = this.controlPoints();
    if (currentPoints.length === 0) return;

    const newDuration = this.totalDurationInMinutes();
    const adjustedPoints = this.calculatorService.adjustPointsForNewDuration(
      currentPoints,
      newDuration
    );

    if (JSON.stringify(adjustedPoints) !== JSON.stringify(currentPoints)) {
      this.controlPoints.set(adjustedPoints);
    }
  }

  // Event handlers from form
  onComponentChanged(component: string): void {
    this.selectedComponent.set(component);
  }

  onUrlChanged(url: string): void {
    this.targetUrl.set(url);
  }

  onTestTypeChanged(testType: TestType): void {
    this.testType.set(testType);
  }

  // Event handlers from parameters
  onVirtualUsersChanged(vus: number): void {
    this.virtualUsers.set(vus);
  }

  onDurationChanged(duration: number): void {
    this.duration.set(duration);
  }

  onDurationUnitChanged(unit: DurationUnit): void {
    const prevUnit = this.durationUnit();
    if (prevUnit === unit) return;

    this.durationUnit.set(unit);
    const normalizedPoints = this.calculatorService.normalizeToEnd(
      this.controlPoints(),
      this.totalDurationInMinutes()
    );
    this.controlPoints.set(normalizedPoints);
  }

  onScenarioTypeChanged(type: ScenarioType): void {
    this.scenarioType.set(type);
  }

  onRampUpChanged(value: number): void {
    this.rampUpDuration.set(value);
  }

  onRampDownChanged(value: number): void {
    this.rampDownDuration.set(value);
  }

  // UI toggles
  toggleEditMode(): void {
    this.isCustomMode.update(v => !v);
  }

  toggleK6Phases(): void {
    this.showK6Phases.update(v => !v);
  }

  // Graph event handlers
  onPointAdded(point: ControlPoint): void {
    const points = [...this.controlPoints()];
    let insertIdx = points.findIndex(p => p.time > point.time);
    if (insertIdx === -1) insertIdx = points.length;

    if (
      (insertIdx > 0 && points[insertIdx - 1].time === point.time) ||
      (insertIdx < points.length && points[insertIdx].time === point.time)
    ) {
      return;
    }

    points.splice(insertIdx, 0, point);
    this.controlPoints.set(points);
    this.stateService.markAsEdited(this.testType());
  }

  onPointUpdated(event: { index: number; point: ControlPoint }): void {
    const points = [...this.controlPoints()];
    points[event.index] = event.point;
    this.controlPoints.set(points);
    this.stateService.markAsEdited(this.testType());
  }

  onPointDeleted(index: number): void {
    if (this.controlPoints().length <= 2) return;
    
    const points = this.controlPoints().filter((_, i) => i !== index);
    this.controlPoints.set(points);
    this.stateService.markAsEdited(this.testType());
  }

  // Advanced options handlers
  onHeadersChanged(headers: { key: string; value: string }[]): void {
    this.headers.set(headers);
  }

  onThresholdsChanged(thresholds: { metric: string; condition: string }[]): void {
    this.thresholds.set(thresholds);
  }

  onEnvVarsChanged(envVars: { key: string; value: string }[]): void {
    this.environmentVariables.set(envVars);
  }

  // Helper method for template
  formatControlPointTime(time: number): string {
    const unit = this.durationUnit();

    if (unit === 'hours') {
      const hours = Math.floor(time / 60);
      const minutes = Math.round(time % 60);
      if (minutes === 0) return `${hours}h`;
      return `${hours}h ${minutes}m`;
    } else {
      return `${Math.round(time)}m`;
    }
  }

  // Test execution
  runTest(): void {
    if (!this.canRunTest()) return;

    const config: LoadTestConfiguration = {
      component: this.selectedComponent(),
      targetUrl: this.targetUrl(),
      testType: this.testType(),
      virtualUsers: this.virtualUsers(),
      duration: this.duration(),
      durationUnit: this.durationUnit(),
      scenarioType: this.scenarioType(),
      rampUpDuration: this.rampUpDuration() || undefined,
      rampDownDuration: this.rampDownDuration() || undefined,
      headers: this.headers().filter(h => h.key && h.value),
      thresholds: this.thresholds().filter(t => t.metric && t.condition),
      environmentVariables: this.environmentVariables().filter(e => e.key && e.value),
      controlPoints: this.controlPoints(),
    };

    this.executionStatus.set({
      status: 'running',
      startTime: new Date(),
    });

    this.apiService.runLoadTest(config).subscribe({
      next: (res: any) => {
        console.log('✅ Test started', res);
        this.executionStatus.update(s => ({
          ...s,
          status: 'running',
          testId: res?.testId,
        }));
        this.startProgressTracking();
      },
      error: (err) => {
        console.error('❌ Failed to start test', err);
        this.executionStatus.set({ status: 'failed' });
      },
    });
  }

  private startProgressTracking(): void {
    let elapsed = 0;
    const totalDuration = this.totalDurationInMinutes();

    this.executionInterval = window.setInterval(() => {
      elapsed += 1;
      const progress = Math.min((elapsed / totalDuration) * 100, 100);

      const points = this.controlPoints();
      let currentVUs = 0;

      for (let i = 0; i < points.length - 1; i++) {
        if (elapsed >= points[i].time && elapsed <= points[i + 1].time) {
          const segmentProgress =
            (elapsed - points[i].time) / (points[i + 1].time - points[i].time);
          currentVUs = Math.round(
            points[i].vus + (points[i + 1].vus - points[i].vus) * segmentProgress
          );
          break;
        }
      }

      this.executionStatus.update(status => ({
        ...status,
        elapsedTime: elapsed,
        currentVUs,
        progress,
      }));

      if (elapsed >= totalDuration) {
        this.completeTest();
      }
    }, 1000);
  }

  private completeTest(): void {
    if (this.executionInterval) {
      clearInterval(this.executionInterval);
      this.executionInterval = undefined;
    }

    this.executionStatus.update(status => ({
      ...status,
      status: 'completed',
      progress: 100,
      currentVUs: this.virtualUsers(),
    }));
  }

  viewResults(): void {
    const testId = this.executionStatus().testId;
    if (testId) {
      this.showResultsIframe.set(true);
    }
  }

  closeResultsIframe(): void {
    this.showResultsIframe.set(false);
  }

  getResultsUrl(): SafeResourceUrl {
    const testId = this.executionStatus().testId;
    const url = `https://grafana.example.com/d/load-test?testId=${testId}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  resetConfiguration(): void {
    this.selectedComponent.set('');
    this.targetUrl.set('');
    this.testType.set('load');
    this.headers.set([{ key: '', value: '' }]);
    this.thresholds.set([{ metric: '', condition: '' }]);
    this.environmentVariables.set([{ key: '', value: '' }]);
    this.executionStatus.set({ status: 'idle' });
    this.stateService.resetAll();
    this.loadTestTypeState('load');
  }

  saveAsPreset(): void {
    console.log('Save as preset', {
      testType: this.testType(),
      controlPoints: this.controlPoints(),
      config: {
        virtualUsers: this.virtualUsers(),
        duration: this.duration(),
        durationUnit: this.durationUnit(),
        scenarioType: this.scenarioType(),
      },
    });
  }

  ngOnDestroy(): void {
    if (this.executionInterval) {
      clearInterval(this.executionInterval);
    }
  }
}