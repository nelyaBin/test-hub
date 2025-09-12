// services/test-configuration-manager.service.ts
import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TestConfigurationManagerService {
  // Configuration signals
  private readonly _searchTerm = signal('');
  private readonly _atlasUrl = signal('');
  private readonly _automationBranch = signal('');

  // Readonly accessors
  readonly searchTerm = this._searchTerm.asReadonly();
  readonly atlasUrl = this._atlasUrl.asReadonly();
  readonly automationBranch = this._automationBranch.asReadonly();

  // Computed configuration object
  readonly configuration = computed(() => ({
    searchTerm: this._searchTerm(),
    atlasUrl: this._atlasUrl(),
    automationBranch: this._automationBranch()
  }));

  updateSearchTerm(value: string): void {
    this._searchTerm.set(value);
  }

  updateAtlasUrl(value: string): void {
    this._atlasUrl.set(value);
  }

  updateAutomationBranch(value: string): void {
    this._automationBranch.set(value);
  }

  getAtlasUrlOrDefault(): string {
    return this._atlasUrl() || 'noderprod';
  }

  getAutomationBranchOrDefault(): string {
    return this._automationBranch() || 'main';
  }

  reset(): void {
    this._searchTerm.set('');
    this._atlasUrl.set('');
    this._automationBranch.set('');
  }
}