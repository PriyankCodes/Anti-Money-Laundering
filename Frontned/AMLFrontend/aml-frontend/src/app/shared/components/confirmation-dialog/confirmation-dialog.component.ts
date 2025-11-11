import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationDialogService, ConfirmationDialogData } from '../../../core/services/confirmation-dialog.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirmation-overlay" *ngIf="isVisible" (click)="onCancel()">
      <div class="confirmation-dialog" 
           [class.danger]="dialogData?.type === 'danger'"
           [class.warning]="dialogData?.type === 'warning'"
           (click)="$event.stopPropagation()">
        <div class="dialog-icon" [ngClass]="dialogData?.type || 'info'">
          <svg *ngIf="dialogData?.type === 'danger'" width="32" height="32" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" stroke-width="2"/>
          </svg>
          <svg *ngIf="dialogData?.type === 'warning'" width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 20h20L12 2z" stroke="currentColor" stroke-width="2"/>
            <path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="2"/>
          </svg>
          <svg *ngIf="!dialogData?.type || dialogData?.type === 'info'" width="32" height="32" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        <div class="dialog-content">
          <h3 class="dialog-title">{{ dialogData?.title }}</h3>
          <p class="dialog-message">{{ dialogData?.message }}</p>
        </div>
        <div class="dialog-actions">
          <button class="btn-cancel" (click)="onCancel()">
            {{ dialogData?.cancelText || 'Cancel' }}
          </button>
          <button class="btn-confirm" 
                  [class.btn-danger]="dialogData?.type === 'danger'"
                  [class.btn-warning]="dialogData?.type === 'warning'"
                  (click)="onConfirm()">
            {{ dialogData?.confirmText || 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirmation-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 1rem;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .confirmation-dialog {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      max-width: 450px;
      width: 100%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .dialog-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
    }

    .dialog-icon.danger {
      background: #fee2e2;
      color: #ef4444;
    }

    .dialog-icon.warning {
      background: #fef3c7;
      color: #f59e0b;
    }

    .dialog-icon.info {
      background: #dbeafe;
      color: #3b82f6;
    }

    .dialog-content {
      text-align: center;
      margin-bottom: 2rem;
    }

    .dialog-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #0f172a;
      margin: 0 0 0.75rem 0;
      font-family: 'Poppins', sans-serif;
    }

    .dialog-message {
      font-size: 0.9375rem;
      color: #64748b;
      line-height: 1.6;
      margin: 0;
    }

    .dialog-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
    }

    .btn-cancel,
    .btn-confirm {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      min-width: 100px;
    }

    .btn-cancel {
      background: #f1f5f9;
      color: #64748b;
    }

    .btn-cancel:hover {
      background: #e2e8f0;
      color: #475569;
    }

    .btn-confirm {
      background: #3b82f6;
      color: white;
    }

    .btn-confirm:hover {
      background: #2563eb;
    }

    .btn-confirm.btn-danger {
      background: #ef4444;
    }

    .btn-confirm.btn-danger:hover {
      background: #dc2626;
    }

    .btn-confirm.btn-warning {
      background: #f59e0b;
    }

    .btn-confirm.btn-warning:hover {
      background: #d97706;
    }
  `]
})
export class ConfirmationDialogComponent implements OnInit, OnDestroy {
  isVisible = false;
  dialogData: ConfirmationDialogData | null = null;
  private subscription?: Subscription;

  constructor(private confirmationService: ConfirmationDialogService) {}

  ngOnInit(): void {
    this.subscription = this.confirmationService.dialog$.subscribe(data => {
      this.dialogData = data;
      this.isVisible = true;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onConfirm(): void {
    this.confirmationService.sendResult(true);
    this.isVisible = false;
  }

  onCancel(): void {
    this.confirmationService.sendResult(false);
    this.isVisible = false;
  }
}
