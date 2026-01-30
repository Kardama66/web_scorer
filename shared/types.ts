export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface AuditCheck {
  id: string;
  title: string;
  description?: string;
  status: CheckStatus;
  weight?: number;
}

export interface AuditCategory {
  id: string;
  title: string;
  weight: number;
  score: number;
  checks: AuditCheck[];
}

export interface AuditResult {
  id: string;
  url: string;
  timestamp: string;
  score: number;
  categories: AuditCategory[];
  recommendations: string[];
}

export interface AuditRequest {
  url: string;
}

export interface ApiError {
  errorCode: string;
  message: string;
}
