// components/toast/toast.component.ts
import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";

export type ToastType = 'success' | 'error';

@Component({
  selector: "app-toast",
  templateUrl: "./toast.component.html",
  styleUrls: ["./toast.component.scss"],
  standalone: true,
  imports: [CommonModule],
})
export class ToastComponent {
  @Input() message: string | null = null;
  @Input() type: ToastType = 'success';

  get isVisible(): boolean {
    return !!this.message;
  }

  get toastIcon(): string {
    return this.type === 'success' ? '✅' : '❌';
  }
}