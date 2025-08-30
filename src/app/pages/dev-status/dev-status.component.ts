import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-dev-status',
  templateUrl: './dev-status.component.html',
  styleUrls: ['./dev-status.component.scss']
})
export class DevStatusComponent {
  htmlFileUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    // 👇 יחסית ל-root של Angular (עובד תמיד)
    this.htmlFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl('assets/sample-report.html');
  }
}
