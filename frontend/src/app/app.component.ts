import { Component, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';
import { filter } from 'rxjs';
import { AuditService } from './services/audit.service';
import { LoadingOverlayComponent } from './components/loading-overlay.component';

type ThemeMode = 'light' | 'dark';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NgIf, LoadingOverlayComponent],
  template: `
    <div class="app-shell">
      <header class="topbar" *ngIf="!embedMode()">
        <a class="brand" routerLink="/">
          <span class="brand-dot"></span>
          <span>SitePulse</span>
        </a>
        <div class="topbar-actions">
          <button class="btn-ghost" type="button" (click)="toggleTheme()" aria-label="Toggle theme">
            <span *ngIf="theme() === 'dark'">Light mode</span>
            <span *ngIf="theme() === 'light'">Dark mode</span>
          </button>
        </div>
      </header>

      <main class="main-content" [class.embed-main]="embedMode()">
        <router-outlet></router-outlet>
      </main>

      <footer class="footer" *ngIf="!embedMode()">
        <span>(c) 2026 SitePulse Labs - Demo SaaS</span>
      </footer>

      <app-loading-overlay
        *ngIf="auditService.loading()"
        [message]="auditService.loadingMessage()"
      ></app-loading-overlay>
    </div>
  `
})
export class AppComponent implements OnInit {
  theme = signal<ThemeMode>('light');
  embedMode = signal(false);

  constructor(public auditService: AuditService, private router: Router) {}

  ngOnInit(): void {
    const stored = this.safeLocalStorageGet('sitepulse-theme');
    const initial = stored === 'dark' ? 'dark' : 'light';
    this.theme.set(initial);
    this.applyTheme(initial);

    this.syncEmbedMode();
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.syncEmbedMode());
  }

  toggleTheme(): void {
    const next: ThemeMode = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    this.applyTheme(next);
    this.safeLocalStorageSet('sitepulse-theme', next);
  }

  private applyTheme(mode: ThemeMode): void {
    document.documentElement.dataset['theme'] = mode;
  }

  private syncEmbedMode(): void {
    const url = this.router.url;
    const embed = url.includes('embed=1') || url.includes('embed=true');
    this.embedMode.set(embed);
    document.body.classList.toggle('embed-body', embed);
  }

  private safeLocalStorageGet(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private safeLocalStorageSet(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore storage errors (private mode, quota, etc.)
    }
  }
}
