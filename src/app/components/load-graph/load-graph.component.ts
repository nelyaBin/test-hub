// src/app/components/load-graph/load-graph.component.ts
import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  input,
  signal,
  output,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlPoint } from '../../models/load-test.models';

@Component({
  selector: 'app-load-graph',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './load-graph.component.html',
  styleUrls: ['./load-graph.component.scss']
})
export class LoadGraphComponent implements AfterViewInit, OnDestroy {
  @ViewChild('graphCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  // Inputs
  readonly controlPoints = input.required<ControlPoint[]>();
  readonly maxVUs = input.required<number>();
  readonly totalDuration = input.required<number>();
  readonly isEditMode = input.required<boolean>();
  readonly showK6Phases = input.required<boolean>();
  readonly durationUnit = input.required<'minutes' | 'hours'>();

  // Outputs
  readonly pointAdded = output<ControlPoint>();
  readonly pointUpdated = output<{ index: number; point: ControlPoint }>();
  readonly pointDeleted = output<number>();

  // Internal state
  private ctx: CanvasRenderingContext2D | null = null;
  private readonly padding = { top: 40, right: 40, bottom: 60, left: 60 };
  private readonly pointRadius = 7;
  private readonly hitRadius = 20;

  readonly draggedPointIndex = signal<number | null>(null);
  readonly hoveredPointIndex = signal<number | null>(null);
  readonly hoverPosition = signal<{ x: number; y: number } | null>(null);
  readonly previewPoint = signal<ControlPoint | null>(null);
  private wasDragging = false;

  constructor() {
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
    setTimeout(() => {
      this.initializeCanvas();
      this.setupCanvasListeners();
      setTimeout(() => this.drawGraph(), 100);
    }, 0);
  }

  ngOnDestroy(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
      canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
      canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
      canvas.removeEventListener('mouseleave', this.handleMouseLeave.bind(this));
      canvas.removeEventListener('click', this.handleClick.bind(this));
      canvas.removeEventListener('contextmenu', this.handleRightClick.bind(this));
    }
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

    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);

    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  private setupCanvasListeners(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    canvas.addEventListener('click', this.handleClick.bind(this));
    canvas.addEventListener('contextmenu', this.handleRightClick.bind(this));
  }

  private handleMouseMove(e: MouseEvent): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.hoverPosition.set({ x, y });

    const draggedIdx = this.draggedPointIndex();
    const isEditMode = this.isEditMode();

    if (draggedIdx !== null && isEditMode) {
      this.wasDragging = true;
      this.updatePointPosition(draggedIdx, x, y);
      canvas.style.cursor = 'grabbing';
      return;
    }

    const hoveredIdx = this.findPointAtPosition(x, y);
    this.hoveredPointIndex.set(hoveredIdx);

    if (hoveredIdx !== null && isEditMode) {
      canvas.style.cursor = 'grab';
      this.previewPoint.set(null);
    } else if (isEditMode) {
      canvas.style.cursor = 'crosshair';
      this.previewPoint.set(this.getPreviewPoint(x, y));
    } else {
      canvas.style.cursor = 'default';
      this.previewPoint.set(null);
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    if (!this.isEditMode()) return;

    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const pointIdx = this.findPointAtPosition(x, y);
    if (pointIdx !== null) {
      this.draggedPointIndex.set(pointIdx);
      this.wasDragging = false;
      canvas.style.cursor = 'grabbing';
      this.previewPoint.set(null);
    }
  }

  private handleMouseUp(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      const hoveredIdx = this.hoveredPointIndex();
      canvas.style.cursor = hoveredIdx !== null ? 'grab' : 'crosshair';
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
    if (!this.isEditMode() || this.wasDragging) return;

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
    if (!this.isEditMode()) return;

    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const pointIdx = this.findPointAtPosition(x, y);
    if (pointIdx !== null) {
      this.pointDeleted.emit(pointIdx);
    }
  }

  private findPointAtPosition(x: number, y: number): number | null {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return null;

    const points = this.controlPoints();
    const chartWidth = canvas.width - this.padding.left - this.padding.right;
    const chartHeight = canvas.height - this.padding.top - this.padding.bottom;
    const maxVUs = this.maxVUs();
    const duration = this.totalDuration();

    let closestIdx: number | null = null;
    let closestDistance = this.hitRadius;

    for (let i = 0; i < points.length; i++) {
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
    if (!this.isEditMode()) return null;

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
    const duration = this.totalDuration();

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

    const timeStep = duration > 60 ? 5 : duration > 10 ? 1 : 0.2;
    newTime = Math.round(newTime / timeStep) * timeStep;
    newVUs = Math.round(newVUs);

    return { time: newTime, vus: newVUs };
  }

  private updatePointPosition(index: number, x: number, y: number): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const chartWidth = canvas.width - this.padding.left - this.padding.right;
    const chartHeight = canvas.height - this.padding.top - this.padding.bottom;
    const maxVUs = this.maxVUs();
    const duration = this.totalDuration();
    const points = this.controlPoints();

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

    const timeStep = duration > 60 ? 5 : duration > 10 ? 1 : 0.2;
    newTime = Math.round(newTime / timeStep) * timeStep;
    newVUs = Math.round(newVUs);

    if (index === 0) newTime = 0;
    if (index === points.length - 1) newTime = duration;
    if (index > 0 && index < points.length - 1) {
      const minGap = timeStep;
      if (newTime <= points[index - 1].time)
        newTime = points[index - 1].time + minGap;
      if (newTime >= points[index + 1].time)
        newTime = points[index + 1].time - minGap;
    }

    this.pointUpdated.emit({ index, point: { time: newTime, vus: newVUs } });
  }

  private addPointAtPosition(x: number, y: number): void {
    if (!this.isEditMode()) return;

    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const chartWidth = canvas.width - this.padding.left - this.padding.right;
    const chartHeight = canvas.height - this.padding.top - this.padding.bottom;
    const maxVUs = this.maxVUs();
    const duration = this.totalDuration();
    const timeStep = duration > 60 ? 5 : duration > 10 ? 1 : 0.2;

    let newTime =
      Math.round(
        Math.max(
          0,
          Math.min(duration, ((x - this.padding.left) / chartWidth) * duration)
        ) / timeStep
      ) * timeStep;

    let newVUs = Math.round(
      Math.max(
        0,
        Math.min(
          maxVUs,
          ((this.padding.top + chartHeight - y) / chartHeight) * maxVUs
        )
      )
    );

    this.pointAdded.emit({ time: newTime, vus: newVUs });
  }

  private drawGraph(): void {
    if (!this.ctx || !this.canvasRef?.nativeElement) return;

    const canvas = this.canvasRef.nativeElement;
    const ctx = this.ctx;
    const points = this.controlPoints();

    if (points.length === 0) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const chartWidth = canvas.width - this.padding.left - this.padding.right;
    const chartHeight = canvas.height - this.padding.top - this.padding.bottom;
    const maxVUs = this.maxVUs();
    const duration = this.totalDuration();

    ctx.fillStyle = 'rgba(30, 30, 35, 0.4)';
    ctx.fillRect(this.padding.left, this.padding.top, chartWidth, chartHeight);

    this.drawGrid(ctx, chartWidth, chartHeight, maxVUs, duration);

    if (this.showK6Phases()) {
      this.drawK6Phases(ctx, chartWidth, chartHeight, points, duration);
    }

    this.drawCurve(ctx, chartWidth, chartHeight, points, maxVUs, duration);
    this.drawAxes(ctx, chartWidth, chartHeight, maxVUs, duration);

    const previewPt = this.previewPoint();
    if (previewPt && this.hoveredPointIndex() === null) {
      this.drawPreviewPoint(ctx, previewPt, chartWidth, chartHeight, maxVUs, duration);
    }

    this.drawControlPoints(ctx, chartWidth, chartHeight, points, maxVUs, duration);

    const hoveredIdx = this.hoveredPointIndex();
    if (hoveredIdx !== null) {
      this.drawTooltip(ctx, points[hoveredIdx], chartWidth, chartHeight, maxVUs, duration);
    } else if (previewPt) {
      this.drawTooltip(ctx, previewPt, chartWidth, chartHeight, maxVUs, duration, true);
    }
  }

  private drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, maxVUs: number, duration: number): void {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
      const y = this.padding.top + height - (i / 5) * height;
      ctx.beginPath();
      ctx.moveTo(this.padding.left, y);
      ctx.lineTo(this.padding.left + width, y);
      ctx.stroke();
    }

    const timeSteps = duration > 60 ? 8 : 6;
    for (let i = 0; i <= timeSteps; i++) {
      const x = this.padding.left + (i / timeSteps) * width;
      ctx.beginPath();
      ctx.moveTo(x, this.padding.top);
      ctx.lineTo(x, this.padding.top + height);
      ctx.stroke();
    }
  }

  private drawK6Phases(ctx: CanvasRenderingContext2D, width: number, height: number, points: ControlPoint[], duration: number): void {
    if (points.length < 2) return;

    const phases: { start: number; end: number; type: string; color: string }[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const vusChange = next.vus - curr.vus;

      let type: string;
      let color: string;

      if (Math.abs(vusChange) < 1) {
        type = 'steady';
        color = 'rgba(100, 200, 255, 0.1)';
      } else if (vusChange > 0) {
        type = 'ramp-up';
        color = 'rgba(255, 200, 100, 0.1)';
      } else {
        type = 'ramp-down';
        color = 'rgba(255, 100, 100, 0.1)';
      }

      phases.push({ start: curr.time, end: next.time, type, color });
    }

    phases.forEach((phase) => {
      const startX = this.padding.left + (phase.start / duration) * width;
      const endX = this.padding.left + (phase.end / duration) * width;

      ctx.fillStyle = phase.color;
      ctx.fillRect(startX, this.padding.top, endX - startX, height);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      const labelX = (startX + endX) / 2;
      ctx.fillText(phase.type.toUpperCase(), labelX, this.padding.top + 20);
    });
  }

  private drawCurve(ctx: CanvasRenderingContext2D, width: number, height: number, points: ControlPoint[], maxVUs: number, duration: number): void {
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

    const gradient = ctx.createLinearGradient(0, this.padding.top, 0, this.padding.top + height);
    gradient.addColorStop(0, 'rgba(100, 200, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(100, 200, 255, 0.05)');
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

    ctx.strokeStyle = 'rgba(100, 200, 255, 0.9)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  private drawAxes(ctx: CanvasRenderingContext2D, width: number, height: number, maxVUs: number, duration: number): void {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(this.padding.left, this.padding.top + height);
    ctx.lineTo(this.padding.left + width, this.padding.top + height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.padding.left, this.padding.top);
    ctx.lineTo(this.padding.left, this.padding.top + height);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const vusStep = Math.max(1, Math.ceil(maxVUs / 5));
    for (let i = 0; i <= 5; i++) {
      const vus = i * vusStep;
      const y = this.padding.top + height - (vus / maxVUs) * height;
      ctx.fillText(vus.toString(), this.padding.left - 10, y);
    }

    ctx.save();
    ctx.translate(20, this.padding.top + height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('Virtual Users (VUs)', 0, 0);
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '12px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';

    const timeSteps = duration > 60 ? 8 : 6;
    for (let i = 0; i <= timeSteps; i++) {
      const time = (i / timeSteps) * duration;
      const x = this.padding.left + (i / timeSteps) * width;
      const label = this.formatTimeLabel(time);
      ctx.fillText(label, x, this.padding.top + height + 10);
    }

    ctx.textBaseline = 'bottom';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('Time', this.padding.left + width / 2, this.canvasRef.nativeElement.height - 10);
  }

  private drawControlPoints(ctx: CanvasRenderingContext2D, width: number, height: number, points: ControlPoint[], maxVUs: number, duration: number): void {
    const hoveredIdx = this.hoveredPointIndex();
    const draggedIdx = this.draggedPointIndex();

    points.forEach((point, i) => {
      const x = this.padding.left + (point.time / duration) * width;
      const y = this.padding.top + height - (point.vus / maxVUs) * height;

      const isHovered = hoveredIdx === i;
      const isDragged = draggedIdx === i;

      ctx.beginPath();
      const radius = isHovered || isDragged ? this.pointRadius + 3 : this.pointRadius;
      ctx.arc(x, y, radius, 0, Math.PI * 2);

      if (isDragged) {
        ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
        ctx.shadowColor = 'rgba(255, 100, 100, 0.6)';
        ctx.shadowBlur = 12;
      } else if (isHovered) {
        ctx.fillStyle = 'rgba(255, 200, 100, 0.95)';
        ctx.shadowColor = 'rgba(255, 200, 100, 0.5)';
        ctx.shadowBlur = 10;
      } else {
        ctx.fillStyle = 'rgba(100, 200, 255, 0.9)';
        ctx.shadowColor = 'rgba(100, 200, 255, 0.3)';
        ctx.shadowBlur = 6;
      }

      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      if (isHovered || isDragged) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
        ctx.strokeStyle = isHovered ? 'rgba(255, 200, 100, 0.4)' : 'rgba(255, 100, 100, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
  }

  private drawPreviewPoint(ctx: CanvasRenderingContext2D, point: ControlPoint, width: number, height: number, maxVUs: number, duration: number): void {
    const x = this.padding.left + (point.time / duration) * width;
    const y = this.padding.top + height - (point.vus / maxVUs) * height;

    ctx.beginPath();
    ctx.arc(x, y, this.pointRadius + 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawTooltip(ctx: CanvasRenderingContext2D, point: ControlPoint, width: number, height: number, maxVUs: number, duration: number, isPreview: boolean = false): void {
    const x = this.padding.left + (point.time / duration) * width;
    const y = this.padding.top + height - (point.vus / maxVUs) * height;

    const timeLabel = this.formatTimeLabel(point.time);
    const prefix = isPreview ? 'Click to add: ' : '';
    const text = `${prefix}${timeLabel} | ${Math.round(point.vus)} VUs`;

    ctx.font = '12px sans-serif';
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

    ctx.fillStyle = isPreview ? 'rgba(40, 40, 50, 0.92)' : 'rgba(30, 30, 35, 0.96)';
    ctx.strokeStyle = isPreview ? 'rgba(100, 200, 255, 0.5)' : 'rgba(100, 200, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = isPreview ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.95)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = isPreview ? '11px sans-serif' : '12px sans-serif';
    ctx.fillText(text, tooltipX + tooltipWidth / 2, tooltipY + tooltipHeight / 2);
  }

  private formatTimeLabel(timeInMinutes: number): string {
    const unit = this.durationUnit();

    if (unit === 'hours') {
      const hours = Math.floor(timeInMinutes / 60);
      const minutes = Math.round(timeInMinutes % 60);
      if (minutes === 0) return `${hours}h`;
      return `${hours}h ${minutes}m`;
    } else {
      return `${Math.round(timeInMinutes)}m`;
    }
  }
}