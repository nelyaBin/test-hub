// components/test-section/test-section.component.ts
import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ComponentData } from "../../models/component-data.model";
import { ComponentCardComponent } from "../component-card/component-card.component";

export type SectionType = 'presets' | 'customs';

@Component({
  selector: "app-test-section",
  templateUrl: "./test-section.component.html",
  styleUrls: ["./test-section.component.scss"],
  standalone: true,
  imports: [CommonModule, ComponentCardComponent],
})
export class TestSectionComponent {
  @Input() title: string = "";
  @Input() icon: string = "";
  @Input() items: ComponentData[] = [];
  @Input() selectedCount: number = 0;
  @Input() sectionType: SectionType = 'presets';
  @Input() hasSelectedItems: boolean = false;
  @Input() noResultsMessage: string = "No matching items found";

  @Output() clearAll = new EventEmitter<void>();
  @Output() expandAll = new EventEmitter<void>();

  get sectionClass(): string {
    return `${this.sectionType}-section`;
  }

  get iconClass(): string {
    return `${this.sectionType.slice(0, -1)}-icon`;
  }

  onClearAll() {
    this.clearAll.emit();
  }

  onExpandAll() {
    this.expandAll.emit();
  }
}