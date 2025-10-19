// components/test-summary/test-summary.component.ts
import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
  selector: "app-test-summary",
  templateUrl: "./test-summary.component.html",
  styleUrls: ["./test-summary.component.scss"],
  standalone: true,
  imports: [CommonModule],
})
export class TestSummaryComponent {
  @Input() selectedTestsCount: number = 0;
  @Input() selectedTestTags: string[] = [];
  @Input() showDetails: boolean = false;
  @Input() isVisible: boolean = false;

  @Output() toggleDetails = new EventEmitter<void>();

  onToggleDetails() {
    this.toggleDetails.emit();
  }
}