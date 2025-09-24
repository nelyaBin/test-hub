// services/status-endpoint.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NotificationService, RunStatusUpdate } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class StatusEndpointService {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);

  constructor() {
    this.setupStatusEndpoint();
  }

  private setupStatusEndpoint(): void {
    // This is a mock implementation
    // In a real app, you would set up an actual HTTP endpoint
    // or WebSocket connection to listen for status updates
    
    // Example of how to handle incoming status updates:
    this.simulateStatusUpdates();
  }

  // Mock method to simulate receiving status updates
  private simulateStatusUpdates(): void {
    console.log('Status endpoint service initialized');
    console.log('Listening for POST requests on /running-status');
    
    // Example: Simulate receiving a status update after 10 seconds
    setTimeout(() => {
      this.handleStatusUpdate({
        'atlas-url': 'itay',
        status: 'done'
      });
    }, 10000);
  }

  // Method to handle incoming status updates
  handleStatusUpdate(update: RunStatusUpdate): void {
    console.log('Received status update:', update);
    this.notificationService.handleStatusUpdate(update);
  }

  // Method for manually testing status updates
  testStatusUpdate(atlasUrl: string, status: string): void {
    this.handleStatusUpdate({
      'atlas-url': atlasUrl,
      status: status
    });
  }
}

// Example usage in your app.component.ts or main component:
/*
import { StatusEndpointService } from './services/status-endpoint.service';

export class AppComponent {
  constructor(private statusEndpoint: StatusEndpointService) {
    // Service will automatically initialize and listen for updates
  }
  
  // Method to test notifications (for development)
  testNotification(): void {
    this.statusEndpoint.testStatusUpdate('itay', 'done');
  }
}
*/