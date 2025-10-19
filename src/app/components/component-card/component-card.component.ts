import { Component, Input, computed } from "@angular/core";
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

  // Computed signals לטיפול במצבי הבחירה
  readonly allTestsSelected = computed(() => {
    return this.service.getAllTestsSelectedState(this.data.componentName)();
  });

  readonly partialSelected = computed(() => {
    return this.service.getPartialSelectionState(this.data.componentName)();
  });

  constructor(private service: ComponentDataService) {}

  toggleSelection() {
    if (this.isPreset) {
      this.service.togglePresetSelection(this.data.componentName);
    } else {
      this.service.toggleCustomSelection(this.data.componentName);
    }
  }

  toggleTestSelection(testIndex: number, event: Event) {
    event.stopPropagation();
    if (!this.isPreset) {
      this.service.toggleTestSelection(this.data.componentName, testIndex);
    }
  }

  toggleExpand(event: Event) {
    event.stopPropagation();
    this.service.toggleExpansion(this.data.componentName);
  }
}