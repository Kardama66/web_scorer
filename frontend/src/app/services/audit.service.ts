import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuditRequest, AuditResult, ApiError } from '../../../../shared/types';

const STORAGE_PREFIX = 'sitepulse:audit:';
const LAST_ID_KEY = 'sitepulse:last-audit-id';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private currentSignal = signal<AuditResult | null>(null);
  current = this.currentSignal.asReadonly();
  current$ = toObservable(this.currentSignal);

  loading = signal(false);
  loading$ = toObservable(this.loading);
  error = signal<string | null>(null);
  error$ = toObservable(this.error);
  loadingMessage = signal('Analyzing your site...');

  constructor(private http: HttpClient) {}

  async runAudit(url: string): Promise<AuditResult | null> {
    this.loading.set(true);
    this.loadingMessage.set('Running Lighthouse checks...');
    this.error.set(null);
    try {
      const payload: AuditRequest = { url };
      const result = await firstValueFrom(
        this.http.post<AuditResult>('/api/audit', payload)
      );
      this.currentSignal.set(result);
      this.persistAudit(result);
      return result;
    } catch (error) {
      this.error.set(this.extractError(error));
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  async loadAudit(id: string): Promise<AuditResult | null> {
    this.error.set(null);
    const local = this.getLocalAudit(id);
    if (local) {
      this.currentSignal.set(local);
      return local;
    }
    this.loading.set(true);
    this.loadingMessage.set('Loading saved audit...');
    try {
      const result = await firstValueFrom(this.http.get<AuditResult>(`/api/audit/${id}`));
      this.currentSignal.set(result);
      this.persistAudit(result);
      return result;
    } catch (error) {
      this.error.set(this.extractError(error));
      this.currentSignal.set(null);
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  persistAudit(result: AuditResult): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${result.id}`, JSON.stringify(result));
      localStorage.setItem(LAST_ID_KEY, result.id);
    } catch {
      // Ignore storage errors.
    }
  }

  private getLocalAudit(id: string): AuditResult | null {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as AuditResult;
    } catch {
      return null;
    }
  }

  private extractError(err: unknown): string {
    if (typeof err === 'object' && err) {
      const httpErr = err as { status?: number; message?: string; error?: ApiError };
      if (httpErr.status === 0) {
        return 'Backend not reachable. Start the backend on http://localhost:3001 and try again.';
      }
      const payload = httpErr.error;
      if (payload?.message) {
        return payload.message;
      }
      if (httpErr.message) {
        return httpErr.message;
      }
    }
    return 'Something went wrong while running the audit. Please try again.';
  }
}
