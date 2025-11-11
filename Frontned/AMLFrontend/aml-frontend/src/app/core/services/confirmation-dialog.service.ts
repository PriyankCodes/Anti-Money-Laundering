import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export interface ConfirmationDialogResult {
  confirmed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {
  private dialogSubject = new Subject<ConfirmationDialogData>();
  private resultSubject = new Subject<ConfirmationDialogResult>();

  public dialog$ = this.dialogSubject.asObservable();
  public result$ = this.resultSubject.asObservable();

  confirm(data: ConfirmationDialogData): Observable<boolean> {
    this.dialogSubject.next(data);
    
    return new Observable(observer => {
      const subscription = this.result$.subscribe(result => {
        observer.next(result.confirmed);
        observer.complete();
        subscription.unsubscribe();
      });
    });
  }

  sendResult(confirmed: boolean): void {
    this.resultSubject.next({ confirmed });
  }
}
