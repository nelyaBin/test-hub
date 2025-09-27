// services/status-endpoint.service.ts - עם debug
import { Injectable, inject, NgZone } from "@angular/core";
import { NotificationService, RunStatusUpdate } from "./notification.service";

@Injectable({
  providedIn: "root",
})
export class StatusEndpointService {
  private notificationService = inject(NotificationService);
  private ngZone = inject(NgZone);

  constructor() {
    console.log("🌐 StatusEndpointService starting...");
    this.setupStatusEndpoint();
  }

  private setupStatusEndpoint(): void {
    console.log("🌐 Setting up SSE connection to /events");
    
    const eventSource = new EventSource("/events");

    eventSource.onopen = () => {
      console.log("✅ SSE connection opened");
    };

    eventSource.onmessage = (event) => {
      console.log("📨 === RAW SSE MESSAGE ===");
      console.log("Raw event:", event);
      console.log("Raw data:", event.data);
      
      try {
        const update: RunStatusUpdate = JSON.parse(event.data);
        console.log("Parsed update:", update);
        
        this.ngZone.run(() => {
          console.log("Running in NgZone...");
          this.notificationService.handleStatusUpdate(update);
        });
      } catch (error) {
        console.error("❌ Failed to parse SSE data:", error);
        console.log("Raw data was:", event.data);
      }
    };

    eventSource.onerror = (err) => {
      console.error("❌ SSE connection error:", err);
      console.log("EventSource readyState:", eventSource.readyState);
      console.log("EventSource CONNECTING=0, OPEN=1, CLOSED=2");
    };

    // בדיקה נוספת
    setTimeout(() => {
      console.log("SSE Connection state after 2s:", eventSource.readyState);
    }, 2000);
  }
}