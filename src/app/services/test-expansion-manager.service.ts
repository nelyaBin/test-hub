// services/test-expansion-manager.service.ts
import { Injectable, signal } from '@angular/core';
import { ComponentDataService } from './component-data.service';

@Injectable({
  providedIn: 'root'
})
export class TestExpansionManagerService {
  private readonly _allExpanded = signal(false);
  
  readonly allExpanded = this._allExpanded.asReadonly();

  constructor(private componentDataService: ComponentDataService) {}

  toggleExpandAll(): { newState: boolean; affectedCount: number } {
    const newExpandState = !this._allExpanded();
    this._allExpanded.set(newExpandState);

    let affectedCount = 0;
    
    this.componentDataService.allComponents().forEach(component => {
      if (!component.isPreset && component.tests.length > 0) {
        if (component.isExpanded !== newExpandState) {
          this.componentDataService.toggleExpansion(component.componentName);
          affectedCount++;
        }
      }
    });

    return {
      newState: newExpandState,
      affectedCount
    };
  }

  reset(): void {
    this._allExpanded.set(false);
  }
}