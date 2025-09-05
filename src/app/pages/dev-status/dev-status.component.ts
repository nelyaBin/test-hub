import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-dev-status',
  templateUrl: './dev-status.component.html',
  styleUrls: ['./dev-status.component.scss']
})
export class DevStatusComponent {
  selected: 'report' | 'lighthouse' = 'report';
  htmlFileUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    this.htmlFileUrl = this.getIframeUrl();
  }

  toggleView(): void {
    this.selected = this.selected === 'report' ? 'lighthouse' : 'report';
    this.htmlFileUrl = this.getIframeUrl();
  }

  private getIframeUrl(): SafeResourceUrl {
    const url =
      this.selected === 'report'
        ? 'assets/sample-report.html'
        : 'assets/iatay.html';

    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
