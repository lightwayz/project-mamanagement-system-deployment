import { Injectable, ApplicationRef, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkTheme = new BehaviorSubject<boolean>(false);
  public isDarkTheme$ = this.isDarkTheme.asObservable();

  constructor(private appRef: ApplicationRef, private ngZone: NgZone) {
    // Check if theme preference is stored in localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.setTheme(savedTheme === 'dark');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark);
    }
  }

  toggleTheme(): void {
    this.setTheme(!this.isDarkTheme.value);
  }

  setTheme(isDark: boolean): void {
    this.isDarkTheme.next(isDark);
    
    // Save preference to localStorage
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Use NgZone to ensure the DOM update happens in the Angular zone
    this.ngZone.run(() => {
      // Apply theme class to body
      const body = document.body;
      if (isDark) {
        body.classList.add('dark-theme');
        body.classList.remove('light-theme');
      } else {
        body.classList.add('light-theme');
        body.classList.remove('dark-theme');
      }

      // Force Angular change detection to re-render all components
      this.appRef.tick();

      // Small delay to ensure all components react to the class change
      setTimeout(() => {
        // Trigger another change detection cycle
        this.appRef.tick();
      }, 10);
    });
  }

  get isDark(): boolean {
    return this.isDarkTheme.value;
  }
}