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

  constructor(private service: ComponentDataService) {}

  toggleSelection() {
    const newState = !this.data.selected;
    this.data.selected = newState;

    // תמיד נעדכן טסטים ב-custom
    if (!this.isPreset) {
      this.data.tests.forEach((test) => (test.selected = newState));
    }

    // אם זה preset – מסנכרן גם את ה-customs באותה קבוצה
    if (this.isPreset) {
      this.service.syncGroupSelection(this.data.group, newState);
    }
  }

  toggleTestSelection(test: Test) {
    test.selected = !test.selected;
    this.data.selected = this.data.tests.every((t) => t.selected);
  }

  toggleExpand() {
    this.data.isExpanded = !this.data.isExpanded;
  }
}
