import { Component } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-personal-report",
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: "./personal-report.component.html",
  styleUrls: ["./personal-report.component.scss"],
})
export class PersonalReportComponent {
  userInput: string = "";
  htmlFileUrl: SafeResourceUrl | null = null;
  errorMessage: string | null = null;

  // מצב של הטוגל
  showToggle: boolean = false;
  selected: "report" | "lighthouse" = "report";

  constructor(private sanitizer: DomSanitizer) {}

  async searchReport() {
    const identifier = this.userInput.trim();
    if (!identifier) {
      this.errorMessage = "Please enter a report identifier";
      this.htmlFileUrl = null;
      this.showToggle = false;
      return;
    }

    // אחרי שהמשתמש הזין מזהה, מראה את הטוגל
    this.showToggle = true;

    this.loadHtml();
  }

  // החלפת view בין Report ל-Lighthouse
  toggleView() {
    this.selected = this.selected === "report" ? "lighthouse" : "report";
    this.loadHtml();
  }

  // טעינת ה-iframe לפי הבחירה
  private async loadHtml() {
    const identifier = this.userInput.trim();
    const fileName =
      this.selected === "report"
        ? `${identifier}-report.html`
        : `${identifier}-lighthouse.html`;
    const path = `${window.location.origin}/assets/${fileName}`;
    console.log(path);

    try {
      const response = await fetch(path, { method: "HEAD" });
      if (!response.ok) throw new Error("File not found");

      this.htmlFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(path);
      this.errorMessage = null;
    } catch (err) {
      this.errorMessage = `Report file not found at path: ${path}`;
      this.htmlFileUrl = null;
    }
  }
}
