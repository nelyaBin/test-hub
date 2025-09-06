import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
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
  allData: ComponentData[] = [];
  presets: ComponentData[] = [];
  custom: ComponentData[] = [];
  searchTerm: string = "";
  atlasUrl: string = "";
  automationBranch: string = "";

  toastMessage: string | null = null;
  toastType: "success" | "error" = "success";

  lastRunId: string | null = null; // מזהה יוניקי אחרון

  constructor(private dataService: ComponentDataService) {}

  ngOnInit() {
    this.dataService.getComponents().subscribe((data) => {
      this.allData = data;
      this.presets = data.filter((d) => d.isPreset);
      this.custom = data.filter((d) => !d.isPreset);
    });
  }

  get filteredPresets(): ComponentData[] {
    return this.presets.filter((c) =>
      c.componentName.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  get filteredCustoms(): ComponentData[] {
    return this.custom.filter((c) =>
      c.componentName.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  onSelectionChanged(component: ComponentData) {
    component.selected = !component.selected;
  }

  hasSelectedTests(): boolean {
    return [...this.presets, ...this.custom].some(
      (card) => card.selected || card.tests.some((test) => test.selected)
    );
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
    this.custom.forEach((card) => {
      if (card.selected || card.tests.some((t) => t.selected)) {
        count++;
      }
    });
    return count > 0 ? count : 1; // ברירת מחדל לפחות 1
  }

  async runAll() {
    if (!this.hasSelectedTests()) return;

    const reqUrl = "https://example.com/run"; // החלף ל-URL שלך
    const allSelectedTestsTags = new Set<string>();

    [...this.presets, ...this.custom].forEach((card) => {
      card.tests.forEach((test) => {
        if (test.selected) allSelectedTestsTags.add(test.testTag);
      });
    });

    const testTagsString = Array.from(allSelectedTestsTags)
      .map((tag) => `@${tag}`)
      .join("|");

    // צור מזהה יוניקי חדש
    this.lastRunId = this.generateUUID(10);

    // חישוב כמות פודים
    const podCount = this.calculatePods();

    const body = {
      automationUrl: this.atlasUrl,
      testtags: testTagsString,
      automationBranch: this.automationBranch,
      runId: this.lastRunId, // שולח את המזהה עם הבקשה
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
    if (this.lastRunId) {
      navigator.clipboard.writeText(this.lastRunId);
      this.showToast("Run ID copied to clipboard!", "success");
    }
  }

  showToast(message: string, type: "success" | "error") {
    this.toastMessage = message;
    this.toastType = type;

    setTimeout(() => {
      this.toastMessage = null;
    }, 3000); // מציג 3 שניות
  }
}
