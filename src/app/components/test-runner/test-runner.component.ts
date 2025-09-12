// components/test-runner/test-runner.component.ts
import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";

export interface RunConfiguration {
  atlasUrl: string;
  automationBranch: string;
  selectedTestTags: string[];
}

@Component({
  selector: "app-test-runner",
  templateUrl: "./test-runner.component.html",
  styleUrls: ["./test-runner.component.scss"],
  standalone: true,
  imports: [CommonModule],
})
export class TestRunnerComponent {
  @Input() hasSelectedTests: boolean = false;
  @Input() selectedTestsCount: number = 0;
  @Input() lastRunId: string | null = null;
  @Input() showRunId: boolean = false;
  @Input() isRunning: boolean = false;

  @Output() runTests = new EventEmitter<void>();
  @Output() copyRunId = new EventEmitter<void>();

  onRunTests() {
    this.runTests.emit();
  }

  onCopyRunId() {
    this.copyRunId.emit();
  }
}