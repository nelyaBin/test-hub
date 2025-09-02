import { Component, Input } from "@angular/core";
import { ComponentData, Test } from "../../models/component-data.model";
import { CommonModule } from "@angular/common";
import { ComponentDataService } from "../../services/component-data.service";

@Component({
  selector: "app-component-card",
  templateUrl: "./component-card.component.html",
  styleUrls: ["./component-card.component.scss"],
  standalone: true,
  imports: [CommonModule],
})
export class ComponentCardComponent {
  @Input() data!: ComponentData;
  @Input() isPreset: boolean = false;
  @Input() allData: ComponentData[] = []; // חדש: כל הדאטה נטען מה-JSON

  constructor(private service: ComponentDataService) {}

  toggleSelection() {
    const newState = !this.data.selected;
    this.data.selected = newState;

    if (!this.isPreset) {
      // תמיד נעדכן טסטים ב-custom אם זה custom
      this.data.tests.forEach((test) => (test.selected = newState));
    }

    if (this.isPreset) {
      // מסנכרן גם את הטסטים של custom לפי group של ה-Preset
      this.service.syncGroupSelection(this.data.group, newState, this.allData);
    }
  }

  toggleTestSelection(test: Test) {
    test.selected = !test.selected;
    this.data.selected = this.data.tests.every((t) => t.selected);
  }

  toggleExpand() {
    this.data.isExpanded = !this.data.isExpanded;
  }

  // מחזיר true אם כל הטסטים מסומנים
  get allTestsSelected(): boolean {
    return !!this.data.tests?.length
      ? this.data.tests.every((t) => !!t.selected)
      : !!this.data.selected;
  }

  // מחזיר true אם חלק מהטסטים מסומנים אבל לא כולם
  get partialSelected(): boolean {
    if (!this.data.tests?.length) return false;
    const selectedCount = this.data.tests.filter(t => t.selected).length;
    return selectedCount > 0 && selectedCount < this.data.tests.length;
  }
}
