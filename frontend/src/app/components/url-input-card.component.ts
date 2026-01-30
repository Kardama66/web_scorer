import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { validateUrl } from '../utils/url';

@Component({
  selector: 'app-url-input-card',
  standalone: true,
  imports: [FormsModule, NgIf],
  template: `
    <form class="url-card" (ngSubmit)="onSubmit()" novalidate>
      <label class="url-label" for="audit-url">Website URL</label>
      <div class="url-field">
        <input
          id="audit-url"
          name="url"
          type="url"
          placeholder="example.com"
          [(ngModel)]="url"
          (input)="clearError()"
          [disabled]="disabled"
          [attr.aria-invalid]="error ? 'true' : 'false'"
          [attr.aria-describedby]="error ? 'audit-url-error' : null"
          required
        />
        <button class="btn-primary" type="submit" [disabled]="disabled">
          Analyze
        </button>
      </div>
      <p class="input-hint">We normalize to https:// and block private network targets.</p>
      <p class="input-error" *ngIf="error" id="audit-url-error">{{ error }}</p>
    </form>
  `
})
export class UrlInputCardComponent {
  @Input() disabled = false;
  @Output() analyze = new EventEmitter<string>();

  url = '';
  error = '';

  onSubmit(): void {
    const result = validateUrl(this.url);
    if (!result.valid || !result.normalized) {
      this.error = result.message ?? 'Please enter a valid website URL.';
      return;
    }
    this.error = '';
    this.analyze.emit(result.normalized);
  }

  clearError(): void {
    if (this.error) {
      this.error = '';
    }
  }
}
