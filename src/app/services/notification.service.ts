// services/notification.service.ts
import { Injectable, signal, computed } from "@angular/core";

export type RunStatus = "running" | "done" | "failed" | "inactive";

export interface RunNotification {
  id: string;
  atlasUrl: string;
  displayName: string;
  status: RunStatus;
  startTime: Date;
  endTime?: Date;
  duration?: string;
}

export interface RunStatusUpdate {
  "atlas-url": string;
  status: string;
}

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private readonly _notifications = signal<RunNotification[]>([]);
  private readonly _isOpen = signal(false);
  private readonly _hasNewNotifications = signal(false);

  readonly notifications = this._notifications.asReadonly();
  readonly isOpen = this._isOpen.asReadonly();
  readonly hasNewNotifications = this._hasNewNotifications.asReadonly();

  // Computed values
  readonly notificationCount = computed(() => this._notifications().length);
  readonly runningCount = computed(
    () => this._notifications().filter((n) => n.status === "running").length
  );
  readonly activeNotifications = computed(() =>
    this._notifications().filter((n) => n.status !== "inactive")
  );

  constructor() {
    this.setupStatusEndpoint();
  }

  // Add new run notification
  addRunNotification(atlasUrl: string): string {
    const id = this.generateId();
    const displayName = this.getDisplayName(atlasUrl);

    const notification: RunNotification = {
      id,
      atlasUrl,
      displayName,
      status: "running",
      startTime: new Date(),
    };

    this._notifications.update((notifications) => [
      ...notifications,
      notification,
    ]);
    this._hasNewNotifications.set(true);

    return id;
  }

  // Update run status
  updateRunStatus(atlasUrl: string, status: string): boolean {
    const notifications = this._notifications();
    const index = notifications.findIndex((n) => n.atlasUrl === atlasUrl);

    if (index === -1) {
      // Handle non-existent URL
      this.addInactiveError(atlasUrl);
      return false;
    }

    const updatedNotifications = [...notifications];
    const notification = updatedNotifications[index];

    notification.status = this.mapStatus(status);
    notification.endTime = new Date();
    notification.duration = this.calculateDuration(
      notification.startTime,
      notification.endTime
    );

    this._notifications.set(updatedNotifications);
    this._hasNewNotifications.set(true);

    return true;
  }

  // Toggle notification panel
  togglePanel(): void {
    this._isOpen.update((isOpen) => !isOpen);
    if (this._isOpen()) {
      this._hasNewNotifications.set(false);
    }
  }

  // Close notification panel
  closePanel(): void {
    this._isOpen.set(false);
  }

  // Clear all notifications
  clearAll(): void {
    this._notifications.set([]);
    this._hasNewNotifications.set(false);
  }

  // Remove specific notification
  removeNotification(id: string): void {
    this._notifications.update((notifications) =>
      notifications.filter((n) => n.id !== id)
    );
  }

  // Clear completed notifications
  clearCompleted(): void {
    this._notifications.update((notifications) =>
      notifications.filter((n) => n.status === "running")
    );
  }

  // Private methods
  private setupStatusEndpoint(): void {
    // This would typically be handled by your backend/API layer
    // For demo purposes, we'll just expose a method to handle status updates
    console.log(
      "Notification service initialized. Listening for status updates on /running-status"
    );
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getDisplayName(atlasUrl: string): string {
    // Extract meaningful name from atlas URL
    if (!atlasUrl || atlasUrl === "noderprod") {
      return "Default Environment";
    }

    // Remove common prefixes/suffixes and capitalize
    const cleanName = atlasUrl
      .replace(/^https?:\/\//, "")
      .replace(/\..*$/, "")
      .replace(/[_-]/g, " ");

    return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  }

  private mapStatus(status: string): RunStatus {
    switch (status.toLowerCase()) {
      case "done":
      case "completed":
      case "success":
        return "done";
      case "running":
      case "in_progress":
      case "pending":
        return "running";
      case "failed":
      case "error":
      case "cancelled":
        return "failed";
      default:
        return "inactive";
    }
  }

  private calculateDuration(start: Date, end: Date): string {
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);

    if (diffMins > 0) {
      return `${diffMins}m ${diffSecs}s`;
    }
    return `${diffSecs}s`;
  }

  private addInactiveError(atlasUrl: string): void {
    const id = this.generateId();
    const notification: RunNotification = {
      id,
      atlasUrl,
      displayName: `Unknown: ${atlasUrl}`,
      status: "inactive",
      startTime: new Date(),
      endTime: new Date(),
      duration: "0s",
    };

    this._notifications.update((notifications) => [
      ...notifications,
      notification,
    ]);
    this._hasNewNotifications.set(true);
  }

  // Method to handle POST requests to /running-status
  handleStatusUpdate(update: RunStatusUpdate): void {
    this.updateRunStatus(update["atlas-url"], update.status);
  }
}