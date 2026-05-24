import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HttpErrorService {
  private readonly errorMessageSubject = new Subject<string>();
  readonly errorMessage$ = this.errorMessageSubject.asObservable();

  notify(message: string): void {
    this.errorMessageSubject.next(message);
  }
}
