// services/test-runner.service.ts
import { Injectable, signal } from '@angular/core';

export interface TestRunRequest {
  automationUrl: string;
  testags: string;
  automationBranch: string;
  runId: string;
  podCount: number;
}

export interface TestRunResult {
  success: boolean;
  runId: string;
  testCount: number;
  error?: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class TestRunnerService {
  private readonly API_URL = 'https://example.com/run';
  
  private readonly _lastRunId = signal<string | null>(null);
  private readonly _isRunning = signal(false);
  private readonly _showRunId = signal(false);

  readonly lastRunId = this._lastRunId.asReadonly();
  readonly isRunning = this._isRunning.asReadonly();
  readonly showRunId = this._showRunId.asReadonly();

  async executeTests(request: TestRunRequest): Promise<TestRunResult> {
    this._isRunning.set(true);
    this._lastRunId.set(request.runId);
    this._showRunId.set(true);

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('POST sent successfully:', data);

      return {
        success: true,
        runId: request.runId,
        testCount: request.testags.split('|').length,
        data
      };

    } catch (error: any) {
      console.error('Error sending POST:', error);
      return {
        success: false,
        runId: request.runId,
        testCount: request.testags.split('|').length,
        error: error.message
      };
    } finally {
      this._isRunning.set(false);
    }
  }

  generateRunId(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let uuid = '';
    for (let i = 0; i < length; i++) {
      uuid += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return uuid;
  }

  async copyRunIdToClipboard(): Promise<boolean> {
    const runId = this._lastRunId();
    if (!runId) return false;

    try {
      await navigator.clipboard.writeText(runId);
      return true;
    } catch (error) {
      console.error('Failed to copy run ID:', error);
      return false;
    }
  }

  reset(): void {
    this._lastRunId.set(null);
    this._isRunning.set(false);
    this._showRunId.set(false);
  }
}