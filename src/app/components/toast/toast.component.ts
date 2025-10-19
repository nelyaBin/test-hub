// components/toast/toast.component.ts
import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ToastMessage } from "../../services/toast-manager.service";

@Component({
  selector: "app-toast",
  templateUrl: "./toast.component.html",
  styleUrls: ["./toast.component.scss"],
  standalone: true,
  imports: [CommonModule],
})
export class ToastComponent {
  @Input() toast: ToastMessage | null = null;

  get isVisible(): boolean {
    return !!this.toast;
  }

  get message(): string {
    return this.toast?.message || '';
  }

  get type(): string {
    return this.toast?.type || 'success';
  }

  get toastIcon(): string {
    return this.type === 'success' ? '✅' : '❌';
  }
}