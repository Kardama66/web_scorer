import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  template: `
    <div class="loading-overlay" role="status" aria-live="polite">
      <div class="loading-card">
        <div class="spinner" aria-hidden="true"></div>
        <div class="loading-text">
          <strong>{{ message }}</strong>
          <span>Running Lighthouse checks and collecting signals.</span>
        </div>
      </div>
    </div>
  `
})
export class LoadingOverlayComponent {
  @Input() message = 'Analyzing your site...';
}
