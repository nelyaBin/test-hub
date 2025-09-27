// services/test-runner.service.ts (Updated with notifications integration)
import { Injectable, signal, inject } from "@angular/core";
import { NotificationService } from "./notification.service";

export interface TestRunRequest {
  automationUrl: string;
  testags: string;
  automationBranch: string;
  runId: string;
  podCount: number;
}

export interface TestRunResult {
  success: boolean;
  runId: string;
  testCount: number;
  error?: string;
  data?: any;
  notificationId?: string;
}

@Injectable({
  providedIn: "root",
})
export class TestRunnerService {
  private readonly API_URL = "https://example.com/run";

  private readonly _lastRunId = signal<string | null>(null);
  private readonly _isRunning = signal(false);
  private readonly _showRunId = signal(false);

  // Inject notification service
  private notificationService = inject(NotificationService);

  readonly lastRunId = this._lastRunId.asReadonly();
  readonly isRunning = this._isRunning.asReadonly();
  readonly showRunId = this._showRunId.asReadonly();

  async executeTests(request: TestRunRequest): Promise<TestRunResult> {
    console.log("🚀 Starting test execution for:", request.automationUrl);

    this._isRunning.set(true);
    this._lastRunId.set(request.runId);
    this._showRunId.set(true);

    // ✅ הוסף התראה מיד כשלוחצים על הכפתור - עם סטטוס "running"
    const notificationId = this.notificationService.addRunNotification(
      request.automationUrl
    );
    console.log("📝 Added notification for run:", {
      automationUrl: request.automationUrl,
      runId: request.runId,
      notificationId,
    });

    try {
      // const response = await fetch(this.API_URL, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(request)
      // });

      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }

      // const data = await response.json();
      // console.log('✅ POST sent successfully:', data);

      // אם הבקשה הצליחה, ההתראה תישאר "running"
      // והסטטוס יתעדכן מהשרת דרך /running-status endpoint
      return {
        success: true,
        runId: request.runId,
        testCount: request.testags.split("|").length,
        // data,
        notificationId,
      };
    } catch (error: any) {
      console.error("❌ Error sending POST:", error);

      // אם הבקשה נכשלה, עדכן את ההתראה לסטטוס "failed"
      // this.notificationService.updateRunStatus(request.automationUrl, 'failed');
      console.log(
        "📝 Updated notification status to failed for:",
        request.automationUrl
      );

      return {
        success: false,
        runId: request.runId,
        testCount: request.testags.split("|").length,
        error: error.message,
        notificationId,
      };
    } finally {
      this._isRunning.set(false);
    }
  }

  generateRunId(length: number = 10): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let uuid = "";
    for (let i = 0; i < length; i++) {
      uuid += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return uuid;
  }

  async copyRunIdToClipboard(): Promise<boolean> {
    const runId = this._lastRunId();
    if (!runId) return false;

    try {
      await navigator.clipboard.writeText(runId);
      return true;
    } catch (error) {
      console.error("Failed to copy run ID:", error);
      return false;
    }
  }

  // שיטה חדשה: עדכון ידני של סטטוס (לטסטים)
  updateRunStatus(
    automationUrl: string,
    status: "running" | "done" | "failed"
  ): void {
    console.log(
      `🔄 Manually updating status for ${automationUrl} to ${status}`
    );
    this.notificationService.updateRunStatus(automationUrl, status);
  }

  // שיטה חדשה: קבלת מידע על התראות
  getNotificationsInfo(): any {
    return {
      total: this.notificationService.notificationCount(),
      running: this.notificationService.runningCount(),
      notifications: this.notificationService.notifications(),
    };
  }

  // שיטה חדשה: סימולציה של עדכון סטטוס (לפיתוח)
  simulateStatusUpdate(automationUrl: string, delaySeconds: number = 5): void {
    console.log(
      `🧪 Simulating status update for ${automationUrl} in ${delaySeconds}s`
    );

    setTimeout(() => {
      const randomStatus = Math.random() > 0.7 ? "failed" : "done";
      this.updateRunStatus(automationUrl, randomStatus);
      console.log(
        `🎯 Simulated status update: ${automationUrl} -> ${randomStatus}`
      );
    }, delaySeconds * 1000);
  }

  reset(): void {
    this._lastRunId.set(null);
    this._isRunning.set(false);
    this._showRunId.set(false);
  }
}
