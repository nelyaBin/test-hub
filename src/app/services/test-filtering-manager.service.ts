// services/test-filtering-manager.service.ts
import { Injectable, computed } from '@angular/core';
import { ComponentData } from '../models/component-data.model';
import { ComponentDataService } from './component-data.service';
import { TestConfigurationManagerService } from './test-configuration-manager.service';

@Injectable({
  providedIn: 'root'
})
export class TestFilteringManagerService {
  
  constructor(
    private componentDataService: ComponentDataService,
    private configurationManager: TestConfigurationManagerService
  ) {}

  // Computed filtered data
  readonly filteredPresets = computed(() => {
    const searchTerm = this.configurationManager.searchTerm().toLowerCase();
    return this.componentDataService
      .presets()
      .filter(component => this.matchesSearchTerm(component, searchTerm));
  });

  readonly filteredCustoms = computed(() => {
    const searchTerm = this.configurationManager.searchTerm().toLowerCase();
    return this.componentDataService
      .customs()
      .filter(component => this.matchesSearchTerm(component, searchTerm));
  });

  private matchesSearchTerm(component: ComponentData, searchTerm: string): boolean {
    if (!searchTerm) return true;
    
    return component.componentName.toLowerCase().includes(searchTerm);
  }

  // Helper methods for search statistics
  getFilteredPresetsCount(): number {
    return this.filteredPresets().length;
  }

  getFilteredCustomsCount(): number {
    return this.filteredCustoms().length;
  }

  getTotalFilteredCount(): number {
    return this.getFilteredPresetsCount() + this.getFilteredCustomsCount();
  }

  hasFilteredResults(): boolean {
    return this.getTotalFilteredCount() > 0;
  }
}