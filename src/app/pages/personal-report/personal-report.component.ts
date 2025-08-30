import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-personal-report',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './personal-report.component.html',
  styleUrls: ['./personal-report.component.scss']
})
export class PersonalReportComponent {
  userInput: string = '';
  htmlFileUrl: SafeResourceUrl | null = null;
  errorMessage: string | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  async searchReport() {
    const identifier = this.userInput.trim();
    if (!identifier) {
      this.errorMessage = 'Please enter a report identifier';
      this.htmlFileUrl = null;
      return;
    }

    const path = `${window.location.origin}/assets/${identifier}.html`;

    try {
      const response = await fetch(path, { method: 'HEAD' });
      if (!response.ok) throw new Error('File not found');

      this.htmlFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(path);
      this.errorMessage = null;
    } catch (err) {
      this.errorMessage = `Report file not found at path: ${path}`;
      this.htmlFileUrl = null;
    }
  }
}
