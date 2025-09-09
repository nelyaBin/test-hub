import { CommonModule } from "@angular/common";
import { Component, OnInit, computed, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ComponentData } from "../../models/component-data.model";
import { ComponentDataService } from "../../services/component-data.service";
import { ComponentCardComponent } from "../component-card/component-card.component";

@Component({
  selector: "app-component-list",
  templateUrl: "./component-list.component.html",
  styleUrls: ["./component-list.component.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule, ComponentCardComponent],
})
export class ComponentListComponent implements OnInit {
  searchTerm = signal("");
  atlasUrl = signal("");
  automationBranch = signal("");
  toastMessage = signal<string | null>(null);
  toastType = signal<"success" | "error">("success");
  lastRunId = signal<string | null>(null);
  showSummaryDetails = signal(false);
  allExpanded = signal(false);
  showRunId = signal(false);

  // Computed signals לנתונים מסוננים
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

  readonly hasSelectedTests = computed(() => {
    return this.dataService.hasSelectedTests();
  });

  // New computed signals for enhanced functionality
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

  constructor(private dataService: ComponentDataService) {}

  ngOnInit() {
    // הנתונים כבר נטענים באופן אוטומטי בשירות
  }

  // Helper methods for template
  getSelectedPresetsCount(): number {
    return this.selectedPresetsCount();
  }

  getSelectedCustomsCount(): number {
    return this.selectedCustomsCount();
  }

  getSelectedTestsCount(): number {
    return this.selectedTestsCount();
  }

  hasSelectedPresets(): boolean {
    return this.selectedPresetsCount() > 0;
  }

  hasSelectedCustoms(): boolean {
    return this.selectedCustomsCount() > 0;
  }

  getSelectedTestTags(): string[] {
    return this.dataService.getSelectedTestTags();
  }

  // Clear actions
  clearAllPresets() {
    this.dataService.allComponents().forEach((component) => {
      if (component.isPreset && component.selected) {
        this.dataService.togglePresetSelection(component.componentName);
      }
    });
    this.showToast("All presets cleared", "success");
  }

  clearAllCustoms() {
    this.dataService.allComponents().forEach((component) => {
      if (
        !component.isPreset &&
        (component.selected || component.tests.some((t) => t.selected))
      ) {
        // Clear the component
        if (component.selected) {
          this.dataService.toggleCustomSelection(component.componentName);
        } else {
          // Clear individual tests
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

  // Expand/Collapse functionality
  toggleExpandAll() {
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

  // Summary functionality
  toggleSummaryDetails() {
    this.showSummaryDetails.set(!this.showSummaryDetails());
  }

  private generateUUID(length: number = 10): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let uuid = "";
    for (let i = 0; i < length; i++) {
      uuid += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return uuid;
  }

  /** מחשב את כמות הפודים הדרושה */
  private calculatePods(): number {
    let count = 0;
    this.dataService.customs().forEach((card) => {
      if (card.selected || card.tests.some((t) => t.selected)) {
        count++;
      }
    });
    return count > 0 ? count : 1; // ברירת מחדל לפחות 1
  }

  async runAll() {
    if (!this.hasSelectedTests()) {
      this.showToast("Please select at least one test to run", "error");
      return;
    }

    const reqUrl = "https://example.com/run"; // החלף ל-URL שלך
    const selectedTestTags = this.dataService.getSelectedTestTags();
    const testTagsString = selectedTestTags.map((tag) => `@${tag}`).join("|");

    // צור מזהה יוניקי חדש
    this.lastRunId.set(this.generateUUID(10));
    this.showRunId.set(true);
    // חישוב כמות פודים
    const podCount = this.calculatePods();

    const body = {
      automationUrl: this.atlasUrl() || "noderprod",
      testags: testTagsString,
      automationBranch: this.automationBranch() || "main",
      runId: this.lastRunId(), // שולח את המזהה עם הבקשה
      podCount: podCount, // שולח את כמות הפודים
    };

    // Show loading state
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
      // Clear the run ID on error
      // this.lastRunId.set(null);
    }
  }

  copyRunId() {
    const runId = this.lastRunId();
    if (runId) {
      navigator.clipboard.writeText(runId);
      this.showToast("Run ID copied to clipboard!", "success");
    }
  }

  showToast(message: string, type: "success" | "error") {
    this.toastMessage.set(message);
    this.toastType.set(type);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3000); // מציג 3 שניות
  }

  // Helper methods for template binding
  updateSearchTerm(value: string) {
    this.searchTerm.set(value);
  }

  updateAtlasUrl(value: string) {
    this.atlasUrl.set(value);
  }

  updateAutomationBranch(value: string) {
    this.automationBranch.set(value);
  }
}
