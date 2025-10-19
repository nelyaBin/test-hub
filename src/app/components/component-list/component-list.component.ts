// components/component-list/component-list.component.ts
import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";

// Components
import { TestConfigurationComponent } from "../test-configuration/test-configuration.component";
import { TestSectionComponent } from "../test-section/test-section.component";
import { TestSummaryComponent } from "../test-summary/test-summary.component";
import { TestRunnerComponent } from "../test-runner/test-runner.component";
import { ToastComponent } from "../toast/toast.component";

// Services
import { TestConfigurationManagerService } from "../../services/test-configuration-manager.service";
import { TestSelectionManagerService } from "../../services/test-selection-manager.service";
import { TestExpansionManagerService } from "../../services/test-expansion-manager.service";
import { TestRunnerService, TestRunRequest } from "../../services/test-runner.service";
import { ToastManagerService } from "../../services/toast-manager.service";
import { TestFilteringManagerService } from "../../services/test-filtering-manager.service";
import { UiStateManagerService } from "../../services/ui-state-manager.service";

@Component({
  selector: "app-component-list",
  templateUrl: "./component-list.component.html",
  styleUrls: ["./component-list.component.scss"],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    TestConfigurationComponent,
    TestSectionComponent,
    TestSummaryComponent,
    TestRunnerComponent,
    ToastComponent
  ],
})
export class ComponentListComponent {

  // Inject services using inject() function
  private readonly configurationManager = inject(TestConfigurationManagerService);
  private readonly selectionManager = inject(TestSelectionManagerService);
  private readonly expansionManager = inject(TestExpansionManagerService);
  private readonly runnerService = inject(TestRunnerService);
  private readonly toastManager = inject(ToastManagerService);
  private readonly filteringManager = inject(TestFilteringManagerService);
  private readonly uiStateManager = inject(UiStateManagerService);

  // Expose computed signals from managers
  readonly searchTerm = this.configurationManager.searchTerm;
  readonly atlasUrl = this.configurationManager.atlasUrl;
  readonly automationBranch = this.configurationManager.automationBranch;
  
  readonly filteredPresets = this.filteringManager.filteredPresets;
  readonly filteredCustoms = this.filteringManager.filteredCustoms;
  
  readonly hasSelectedTests = this.selectionManager.hasSelectedTests;
  readonly selectedPresetsCount = this.selectionManager.selectedPresetsCount;
  readonly selectedCustomsCount = this.selectionManager.selectedCustomsCount;
  readonly selectedTestsCount = this.selectionManager.selectedTestsCount;
  readonly hasSelectedPresets = this.selectionManager.hasSelectedPresets;
  readonly hasSelectedCustoms = this.selectionManager.hasSelectedCustoms;
  readonly selectedTestTags = this.selectionManager.selectedTestTags;
  
  readonly showSummaryDetails = this.uiStateManager.showSummaryDetails;
  
  readonly lastRunId = this.runnerService.lastRunId;
  readonly showRunId = this.runnerService.showRunId;
  readonly isRunning = this.runnerService.isRunning;
  
  readonly currentToast = this.toastManager.currentToast;

  // Configuration handlers
  onSearchTermChange(value: string): void {
    this.configurationManager.updateSearchTerm(value);
  }

  onAtlasUrlChange(value: string): void {
    this.configurationManager.updateAtlasUrl(value);
  }

  onAutomationBranchChange(value: string): void {
    this.configurationManager.updateAutomationBranch(value);
  }

  // Section handlers
  onClearAllPresets(): void {
    const clearedCount = this.selectionManager.clearAllPresets();
    this.toastManager.showSelectionCleared('preset', clearedCount);
  }

  onClearAllCustoms(): void {
    const clearedCount = this.selectionManager.clearAllCustoms();
    this.toastManager.showSelectionCleared('custom', clearedCount);
  }

  onExpandAll(): void {
    const result = this.expansionManager.toggleExpandAll();
    this.toastManager.showExpansionToggled(result.newState, result.affectedCount);
  }

  // Summary handlers
  onToggleSummaryDetails(): void {
    this.uiStateManager.toggleSummaryDetails();
  }

  // Runner handlers
  async onRunTests(): Promise<void> {
    if (!this.hasSelectedTests()) {
      this.toastManager.showNoTestsSelected();
      return;
    }

    const runId = this.runnerService.generateRunId(10);
    const selectedTestTags = this.selectedTestTags();
    const testTagsString = selectedTestTags.map(tag => `@${tag}`).join('|');
    const podCount = this.selectionManager.calculateRequiredPods();

    const request: TestRunRequest = {
      automationUrl: this.configurationManager.getAtlasUrlOrDefault(),
      testags: testTagsString,
      automationBranch: this.configurationManager.getAutomationBranchOrDefault(),
      runId,
      podCount
    };

    this.toastManager.showSuccess('Starting automation...');

    const result = await this.runnerService.executeTests(request);

    if (result.success) {
      this.toastManager.showRunStarted(result.testCount);
    } else {
      this.toastManager.showRunFailed(result.error || 'Unknown error');
    }
  }

  async onCopyRunId(): Promise<void> {
    const success = await this.runnerService.copyRunIdToClipboard();
    if (success) {
      this.toastManager.showRunIdCopied();
    } else {
      this.toastManager.showError('Failed to copy Run ID');
    }
  }
}