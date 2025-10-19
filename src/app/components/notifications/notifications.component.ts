// components/notifications/notifications.component.ts
import { Component, inject, HostListener } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  NotificationService,
  RunNotification,
  RunStatus,
} from "../../services/notification.service";

@Component({
  selector: "app-notifications",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./notifications.component.html",
  styleUrls: ["./notifications.component.scss"],
})
export class NotificationsComponent {
  private notificationService = inject(NotificationService);

  // Expose service signals
  readonly notifications = this.notificationService.notifications;
  readonly isOpen = this.notificationService.isOpen;
  readonly hasNewNotifications = this.notificationService.hasNewNotifications;
  readonly notificationCount = this.notificationService.notificationCount;
  readonly runningCount = this.notificationService.runningCount;
  readonly activeNotifications = this.notificationService.activeNotifications;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const notificationPanel = document.querySelector('.notification-panel');
    const notificationButton = document.querySelector('.notification-button');
    
    if (this.isOpen() && 
        !notificationPanel?.contains(target) && 
        !notificationButton?.contains(target)) {
      this.closePanel();
    }
  }

  // TrackBy function for better performance
  trackByFn = (index: number, notification: RunNotification): string => {
    return notification.id;
  }

  togglePanel(): void {
    this.notificationService.togglePanel();
  }

  closePanel(): void {
    this.notificationService.closePanel();
  }

  clearAll(): void {
    this.notificationService.clearAll();
  }

  clearCompleted(): void {
    this.notificationService.clearCompleted();
  }

  removeNotification(id: string): void {
    this.notificationService.removeNotification(id);
  }

  getStatusIcon(status: RunStatus): string {
    switch (status) {
      case 'running':
        return '⏳';
      case 'done':
        return '✅';
      case 'failed':
        return '❌';
      case 'inactive':
        return '⚠️';
      default:
        return '❓';
    }
  }

  getStatusText(status: RunStatus): string {
    switch (status) {
      case 'running':
        return 'Running';
      case 'done':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'inactive':
        return 'Inactive Error';
      default:
        return 'Unknown';
    }
  }

  getStatusClass(status: RunStatus): string {
    return `status-${status}`;
  }

  formatTime(date: Date): string {
    return new Intl.DateTimeFormat('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  }

  getEmptyStateMessage(): string {
    return 'אין התראות כרגע';
  }

  getEmptyStateSubMessage(): string {
    return 'כאשר תריץ טסטים, תוכל לראות את הסטטוס כאן';
  }
}