// services/test-selection-manager.service.ts
import { Injectable, computed } from '@angular/core';
import { ComponentDataService } from './component-data.service';

@Injectable({
  providedIn: 'root'
})
export class TestSelectionManagerService {
  
  constructor(private componentDataService: ComponentDataService) {}

  // Computed selection counts
  readonly selectedPresetsCount = computed(() => {
    return this.componentDataService.presets().filter(p => p.selected).length;
  });

  readonly selectedCustomsCount = computed(() => {
    return this.componentDataService
      .customs()
      .filter(c => c.selected || c.tests.some(t => t.selected)).length;
  });

  readonly selectedTestsCount = computed(() => {
    return this.componentDataService.getSelectedTestTags().length;
  });

  readonly hasSelectedTests = computed(() => {
    return this.componentDataService.hasSelectedTests();
  });

  readonly hasSelectedPresets = computed(() => {
    return this.selectedPresetsCount() > 0;
  });

  readonly hasSelectedCustoms = computed(() => {
    return this.selectedCustomsCount() > 0;
  });

  readonly selectedTestTags = computed(() => {
    return this.componentDataService.getSelectedTestTags();
  });

  // Clear operations
  clearAllPresets(): number {
    let clearedCount = 0;
    this.componentDataService.allComponents().forEach(component => {
      if (component.isPreset && component.selected) {
        this.componentDataService.togglePresetSelection(component.componentName);
        clearedCount++;
      }
    });
    return clearedCount;
  }

  clearAllCustoms(): number {
    let clearedCount = 0;
    this.componentDataService.allComponents().forEach(component => {
      if (!component.isPreset && (component.selected || component.tests.some(t => t.selected))) {
        if (component.selected) {
          this.componentDataService.toggleCustomSelection(component.componentName);
          clearedCount++;
        } else {
          component.tests.forEach((test, index) => {
            if (test.selected) {
              this.componentDataService.toggleTestSelection(component.componentName, index);
              clearedCount++;
            }
          });
        }
      }
    });
    return clearedCount;
  }

  // Calculate pods needed for execution
  calculateRequiredPods(): number {
    let count = 0;
    this.componentDataService.customs().forEach(card => {
      if (card.selected || card.tests.some(t => t.selected)) {
        count++;
      }
    });
    return count > 0 ? count : 1;
  }
}