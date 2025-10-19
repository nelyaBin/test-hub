// services/toast-manager.service.ts
import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error';

export interface ToastMessage {
  message: string;
  type: ToastType;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastManagerService {
  private readonly DEFAULT_DURATION = 3000; // 3 seconds
  
  private readonly _currentToast = signal<ToastMessage | null>(null);
  private toastTimeout: number | null = null;

  readonly currentToast = this._currentToast.asReadonly();

  showSuccess(message: string, duration: number = this.DEFAULT_DURATION): void {
    this.showToast(message, 'success', duration);
  }

  showError(message: string, duration: number = this.DEFAULT_DURATION): void {
    this.showToast(message, 'error', duration);
  }

  private showToast(message: string, type: ToastType, duration: number): void {
    // Clear existing timeout
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    // Set new toast
    this._currentToast.set({
      message,
      type,
      timestamp: Date.now()
    });

    // Auto-hide after duration
    this.toastTimeout = window.setTimeout(() => {
      this.hideToast();
    }, duration);
  }

  hideToast(): void {
    this._currentToast.set(null);
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
  }

  // Helper methods for common messages
  showSelectionCleared(itemType: string, count: number): void {
    this.showSuccess(`${count} ${itemType} selections cleared`);
  }

  showExpansionToggled(expanded: boolean, count: number): void {
    const action = expanded ? 'expanded' : 'collapsed';
    this.showSuccess(`${count} components ${action}`);
  }

  showRunStarted(testCount: number): void {
    this.showSuccess(`Automation started successfully! ${testCount} tests running.`);
  }

  showRunFailed(error: string): void {
    this.showError(`Failed to start automation: ${error}`);
  }

  showRunIdCopied(): void {
    this.showSuccess('Run ID copied to clipboard!');
  }

  showNoTestsSelected(): void {
    this.showError('Please select at least one test to run');
  }
}