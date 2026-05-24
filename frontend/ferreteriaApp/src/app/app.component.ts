import { Component, OnDestroy, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet, IonToast } from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';

import { HttpErrorService } from './core/services/http-error.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, IonToast],
})
export class AppComponent implements OnInit, OnDestroy {
  protected toastOpen = false;
  protected toastMessage = '';

  private readonly destroy$ = new Subject<void>();

  constructor(private readonly httpErrorService: HttpErrorService) {}

  ngOnInit(): void {
    this.httpErrorService.errorMessage$
      .pipe(takeUntil(this.destroy$))
      .subscribe((message) => {
        this.toastMessage = message;
        this.toastOpen = true;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onToastDismiss(): void {
    this.toastOpen = false;
  }
}
