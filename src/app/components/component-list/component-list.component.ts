// components/component-list/component-list.component.ts
import { CommonModule } from "@angular/common";
import { Component, OnInit, computed, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ComponentData } from "../../models/component-data.model";
import { ComponentDataService } from "../../services/component-data.service";
import { TestConfigurationComponent } from "../test-configuration/test-configuration.component";
import { TestSectionComponent } from "../test-section/test-section.component";
import { TestSummaryComponent } from "../test-summary/test-summary.component";
import { TestRunnerComponent, RunConfiguration } from "../test-runner/test-runner.component";
import { ToastComponent, ToastType } from "../toast/toast.component";

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
export class ComponentListComponent implements OnInit {
  // Configuration signals
  searchTerm = signal("");
  atlasUrl = signal("");
  automationBranch = signal("");
  
  // UI state signals
  toastMessage = signal<string | null>(null);
  toastType = signal<ToastType>("success");
  lastRunId = signal<string | null>(null);
  showSummaryDetails = signal(false);
  allExpanded = signal(false);
  showRunId = signal(false);
  isRunning = signal(false);

  // Computed signals for filtered data
  readonly filteredPresets = computed(() =>
    this.dataService
      .presets()
      .filter((c) =>
        c.componentName.toLowerCase().includes(this.searchTerm().toLowerCase())
      )
  );

  readonly filteredCustoms = computed(() =>
    this.dataService
      .customs()
      .filter((c) =>
        c.componentName.toLowerCase().includes(this.searchTerm().toLowerCase())
      )
  );

  // Selection computed signals
  readonly hasSelectedTests = computed(() => {
    return this.dataService.hasSelectedTests();
  });

  readonly selectedPresetsCount = computed(() => {
    return this.dataService.presets().filter((p) => p.selected).length;
  });

  readonly selectedCustomsCount = computed(() => {
    return this.dataService
      .customs()
      .filter((c) => c.selected || c.tests.some((t) => t.selected)).length;
  });

  readonly selectedTestsCount = computed(() => {
    return this.dataService.getSelectedTestTags().length;
  });

  readonly hasSelectedPresets = computed(() => {
    return this.selectedPresetsCount() > 0;
  });

  readonly hasSelectedCustoms = computed(() => {
    return this.selectedCustomsCount() > 0;
  });

  readonly selectedTestTags = computed(() => {
    return this.dataService.getSelectedTestTags();
  });

  constructor(private dataService: ComponentDataService) {}

  ngOnInit() {
    // הנתונים כבר נטענים באופן אוטומטי בשירות
  }

  // Configuration handlers
  onSearchTermChange(value: string) {
    this.searchTerm.set(value);
  }

  onAtlasUrlChange(value: string) {
    this.atlasUrl.set(value);
  }

  onAutomationBranchChange(value: string) {
    this.automationBranch.set(value);
  }

  // Section handlers
  onClearAllPresets() {
    this.dataService.allComponents().forEach((component) => {
      if (component.isPreset && component.selected) {
        this.dataService.togglePresetSelection(component.componentName);
      }
    });
    this.showToast("All presets cleared", "success");
  }

  onClearAllCustoms() {
    this.dataService.allComponents().forEach((component) => {
      if (
        !component.isPreset &&
        (component.selected || component.tests.some((t) => t.selected))
      ) {
        if (component.selected) {
          this.dataService.toggleCustomSelection(component.componentName);
        } else {
          component.tests.forEach((test, index) => {
            if (test.selected) {
              this.dataService.toggleTestSelection(
                component.componentName,
                index
              );
            }
          });
        }
      }
    });
    this.showToast("All custom selections cleared", "success");
  }

  onExpandAll() {
    const newExpandState = !this.allExpanded();
    this.allExpanded.set(newExpandState);

    this.dataService.allComponents().forEach((component) => {
      if (!component.isPreset && component.tests.length > 0) {
        if (component.isExpanded !== newExpandState) {
          this.dataService.toggleExpansion(component.componentName);
        }
      }
    });

    this.showToast(
      newExpandState ? "All components expanded" : "All components collapsed",
      "success"
    );
  }

  // Summary handlers
  onToggleSummaryDetails() {
    this.showSummaryDetails.set(!this.showSummaryDetails());
  }

  // Runner handlers
  async onRunTests() {
    if (!this.hasSelectedTests()) {
      this.showToast("Please select at least one test to run", "error");
      return;
    }

    this.isRunning.set(true);
    const reqUrl = "https://example.com/run";
    const selectedTestTags = this.selectedTestTags();
    const testTagsString = selectedTestTags.map((tag) => `@${tag}`).join("|");

    this.lastRunId.set(this.generateUUID(10));
    this.showRunId.set(true);

    const podCount = this.calculatePods();

    const body = {
      automationUrl: this.atlasUrl() || "noderprod",
      testags: testTagsString,
      automationBranch: this.automationBranch() || "main",
      runId: this.lastRunId(),
      podCount: podCount,
    };

    this.showToast("Starting automation...", "success");

    try {
      const res = await fetch(reqUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      console.log("POST sent successfully:", data);
      this.showToast(
        `Automation started successfully! ${selectedTestTags.length} tests running.`,
        "success"
      );
    } catch (err: any) {
      console.error("Error sending POST:", err);
      this.showToast(`Failed to start automation: ${err.message}`, "error");
    } finally {
      this.isRunning.set(false);
    }
  }

  onCopyRunId() {
    const runId = this.lastRunId();
    if (runId) {
      navigator.clipboard.writeText(runId);
      this.showToast("Run ID copied to clipboard!", "success");
    }
  }

  // Private helper methods
  private generateUUID(length: number = 10): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let uuid = "";
    for (let i = 0; i < length; i++) {
      uuid += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return uuid;
  }

  private calculatePods(): number {
    let count = 0;
    this.dataService.customs().forEach((card) => {
      if (card.selected || card.tests.some((t) => t.selected)) {
        count++;
      }
    });
    return count > 0 ? count : 1;
  }

  private showToast(message: string, type: ToastType) {
    this.toastMessage.set(message);
    this.toastType.set(type);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3000);
  }
}