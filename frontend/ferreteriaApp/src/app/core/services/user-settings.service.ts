import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface UserSettings {
  notificationsEnabled: boolean;
  theme?: string;
}

@Injectable({ providedIn: 'root' })
export class UserSettingsService {
  private readonly storageKey = 'user_settings';
  private settingsSubject = new BehaviorSubject<UserSettings>(
    this.loadSettings(),
  );
  settings$ = this.settingsSubject.asObservable();

  private loadSettings(): UserSettings {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { notificationsEnabled: true };
      }
    }
    return { notificationsEnabled: true };
  }

  updateSettings(settings: Partial<UserSettings>): void {
    const current = this.settingsSubject.value;
    const updated = { ...current, ...settings };
    localStorage.setItem(this.storageKey, JSON.stringify(updated));
    this.settingsSubject.next(updated);
  }

  getNotificationsEnabled(): boolean {
    return this.settingsSubject.value.notificationsEnabled;
  }
}
