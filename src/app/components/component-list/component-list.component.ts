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

  // Computed signals לנתונים מסוננים
  readonly filteredPresets = computed(() => 
    this.dataService.presets().filter((c) =>
      c.componentName.toLowerCase().includes(this.searchTerm().toLowerCase())
    )
  );

  readonly filteredCustoms = computed(() => 
    this.dataService.customs().filter((c) =>
      c.componentName.toLowerCase().includes(this.searchTerm().toLowerCase())
    )
  );

  readonly hasSelectedTests = computed(() => {
    return this.dataService.hasSelectedTests();
  });

  constructor(private dataService: ComponentDataService) {}

  ngOnInit() {
    // הנתונים כבר נטענים באופן אוטומטי בשירות
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
    if (!this.hasSelectedTests()) return;
    
    const reqUrl = "https://example.com/run"; // החלף ל-URL שלך
    const selectedTestTags = this.dataService.getSelectedTestTags();
    const testTagsString = selectedTestTags
      .map((tag) => `@${tag}`)
      .join("|");

    // צור מזהה יוניקי חדש
    this.lastRunId.set(this.generateUUID(10));

    // חישוב כמות פודים
    const podCount = this.calculatePods();

    const body = {
      automationUrl: this.atlasUrl(),
      testtags: testTagsString,
      automationBranch: this.automationBranch(),
      runId: this.lastRunId(), // שולח את המזהה עם הבקשה
      podCount: podCount, // שולח את כמות הפודים
    };

    try {
      const res = await fetch(reqUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      console.log("POST sent successfully:", data);
      this.showToast("Automation started successfully!", "success");
    } catch (err: any) {
      console.error("Error sending POST:", err);
      this.showToast(`Failed to start automation: ${err.message}`, "error");
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