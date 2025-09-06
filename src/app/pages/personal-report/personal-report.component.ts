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

  selected: "report" | "lighthouse" = "report";
  basePath: string = "";

  constructor(private sanitizer: DomSanitizer) {}

  async searchReport() {
    let identifier = this.userInput.trim();
    if (!identifier) {
      this.showError("Please enter a report identifier");
      this.htmlFileUrl = null;
      return;
    }

    // אם המשתמש לא כתב http/https נוסיף אוטומטית
    if (
      !identifier.startsWith("http://") &&
      !identifier.startsWith("https://")
    ) {
      identifier = `http://jsonplaceholder.typicode.com/${identifier}`;
    }

    this.basePath = identifier;

    try {
      const response = await fetch(this.basePath, { method: "GET" });

      if (!response.ok) {
        this.htmlFileUrl = null;
        this.showError(
          `Server returned error: ${response.status} ${response.statusText}`
        );
        return;
      }

      this.clearError();
      this.selected = "report";
      this.setIframeUrl(this.basePath);
    } catch (err: any) {
      this.htmlFileUrl = null;
      this.showError(
        `Cannot load report from ${this.basePath}. ${err.message}`
      );
    }
  }

  toggleView() {
    if (this.selected === "report") {
      this.selected = "lighthouse";
      this.setIframeUrl(`${this.basePath}/lighthouse`);
    } else {
      this.selected = "report";
      this.setIframeUrl(this.basePath);
    }
  }

  private setIframeUrl(path: string) {
    this.htmlFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(path);
  }

  showError(message: string) {
    this.errorMessage = message;
    setTimeout(() => {
      const el = document.querySelector(".error-message");
      if (el) el.classList.remove("fade-out");
    }, 10);
  }

  clearError() {
    const el = document.querySelector(".error-message");
    if (el) {
      el.classList.add("fade-out");
      setTimeout(() => (this.errorMessage = null), 500);
    } else {
      this.errorMessage = null;
    }
  }
}
