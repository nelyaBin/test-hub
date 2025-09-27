// services/notification.service.ts - תיקון בעיית הarray בתוך array
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
  atlasUrl?: string;
  "atlas-url"?: string;
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

  readonly notificationCount = computed(() => this._notifications().length);
  readonly runningCount = computed(
    () => this._notifications().filter((n) => n.status === "running").length
  );
  readonly activeNotifications = computed(() => this._notifications());

  constructor() {
    this.loadFromCache();
    this.fetchFromServer();
  }

  addRunNotification(atlasUrl: string): string {
    
    const existing = this._notifications().find(n => n.atlasUrl === atlasUrl);
    if (existing) {
      return existing.id;
    }

    const id = this.generateId();
    const displayName = this.getDisplayName(atlasUrl);

    const notification: RunNotification = {
      id,
      atlasUrl,
      displayName,
      status: "running",
      startTime: new Date(),
    };

    this._notifications.update((n) => {
      const newList = [...n, notification];
      return newList;
    });
    
    this._hasNewNotifications.set(true);
    this.saveToCache();

    return id;
  }

  updateRunStatus(atlasUrl: string, status: string): boolean {
    
    if (!atlasUrl || atlasUrl === 'undefined') {
      console.error("❌ Invalid atlasUrl");
      return false;
    }
    
    const notifications = this._notifications();
    const foundIndex = notifications.findIndex((n) => n.atlasUrl === atlasUrl);

    if (foundIndex === -1) {
      return false;
    }

    const updatedNotifications = notifications.map((notification, index) => {
      if (index === foundIndex) {
        const updated = {
          ...notification,
          status: this.mapStatus(status),
          endTime: new Date(),
          duration: this.calculateDuration(notification.startTime, new Date())
        };
        return updated;
      }
      return notification;
    });

    this._notifications.set(updatedNotifications);
    this._hasNewNotifications.set(true);
    this.saveToCache();
    
    return true;
  }

  // תיקון: פונקציה רקורסיבית לטיפול בnested arrays
  handleStatusUpdate(data: any): void {
    this.processDataRecursively(data);
  }

  private processDataRecursively(data: any): void {
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        this.processDataRecursively(item); // רקורסיה
      });
    } else if (data && typeof data === 'object') {
      this.processSingleUpdate(data as RunStatusUpdate);
    } else {
    }
  }

  private processSingleUpdate(update: RunStatusUpdate): void {
    const atlasUrl = update.atlasUrl || update["atlas-url"];
    
    if (!atlasUrl) {
      return;
    }
    
    this.updateRunStatus(atlasUrl, update.status);
  }

  togglePanel(): void {
    this._isOpen.update((isOpen) => !isOpen);
    if (this._isOpen()) {
      this._hasNewNotifications.set(false);
    }
  }

  closePanel(): void {
    this._isOpen.set(false);
  }

  clearAll(): void {
    this._notifications.set([]);
    this._hasNewNotifications.set(false);
    this.saveToCache();
  }

  removeNotification(id: string): void {
    this._notifications.update((n) => n.filter((x) => x.id !== id));
    this.saveToCache();
  }

  clearCompleted(): void {
    this._notifications.update((n) => n.filter((x) => x.status === "running"));
    this.saveToCache();
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getDisplayName(atlasUrl: string): string {
    if (!atlasUrl || atlasUrl === "noderprod") {
      return "Default Environment";
    }
    const cleanName = atlasUrl
      .replace(/^https?:\/\//, "")
      .replace(/\..*$/, "")
      .replace(/[_-]/g, " ");
    return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  }

  private mapStatus(status: string): RunStatus {
    const mapped = (() => {
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
    })();
    
    return mapped;
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

  private saveToCache() {
    try {
      const notifications = this._notifications();
      localStorage.setItem("notifications", JSON.stringify(notifications));
    } catch (error) {
      console.error("Failed to save to cache:", error);
    }
  }

  private loadFromCache() {
    try {
      const data = localStorage.getItem("notifications");
      if (data) {
        const parsed: RunNotification[] = JSON.parse(data);
        const restored = parsed.map((n) => ({
          ...n,
          startTime: new Date(n.startTime),
          endTime: n.endTime ? new Date(n.endTime) : undefined,
        }));
        
        this._notifications.set(restored);
        console.log("💾 Loaded from cache:", restored.length);
      }
    } catch (error) {
      console.warn("Failed to parse cached notifications:", error);
      localStorage.removeItem("notifications");
    }
  }

  private async fetchFromServer() {
    try {
      console.log("🌐 Fetching from server...");
      const resp = await fetch("/running-status");
      if (!resp.ok) {
        console.log("🌐 Server response:", resp.status);
        return;
      }
      
      const updates = await resp.json();
      console.log("🌐 Server data:", updates);
      
      this.handleStatusUpdate(updates);
    } catch (e) {
      console.error("Server fetch error:", e);
    }
  }
}