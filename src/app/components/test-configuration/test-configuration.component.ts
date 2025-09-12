// components/test-configuration/test-configuration.component.ts
import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";

export interface TestConfigurationData {
  searchTerm: string;
  atlasUrl: string;
  automationBranch: string;
}

@Component({
  selector: "app-test-configuration",
  templateUrl: "./test-configuration.component.html",
  styleUrls: ["./test-configuration.component.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class TestConfigurationComponent {
  @Input() searchTerm: string = "";
  @Input() atlasUrl: string = "";
  @Input() automationBranch: string = "";

  @Output() searchTermChange = new EventEmitter<string>();
  @Output() atlasUrlChange = new EventEmitter<string>();
  @Output() automationBranchChange = new EventEmitter<string>();

  onSearchTermChange(value: string) {
    this.searchTermChange.emit(value);
  }

  onAtlasUrlChange(value: string) {
    this.atlasUrlChange.emit(value);
  }

  onAutomationBranchChange(value: string) {
    this.automationBranchChange.emit(value);
  }
}