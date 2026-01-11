// src/app/services/control-points-calculator.service.ts
import { Injectable } from '@angular/core';
import { ControlPoint, ScenarioType } from '../models/load-test.models';

@Injectable({
  providedIn: 'root'
})
export class ControlPointsCalculatorService {
  
  calculateControlPoints(
    scenario: ScenarioType,
    vus: number,
    duration: number,
    rampUp: number,
    rampDown: number
  ): ControlPoint[] {
    if (scenario === 'fixed-vus') {
      return this.calculateFixedVUs(vus, duration);
    } else if (scenario === 'ramping-vus') {
      return this.calculateRampingVUs(vus, duration, rampUp, rampDown);
    } else {
      return this.calculateConstantArrival(vus, duration);
    }
  }

  private calculateFixedVUs(vus: number, duration: number): ControlPoint[] {
    const rampTime = Math.min(duration * 0.1, 1);
    return [
      { time: 0, vus: 0 },
      { time: rampTime, vus: vus },
      { time: duration - rampTime, vus: vus },
      { time: duration, vus: 0 },
    ];
  }

  private calculateRampingVUs(
    vus: number,
    duration: number,
    rampUp: number,
    rampDown: number
  ): ControlPoint[] {
    const effectiveRampUp = rampUp || duration * 0.2;
    const effectiveRampDown = rampDown || duration * 0.1;
    const plateauDuration = duration - effectiveRampUp - effectiveRampDown;

    if (plateauDuration > 0) {
      return [
        { time: 0, vus: 0 },
        { time: effectiveRampUp, vus: vus },
        { time: effectiveRampUp + plateauDuration, vus: vus },
        { time: duration, vus: 0 },
      ];
    } else {
      return [
        { time: 0, vus: 0 },
        { time: duration / 2, vus: vus },
        { time: duration, vus: 0 },
      ];
    }
  }

  private calculateConstantArrival(vus: number, duration: number): ControlPoint[] {
    return [
      { time: 0, vus: vus },
      { time: duration, vus: vus },
    ];
  }

  adjustPointsForNewDuration(
    currentPoints: ControlPoint[],
    newDuration: number
  ): ControlPoint[] {
    if (currentPoints.length === 0) return [];

    const oldDuration = currentPoints[currentPoints.length - 1].time;
    
    if (Math.abs(oldDuration - newDuration) < 0.01) {
      return currentPoints;
    }

    const ratio = newDuration / oldDuration;

    return currentPoints.map((point, index) => {
      if (index === 0) {
        return { ...point, time: 0 };
      }
      if (index === currentPoints.length - 1) {
        return { ...point, time: newDuration };
      }
      return {
        ...point,
        time: point.time * ratio,
      };
    });
  }

  normalizeToEnd(points: ControlPoint[], duration: number): ControlPoint[] {
    if (points.length === 0) return [];

    const filtered = points.filter(
      (p, i) => i === points.length - 1 || p.time <= duration
    );

    const lastIdx = filtered.length - 1;
    filtered[lastIdx] = {
      ...filtered[lastIdx],
      time: duration,
    };

    return filtered;
  }
}