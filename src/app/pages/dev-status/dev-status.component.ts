import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { NgIf } from '@angular/common'; // ✅ ייבוא של NgIf

@Component({
  selector: 'app-dev-status',
  templateUrl: './dev-status.component.html',
  styleUrls: ['./dev-status.component.scss'],
  standalone: true,
  imports: [NgIf] // ✅ הכרחי עבור *ngIf
})
export class DevStatusComponent {
  htmlFileUrl: SafeResourceUrl | null = null;
  fileExists: boolean = true;
  selected: 'report' | 'lighthouse' = 'report';

  constructor(private sanitizer: DomSanitizer, private http: HttpClient) {
    this.loadFile('assets/sample-report.html');
  }

  toggleView() {
    if (this.selected === 'report') {
      this.selected = 'lighthouse';
      this.loadFile('assets/sample-lighthouse.html');
    } else {
      this.selected = 'report';
      this.loadFile('assets/sample-report.html');
    }
  }

  loadFile(filePath: string) {
    this.http.head(filePath, { observe: 'response' }).subscribe({
      next: () => {
        this.fileExists = true;
        this.htmlFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(filePath);
      },
      error: () => {
        this.fileExists = false;
        this.htmlFileUrl = null; // לא נותנים ל-iframe src
      }
    });
  }
}
