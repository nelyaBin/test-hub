import {
  Component,
  signal,
  computed,
  ElementRef,
  ViewChild,
  AfterViewInit,
  effect,
  OnDestroy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";

export type TestType = "load" | "stress" | "spike" | "soak";
export type ScenarioType =
  | "fixed-vus"
  | "ramping-vus"
  | "constant-arrival-rate";

export interface ControlPoint {
  time: number;
  vus: number;
}

export interface LoadTestConfiguration {
  component: string;
  targetUrl: string;
  testType: TestType;
  virtualUsers: number;
  duration: number;
  durationUnit: "seconds" | "minutes";
  scenarioType: ScenarioType;
  rampUpDuration?: number;
  rampDownDuration?: number;
  headers: { key: string; value: string }[];
  thresholds: { metric: string; condition: string }[];
  environmentVariables: { key: string; value: string }[];
  controlPoints: ControlPoint[];
}

export interface ExecutionStatus {
  status: "idle" | "running" | "completed" | "failed";
  startTime?: Date;
  elapsedTime?: number;
  currentVUs?: number;
  progress?: number;
  testId?: string;
}

@Component({
  selector: "app-ecstasy",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./ecstasy.component.html",
  styleUrls: ["./ecstasy.component.scss"],
})
export class EcstasyComponent implements AfterViewInit, OnDestroy {
  @ViewChild("graphCanvas") canvasRef!: ElementRef<HTMLCanvasElement>;

  readonly selectedComponent = signal<string>("");
  readonly components = signal<string[]>([
    "API Gateway",
    "User Service",
    "Payment Service",
    "Notification Service",
    "Analytics Service",
  ]);

  readonly targetUrl = signal<string>("");
  readonly targetUrlError = signal<string>("");

  readonly isCustomMode = signal<boolean>(false);

  readonly editMode = this.isCustomMode;
  readonly testType = signal<TestType>("load");
  readonly virtualUsers = signal<number>(10);
  readonly duration = signal<number>(60);
  readonly durationUnit = signal<"seconds" | "minutes">("seconds");
  readonly scenarioType = signal<ScenarioType>("fixed-vus");
  readonly rampUpDuration = signal<number>(0);
  readonly rampDownDuration = signal<number>(0);

  readonly controlPoints = signal<ControlPoint[]>([
    { time: 0, vus: 0 },
    { time: 60, vus: 10 },
  ]);
  readonly showK6Phases = signal<boolean>(false);
  readonly draggedPointIndex = signal<number | null>(null);
  readonly hoveredPointIndex = signal<number | null>(null);
  readonly hoverPosition = signal<{ x: number; y: number } | null>(null);
  readonly previewPoint = signal<ControlPoint | null>(null);
  private previousDurationUnit: "seconds" | "minutes" = "seconds";
  private wasDragging = false;
  private mouseDownTime = 0;

  readonly showAdvancedOptions = signal<boolean>(false);
  readonly headers = signal<{ key: string; value: string }[]>([
    { key: "", value: "" },
  ]);
  readonly thresholds = signal<{ metric: string; condition: string }[]>([
    { metric: "", condition: "" },
  ]);
  readonly environmentVariables = signal<{ key: string; value: string }[]>([
    { key: "", value: "" },
  ]);

  readonly executionStatus = signal<ExecutionStatus>({ status: "idle" });
  readonly showResultsIframe = signal<boolean>(false);
  private executionInterval?: number;

  private ctx: CanvasRenderingContext2D | null = null;
  private readonly padding = { top: 40, right: 40, bottom: 60, left: 60 };
  private readonly pointRadius = 7;
  private readonly hitRadius = 20;

  readonly isConfigurationValid = computed(() => {
    return (
      this.selectedComponent() !== "" &&
      this.isTargetUrlValid() &&
      this.virtualUsers() > 0 &&
      this.duration() > 0
    );
  });

  readonly canRunTest = computed(() => {
    return (
      this.isConfigurationValid() && this.executionStatus().status !== "running"
    );
  });

  readonly maxVUs = computed(() => {
    const points = this.controlPoints();
    return Math.max(this.virtualUsers(), ...points.map((p) => p.vus), 1);
  });

  readonly totalDurationSeconds = computed(() => {
    return this.duration() * (this.durationUnit() === "minutes" ? 60 : 1);
  });

  readonly testTypes: { value: TestType; label: string }[] = [
    { value: "load", label: "Load Test" },
    { value: "stress", label: "Stress Test" },
    { value: "spike", label: "Spike Test" },
    { value: "soak", label: "Soak Test" },
  ];

  readonly scenarioTypes: { value: ScenarioType; label: string }[] = [
    { value: "fixed-vus", label: "Fixed VUs" },
    { value: "ramping-vus", label: "Ramping VUs" },
    { value: "constant-arrival-rate", label: "Constant Arrival Rate" },
  ];

  constructor(private sanitizer: DomSanitizer) {
    let isFirstRun = true;

    effect(() => {
      const vus = this.virtualUsers();
      const duration = this.totalDurationSeconds();
      const scenario = this.scenarioType();
      const testTypeValue = this.testType();
      const currentUnit = this.durationUnit();

      // Check if duration unit changed - if so, convert control points
      if (currentUnit !== this.previousDurationUnit) {
        this.convertControlPointsForDurationUnit(currentUnit);
        this.previousDurationUnit = currentUnit;
      }

      // Only update from config if NOT in custom mode and not being dragged
      if (!this.isCustomMode() && this.draggedPointIndex() === null) {
        if (!isFirstRun) {
          this.updateControlPointsFromConfig();
        }
        isFirstRun = false;
      }
    });

    effect(() => {
      this.controlPoints();
      this.hoveredPointIndex();
      this.draggedPointIndex();
      this.showK6Phases();
      this.previewPoint();
      this.hoverPosition();
      this.drawGraph();
    });
  }

  ngAfterViewInit(): void {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      this.initializeCanvas();
      this.setupCanvasListeners();
      // Force initial draw after everything is set up
      setTimeout(() => {
        this.drawGraph();
      }, 100);
    }, 0);
  }

  private initializeCanvas(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const cssWidth = rect.width || 800;
    const cssHeight = 400;

    const dpr = window.devicePixelRatio || 1;

    // גודל ויזואלי (CSS)
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    // גודל פנימי אמיתי
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);

    this.ctx = canvas.getContext("2d");
    if (!this.ctx) return;

    // סקלת קואורדינטות
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";
  }

  toggleEditMode(): void {
    this.isCustomMode.update((v) => !v);
  }

  private setupCanvasListeners(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
    canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));
    canvas.addEventListener("mouseup", this.handleMouseUp.bind(this));
    canvas.addEventListener("mouseleave", this.handleMouseLeave.bind(this));
    canvas.addEventListener("click", this.handleClick.bind(this));
    canvas.addEventListener("contextmenu", this.handleRightClick.bind(this));
  }

  private handleMouseMove(e: MouseEvent): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.hoverPosition.set({ x, y });

    const draggedIdx = this.draggedPointIndex();
    const isCustomMode = this.isCustomMode();

    if (draggedIdx !== null && isCustomMode) {
      this.wasDragging = true;
      this.updatePointPosition(draggedIdx, x, y);
      canvas.style.cursor = "grabbing";
      return;
    }

    const hoveredIdx = this.findPointAtPosition(x, y);
    this.hoveredPointIndex.set(hoveredIdx);

    if (hoveredIdx !== null && isCustomMode) {
      canvas.style.cursor = "grab";
      this.previewPoint.set(null);
    } else if (isCustomMode) {
      canvas.style.cursor = "crosshair";
      this.previewPoint.set(this.getPreviewPoint(x, y));
    } else {
      canvas.style.cursor = "default";
      this.previewPoint.set(null);
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    if (!this.isCustomMode()) return;

    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const pointIdx = this.findPointAtPosition(x, y);
    if (pointIdx !== null) {
      this.draggedPointIndex.set(pointIdx);
      this.wasDragging = false;
      this.mouseDownTime = Date.now();
      canvas.style.cursor = "grabbing";
      this.previewPoint.set(null);
    }
  }

  private handleMouseUp(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      const hoveredIdx = this.hoveredPointIndex();
      canvas.style.cursor = hoveredIdx !== null ? "grab" : "crosshair";
    }

    this.draggedPointIndex.set(null);

    setTimeout(() => {
      this.wasDragging = false;
    }, 0);
  }

  private handleMouseLeave(): void {
    this.hoveredPointIndex.set(null);
    this.draggedPointIndex.set(null);
    this.previewPoint.set(null);
    this.hoverPosition.set(null);
  }

  private handleClick(e: MouseEvent): void {
    if (!this.isCustomMode()) return;

    if (this.wasDragging) {
      return;
    }

    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const pointIdx = this.findPointAtPosition(x, y);
    if (pointIdx !== null) return;

    this.addPointAtPosition(x, y);
  }

  private handleRightClick(e: MouseEvent): void {
    e.preventDefault();

    if (!this.isCustomMode()) return;

    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const pointIdx = this.findPointAtPosition(x, y);
    if (pointIdx !== null) {
      this.deleteControlPoint(pointIdx);
    }
  }

  private findPointAtPosition(x: number, y: number): number | null {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return null;

    const points = this.controlPoints();
    const chartWidth = canvas.width - this.padding.left - this.padding.right;
    const chartHeight = canvas.height - this.padding.top - this.padding.bottom;
    const maxVUs = this.maxVUs();
    const duration = this.totalDurationSeconds();

    // Check from closest to farthest
    let closestIdx: number | null = null;
    let closestDistance = this.hitRadius;

    for (let i = 0; i < points.length; i++) {
      // Calculate point position more precisely
      const timeRatio = points[i].time / duration;
      const vusRatio = points[i].vus / maxVUs;

      const px = this.padding.left + timeRatio * chartWidth;
      const py = this.padding.top + chartHeight - vusRatio * chartHeight;

      const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIdx = i;
      }
    }

    return closestIdx;
  }

  private getPreviewPoint(x: number, y: number): ControlPoint | null {
    if (!this.isCustomMode()) return null;

    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return null;

    const chartWidth = canvas.width - this.padding.left - this.padding.right;
    const chartHeight = canvas.height - this.padding.top - this.padding.bottom;

    if (
      x < this.padding.left ||
      x > this.padding.left + chartWidth ||
      y < this.padding.top ||
      y > this.padding.top + chartHeight
    ) {
      return null;
    }

    const maxVUs = this.maxVUs();
    const duration = this.totalDurationSeconds();

    let newTime = Math.max(
      0,
      Math.min(duration, ((x - this.padding.left) / chartWidth) * duration)
    );
    let newVUs = Math.max(
      0,
      Math.min(
        maxVUs,
        ((this.padding.top + chartHeight - y) / chartHeight) * maxVUs
      )
    );

    newTime = Math.round(newTime / 5) * 5;
    newVUs = Math.round(newVUs);

    return { time: newTime, vus: newVUs };
  }

  private updatePointPosition(index: number, x: number, y: number): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const chartWidth = canvas.width - this.padding.left - this.padding.right;
    const chartHeight = canvas.height - this.padding.top - this.padding.bottom;
    const maxVUs = this.maxVUs();
    const duration = this.totalDurationSeconds();

    const points = [...this.controlPoints()];

    let newTime = Math.max(
      0,
      Math.min(duration, ((x - this.padding.left) / chartWidth) * duration)
    );
    let newVUs = Math.max(
      0,
      Math.min(
        maxVUs,
        ((this.padding.top + chartHeight - y) / chartHeight) * maxVUs
      )
    );

    newTime = Math.round(newTime / 5) * 5;
    newVUs = Math.round(newVUs);

    // Don't allow moving first or last point in time (only VUs)
    if (index === 0) {
      newTime = 0;
    }
    if (index === points.length - 1) {
      newTime = duration;
    }

    // Ensure monotonic time for middle points
    if (index > 0 && index < points.length - 1) {
      if (newTime <= points[index - 1].time) {
        newTime = points[index - 1].time + 5;
      }
      if (newTime >= points[index + 1].time) {
        newTime = points[index + 1].time - 5;
      }
    }

    points[index] = { time: newTime, vus: newVUs };
    this.controlPoints.set(points);
  }

  private addPointAtPosition(x: number, y: number): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const chartWidth = canvas.width - this.padding.left - this.padding.right;
    const chartHeight = canvas.height - this.padding.top - this.padding.bottom;
    const maxVUs = this.maxVUs();
    const duration = this.totalDurationSeconds();

    let newTime = Math.max(
      0,
      Math.min(duration, ((x - this.padding.left) / chartWidth) * duration)
    );
    let newVUs = Math.max(
      0,
      Math.min(
        maxVUs,
        ((this.padding.top + chartHeight - y) / chartHeight) * maxVUs
      )
    );

    newTime = Math.round(newTime / 5) * 5;
    newVUs = Math.round(newVUs);

    const points = [...this.controlPoints()];

    let insertIdx = points.findIndex((p) => p.time > newTime);
    if (insertIdx === -1) insertIdx = points.length;

    if (insertIdx > 0 && points[insertIdx - 1].time === newTime) return;
    if (insertIdx < points.length && points[insertIdx].time === newTime) return;

    points.splice(insertIdx, 0, { time: newTime, vus: newVUs });
    this.controlPoints.set(points);
  }

  private updateControlPointsFromConfig(): void {
    const scenario = this.scenarioType();
    const vus = this.virtualUsers();
    const duration = this.totalDurationSeconds();
    const rampUp = this.rampUpDuration();
    const rampDown = this.rampDownDuration();

    let newPoints: ControlPoint[] = [];

    if (scenario === "fixed-vus") {
      newPoints = [
        { time: 0, vus: 0 },
        { time: Math.min(5, duration * 0.1), vus: vus },
        { time: duration - Math.min(5, duration * 0.1), vus: vus },
        { time: duration, vus: 0 },
      ];
    } else if (scenario === "ramping-vus") {
      const effectiveRampUp = rampUp || duration * 0.2;
      const effectiveRampDown = rampDown || duration * 0.1;
      const plateauDuration = duration - effectiveRampUp - effectiveRampDown;

      if (plateauDuration > 0) {
        newPoints = [
          { time: 0, vus: 0 },
          { time: effectiveRampUp, vus: vus },
          { time: effectiveRampUp + plateauDuration, vus: vus },
          { time: duration, vus: 0 },
        ];
      } else {
        newPoints = [
          { time: 0, vus: 0 },
          { time: duration / 2, vus: vus },
          { time: duration, vus: 0 },
        ];
      }
    } else {
      newPoints = [
        { time: 0, vus: vus },
        { time: duration, vus: vus },
      ];
    }

    this.controlPoints.set(newPoints);
  }

  private convertControlPointsForDurationUnit(
    newUnit: "seconds" | "minutes"
  ): void {
    const points = this.controlPoints();
    const currentDuration = this.duration();

    if (newUnit === "minutes") {
      // Converting from seconds to minutes
      // Current duration in the input is still in the OLD unit
      // So if duration = 300 (seconds), convert points and then set duration to 5 (minutes)
      const newDuration = currentDuration / 60;

      const convertedPoints = points.map((p) => ({
        time: p.time / 60,
        vus: p.vus,
      }));

      this.controlPoints.set(convertedPoints);
      this.duration.set(Math.round(newDuration * 10) / 10); // Round to 1 decimal
    } else {
      // Converting from minutes to seconds
      // Current duration in the input is still in the OLD unit
      // So if duration = 5 (minutes), convert points and then set duration to 300 (seconds)
      const newDuration = currentDuration * 60;

      const convertedPoints = points.map((p) => ({
        time: p.time * 60,
        vus: p.vus,
      }));

      this.controlPoints.set(convertedPoints);
      this.duration.set(Math.round(newDuration));
    }
  }

  private drawGraph(): void {
    if (!this.ctx || !this.canvasRef?.nativeElement) {
      console.warn("Canvas or context not ready for drawing");
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const ctx = this.ctx;
    const points = this.controlPoints();

    if (points.length === 0) {
      console.warn("No control points to draw");
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const chartWidth = canvas.width - this.padding.left - this.padding.right;
    const chartHeight = canvas.height - this.padding.top - this.padding.bottom;
    const maxVUs = this.maxVUs();
    const duration = this.totalDurationSeconds();

    // Draw background
    ctx.fillStyle = "rgba(30, 30, 35, 0.4)";
    ctx.fillRect(this.padding.left, this.padding.top, chartWidth, chartHeight);

    this.drawGrid(ctx, chartWidth, chartHeight, maxVUs, duration);

    if (this.showK6Phases()) {
      this.drawK6Phases(ctx, chartWidth, chartHeight, points, duration);
    }

    this.drawCurve(ctx, chartWidth, chartHeight, points, maxVUs, duration);
    this.drawAxes(ctx, chartWidth, chartHeight, maxVUs, duration);

    const previewPt = this.previewPoint();
    if (previewPt && this.hoveredPointIndex() === null) {
      this.drawPreviewPoint(
        ctx,
        previewPt,
        chartWidth,
        chartHeight,
        maxVUs,
        duration
      );
    }

    this.drawControlPoints(
      ctx,
      chartWidth,
      chartHeight,
      points,
      maxVUs,
      duration
    );

    const hoveredIdx = this.hoveredPointIndex();
    if (hoveredIdx !== null) {
      this.drawTooltip(
        ctx,
        points[hoveredIdx],
        chartWidth,
        chartHeight,
        maxVUs,
        duration
      );
    } else if (previewPt) {
      this.drawTooltip(
        ctx,
        previewPt,
        chartWidth,
        chartHeight,
        maxVUs,
        duration,
        true
      );
    }
  }

  private drawPreviewPoint(
    ctx: CanvasRenderingContext2D,
    point: ControlPoint,
    width: number,
    height: number,
    maxVUs: number,
    duration: number
  ): void {
    const x = this.padding.left + (point.time / duration) * width;
    const y = this.padding.top + height - (point.vus / maxVUs) * height;

    ctx.beginPath();
    ctx.arc(x, y, this.pointRadius + 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(100, 200, 255, 0.3)";
    ctx.fill();
    ctx.strokeStyle = "rgba(100, 200, 255, 0.6)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    maxVUs: number,
    duration: number
  ): void {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
      const y = this.padding.top + height - (i / 5) * height;
      ctx.beginPath();
      ctx.moveTo(this.padding.left, y);
      ctx.lineTo(this.padding.left + width, y);
      ctx.stroke();
    }

    const timeSteps = duration > 300 ? 6 : 5;
    for (let i = 0; i <= timeSteps; i++) {
      const x = this.padding.left + (i / timeSteps) * width;
      ctx.beginPath();
      ctx.moveTo(x, this.padding.top);
      ctx.lineTo(x, this.padding.top + height);
      ctx.stroke();
    }
  }

  private drawK6Phases(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    points: ControlPoint[],
    duration: number
  ): void {
    if (points.length < 2) return;

    const phases: {
      start: number;
      end: number;
      type: string;
      color: string;
    }[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const vusChange = next.vus - curr.vus;

      let type: string;
      let color: string;

      if (Math.abs(vusChange) < 1) {
        type = "steady";
        color = "rgba(100, 200, 255, 0.1)";
      } else if (vusChange > 0) {
        type = "ramp-up";
        color = "rgba(255, 200, 100, 0.1)";
      } else {
        type = "ramp-down";
        color = "rgba(255, 100, 100, 0.1)";
      }

      phases.push({ start: curr.time, end: next.time, type, color });
    }

    phases.forEach((phase) => {
      const startX = this.padding.left + (phase.start / duration) * width;
      const endX = this.padding.left + (phase.end / duration) * width;

      ctx.fillStyle = phase.color;
      ctx.fillRect(startX, this.padding.top, endX - startX, height);

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      const labelX = (startX + endX) / 2;
      ctx.fillText(phase.type.toUpperCase(), labelX, this.padding.top + 20);
    });
  }

  private drawCurve(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    points: ControlPoint[],
    maxVUs: number,
    duration: number
  ): void {
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(this.padding.left, this.padding.top + height);

    points.forEach((point) => {
      const x = this.padding.left + (point.time / duration) * width;
      const y = this.padding.top + height - (point.vus / maxVUs) * height;
      ctx.lineTo(x, y);
    });

    ctx.lineTo(this.padding.left + width, this.padding.top + height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(
      0,
      this.padding.top,
      0,
      this.padding.top + height
    );
    gradient.addColorStop(0, "rgba(100, 200, 255, 0.3)");
    gradient.addColorStop(1, "rgba(100, 200, 255, 0.05)");
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    points.forEach((point, i) => {
      const x = this.padding.left + (point.time / duration) * width;
      const y = this.padding.top + height - (point.vus / maxVUs) * height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.strokeStyle = "rgba(100, 200, 255, 0.9)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  private drawAxes(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    maxVUs: number,
    duration: number
  ): void {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(this.padding.left, this.padding.top + height);
    ctx.lineTo(this.padding.left + width, this.padding.top + height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.padding.left, this.padding.top);
    ctx.lineTo(this.padding.left, this.padding.top + height);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    const vusStep = Math.max(1, Math.ceil(maxVUs / 5));
    for (let i = 0; i <= 5; i++) {
      const vus = i * vusStep;
      const y = this.padding.top + height - (vus / maxVUs) * height;
      ctx.fillText(vus.toString(), this.padding.left - 10, y);
    }

    ctx.save();
    ctx.translate(20, this.padding.top + height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.font = "bold 14px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("Virtual Users (VUs)", 0, 0);
    ctx.restore();

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";

    const timeSteps = duration > 300 ? 6 : 5;
    for (let i = 0; i <= timeSteps; i++) {
      const time = (i / timeSteps) * duration;
      const x = this.padding.left + (i / timeSteps) * width;
      const label =
        this.durationUnit() === "minutes"
          ? `${Math.round(time / 60)}m`
          : `${Math.round(time)}s`;
      ctx.fillText(label, x, this.padding.top + height + 10);
    }

    ctx.textBaseline = "bottom";
    ctx.font = "bold 14px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText(
      "Time",
      this.padding.left + width / 2,
      this.canvasRef.nativeElement.height - 10
    );
  }

  private drawControlPoints(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    points: ControlPoint[],
    maxVUs: number,
    duration: number
  ): void {
    const hoveredIdx = this.hoveredPointIndex();
    const draggedIdx = this.draggedPointIndex();

    points.forEach((point, i) => {
      const x = this.padding.left + (point.time / duration) * width;
      const y = this.padding.top + height - (point.vus / maxVUs) * height;

      const isHovered = hoveredIdx === i;
      const isDragged = draggedIdx === i;

      ctx.beginPath();
      const radius =
        isHovered || isDragged ? this.pointRadius + 3 : this.pointRadius;
      ctx.arc(x, y, radius, 0, Math.PI * 2);

      if (isDragged) {
        ctx.fillStyle = "rgba(255, 100, 100, 0.9)";
        ctx.shadowColor = "rgba(255, 100, 100, 0.6)";
        ctx.shadowBlur = 12;
      } else if (isHovered) {
        ctx.fillStyle = "rgba(255, 200, 100, 0.95)";
        ctx.shadowColor = "rgba(255, 200, 100, 0.5)";
        ctx.shadowBlur = 10;
      } else {
        ctx.fillStyle = "rgba(100, 200, 255, 0.9)";
        ctx.shadowColor = "rgba(100, 200, 255, 0.3)";
        ctx.shadowBlur = 6;
      }

      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      if (isHovered || isDragged) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
        ctx.strokeStyle = isHovered
          ? "rgba(255, 200, 100, 0.4)"
          : "rgba(255, 100, 100, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
  }

  private drawTooltip(
    ctx: CanvasRenderingContext2D,
    point: ControlPoint,
    width: number,
    height: number,
    maxVUs: number,
    duration: number,
    isPreview: boolean = false
  ): void {
    const x = this.padding.left + (point.time / duration) * width;
    const y = this.padding.top + height - (point.vus / maxVUs) * height;

    let timeLabel: string;
    if (this.durationUnit() === "minutes") {
      const minutes = Math.floor(point.time);
      const seconds = Math.round((point.time - minutes) * 60);
      timeLabel = seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
    } else {
      timeLabel = `${Math.round(point.time)}s`;
    }

    const prefix = isPreview ? "Click to add: " : "";
    const text = `${prefix}${timeLabel} | ${Math.round(point.vus)} VUs`;

    ctx.font = "12px sans-serif";
    const metrics = ctx.measureText(text);
    const padding = 10;
    const tooltipWidth = metrics.width + padding * 2;
    const tooltipHeight = 26;

    let tooltipX = x - tooltipWidth / 2;
    let tooltipY = y - tooltipHeight - 18;

    if (tooltipX < this.padding.left) tooltipX = this.padding.left;
    if (tooltipX + tooltipWidth > this.padding.left + width) {
      tooltipX = this.padding.left + width - tooltipWidth;
    }
    if (tooltipY < this.padding.top) tooltipY = y + 18;

    ctx.fillStyle = isPreview
      ? "rgba(40, 40, 50, 0.92)"
      : "rgba(30, 30, 35, 0.96)";
    ctx.strokeStyle = isPreview
      ? "rgba(100, 200, 255, 0.5)"
      : "rgba(100, 200, 255, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = isPreview
      ? "rgba(255, 255, 255, 0.75)"
      : "rgba(255, 255, 255, 0.95)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = isPreview ? "11px sans-serif" : "12px sans-serif";
    ctx.fillText(
      text,
      tooltipX + tooltipWidth / 2,
      tooltipY + tooltipHeight / 2
    );
  }

  // Public methods

  isTargetUrlValid(): boolean {
    const url = this.targetUrl().trim();
    if (!url) {
      this.targetUrlError.set("");
      return false;
    }

    try {
      const urlObj = new URL(url);
      const isValid =
        urlObj.protocol === "http:" || urlObj.protocol === "https:";
      this.targetUrlError.set(
        isValid ? "" : "URL must start with http:// or https://"
      );
      return isValid;
    } catch {
      this.targetUrlError.set("Invalid URL format");
      return false;
    }
  }

  onTargetUrlChange(value: string): void {
    this.targetUrl.set(value);
    this.isTargetUrlValid();
  }

  onComponentChange(component: string): void {
    this.selectedComponent.set(component);
  }

  onTestTypeChange(testType: TestType): void {
    this.testType.set(testType);
    this.applyTestTypePreset(testType);
  }

  applyTestTypePreset(testType: TestType): void {
    switch (testType) {
      case "load":
        this.virtualUsers.set(50);
        this.duration.set(300);
        this.durationUnit.set("seconds");
        this.scenarioType.set("ramping-vus");
        this.rampUpDuration.set(60);
        this.rampDownDuration.set(30);
        break;
      case "stress":
        this.virtualUsers.set(200);
        this.duration.set(600);
        this.durationUnit.set("seconds");
        this.scenarioType.set("ramping-vus");
        this.rampUpDuration.set(180);
        this.rampDownDuration.set(60);
        break;
      case "spike":
        this.virtualUsers.set(100);
        this.duration.set(60);
        this.durationUnit.set("seconds");
        this.scenarioType.set("ramping-vus");
        this.rampUpDuration.set(5);
        this.rampDownDuration.set(5);
        break;
      case "soak":
        this.virtualUsers.set(20);
        this.duration.set(60);
        this.durationUnit.set("minutes");
        this.scenarioType.set("fixed-vus");
        this.rampUpDuration.set(0);
        this.rampDownDuration.set(0);
        break;
    }
  }

  toggleAdvancedOptions(): void {
    this.showAdvancedOptions.update((v) => !v);
  }

  toggleK6Phases(): void {
    this.showK6Phases.update((v) => !v);
  }

  deleteControlPoint(index: number): void {
    if (!this.isCustomMode()) return;
    if (this.controlPoints().length <= 2) return;

    const points = this.controlPoints().filter((_, i) => i !== index);
    this.controlPoints.set(points);
  }

  addHeader(): void {
    this.headers.update((headers) => [...headers, { key: "", value: "" }]);
  }

  removeHeader(index: number): void {
    this.headers.update((headers) => headers.filter((_, i) => i !== index));
  }

  addThreshold(): void {
    this.thresholds.update((thresholds) => [
      ...thresholds,
      { metric: "", condition: "" },
    ]);
  }

  removeThreshold(index: number): void {
    this.thresholds.update((thresholds) =>
      thresholds.filter((_, i) => i !== index)
    );
  }

  addEnvironmentVariable(): void {
    this.environmentVariables.update((envVars) => [
      ...envVars,
      { key: "", value: "" },
    ]);
  }

  removeEnvironmentVariable(index: number): void {
    this.environmentVariables.update((envVars) =>
      envVars.filter((_, i) => i !== index)
    );
  }

  updateHeaderKey(index: number, value: string): void {
    this.headers.update((headers) => {
      const updated = [...headers];
      updated[index] = { ...updated[index], key: value };
      return updated;
    });
  }

  updateHeaderValue(index: number, value: string): void {
    this.headers.update((headers) => {
      const updated = [...headers];
      updated[index] = { ...updated[index], value: value };
      return updated;
    });
  }

  updateThresholdMetric(index: number, value: string): void {
    this.thresholds.update((thresholds) => {
      const updated = [...thresholds];
      updated[index] = { ...updated[index], metric: value };
      return updated;
    });
  }

  updateThresholdCondition(index: number, value: string): void {
    this.thresholds.update((thresholds) => {
      const updated = [...thresholds];
      updated[index] = { ...updated[index], condition: value };
      return updated;
    });
  }

  updateEnvVarKey(index: number, value: string): void {
    this.environmentVariables.update((envVars) => {
      const updated = [...envVars];
      updated[index] = { ...updated[index], key: value };
      return updated;
    });
  }

  updateEnvVarValue(index: number, value: string): void {
    this.environmentVariables.update((envVars) => {
      const updated = [...envVars];
      updated[index] = { ...updated[index], value: value };
      return updated;
    });
  }

  runLoadTest(): void {
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
      headers: this.headers().filter((h) => h.key && h.value),
      thresholds: this.thresholds().filter((t) => t.metric && t.condition),
      environmentVariables: this.environmentVariables().filter(
        (e) => e.key && e.value
      ),
      controlPoints: this.controlPoints(),
    };

    this.executionStatus.set({
      status: "running",
      startTime: new Date(),
      elapsedTime: 0,
      currentVUs: 0,
      progress: 0,
      testId: `test-${Date.now()}`,
    });

    let elapsed = 0;
    const totalDuration = this.totalDurationSeconds();

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
            points[i].vus +
              (points[i + 1].vus - points[i].vus) * segmentProgress
          );
          break;
        }
      }

      this.executionStatus.update((status) => ({
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

  completeTest(): void {
    if (this.executionInterval) {
      clearInterval(this.executionInterval);
      this.executionInterval = undefined;
    }

    this.executionStatus.update((status) => ({
      ...status,
      status: "completed",
      progress: 100,
      currentVUs: this.virtualUsers(),
    }));
  }

  resetConfiguration(): void {
    this.selectedComponent.set("");
    this.targetUrl.set("");
    this.targetUrlError.set("");
    this.testType.set("load");
    this.virtualUsers.set(10);
    this.duration.set(60);
    this.durationUnit.set("seconds");
    this.previousDurationUnit = "seconds";
    this.scenarioType.set("fixed-vus");
    this.rampUpDuration.set(0);
    this.rampDownDuration.set(0);
    this.headers.set([{ key: "", value: "" }]);
    this.thresholds.set([{ metric: "", condition: "" }]);
    this.environmentVariables.set([{ key: "", value: "" }]);
    this.executionStatus.set({ status: "idle" });
    this.controlPoints.set([
      { time: 0, vus: 0 },
      { time: 60, vus: 10 },
    ]);
  }

  saveAsPreset(): void {
    console.log("Save as preset", {
      testType: this.testType(),
      controlPoints: this.controlPoints(),
      config: {
        virtualUsers: this.virtualUsers(),
        duration: this.duration(),
        scenarioType: this.scenarioType(),
      },
    });
  }

  viewResults(): void {
    const testId = this.executionStatus().testId;
    if (testId) {
      console.log("View results for:", testId);
      this.showResultsIframe.set(true);
    }
  }

  closeResultsIframe(): void {
    this.showResultsIframe.set(false);
  }

  getResultsUrl(): SafeResourceUrl {
    const testId = this.executionStatus().testId;
    // TODO: Replace with actual results dashboard URL
    const url = `https://grafana.example.com/d/load-test?testId=${testId}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getElapsedTimeFormatted(): string {
    const elapsed = this.executionStatus().elapsedTime || 0;
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  getDurationInSeconds(): number {
    return this.totalDurationSeconds();
  }

  getProgressPercentage(): number {
    return Math.round(this.executionStatus().progress || 0);
  }

  formatControlPointTime(time: number): string {
    if (this.durationUnit() === "minutes") {
      const minutes = Math.floor(time);
      const seconds = Math.round((time - minutes) * 60);
      return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
    } else {
      return `${Math.round(time)}s`;
    }
  }

  ngOnDestroy(): void {
    if (this.executionInterval) {
      clearInterval(this.executionInterval);
    }
  }
}
