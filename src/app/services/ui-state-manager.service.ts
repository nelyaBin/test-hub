// services/ui-state-manager.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiStateManagerService {
  private readonly _showSummaryDetails = signal(false);

  readonly showSummaryDetails = this._showSummaryDetails.asReadonly();

  toggleSummaryDetails(): boolean {
    const newState = !this._showSummaryDetails();
    this._showSummaryDetails.set(newState);
    return newState;
  }

  setSummaryDetailsVisibility(visible: boolean): void {
    this._showSummaryDetails.set(visible);
  }

  reset(): void {
    this._showSummaryDetails.set(false);
  }
}