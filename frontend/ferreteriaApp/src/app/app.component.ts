import { Component, OnDestroy, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet, IonToast } from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { HttpErrorService } from './core/services/http-error.service';
import { ChatbotComponent } from './chatbot/chatbot.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, IonToast, ChatbotComponent],
})
export class AppComponent implements OnInit, OnDestroy {
  protected toastOpen = false;
  protected toastMessage = '';
  protected isLoginPage = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly httpErrorService: HttpErrorService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.httpErrorService.errorMessage$
      .pipe(takeUntil(this.destroy$))
      .subscribe((message) => {
        this.toastMessage = message;
        this.toastOpen = true;
      });

    // Detectar si estamos en login
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.isLoginPage = this.router.url.includes('/auth/login');
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
