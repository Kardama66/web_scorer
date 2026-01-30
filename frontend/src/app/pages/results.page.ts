import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { AuditService } from '../services/audit.service';
import { ScoreRingComponent } from '../components/score-ring.component';
import { CategoryCardComponent } from '../components/category-card.component';
import { RecommendationsComponent } from '../components/recommendations.component';
import { OverlayWidgetComponent } from '../components/overlay-widget.component';

@Component({
  selector: 'app-results-page',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    DatePipe,
    ScoreRingComponent,
    CategoryCardComponent,
    RecommendationsComponent,
    OverlayWidgetComponent
  ],
  template: `
    <section *ngIf="embedMode(); else fullReport">
      <app-overlay-widget
        *ngIf="auditService.current(); else empty"
        [audit]="auditService.current()!"
      ></app-overlay-widget>
    </section>

    <ng-template #fullReport>
      <section class="results" *ngIf="auditService.current(); else empty">
      <div class="results-header">
        <div>
          <p class="eyebrow">Audit results</p>
          <h2>{{ auditService.current()?.url }}</h2>
          <p class="muted">Scanned {{ auditService.current()?.timestamp | date: 'medium' }}</p>
        </div>
        <div class="results-actions">
          <div class="score-pill">
            <span>Overall</span>
            <strong>{{ auditService.current()?.score }}</strong>
          </div>
          <button class="btn-ghost" type="button" (click)="runAgain()">Run again</button>
          <button class="btn-primary" type="button" (click)="generateShareLink()">
            Generate share link
          </button>
        </div>
      </div>

      <div class="results-grid">
        <app-score-ring [score]="auditService.current()?.score ?? 0"></app-score-ring>
        <section class="card summary-card">
          <h3>What we checked</h3>
          <ul>
            <li>Performance and Core Web Vitals</li>
            <li>SEO metadata + crawl hints</li>
            <li>HTTPS and mixed content</li>
            <li>Mobile UX signals</li>
            <li>Conversion and CTA clarity</li>
          </ul>
          <p class="muted small">
            Tip: share this report to align on priorities faster.
          </p>
        </section>
      </div>

      <p class="share-link" *ngIf="shareLink()">
        Share link ready: <span>{{ shareLink() }}</span>
      </p>

      <section class="category-grid">
        <app-category-card
          *ngFor="let category of auditService.current()?.categories ?? []"
          [category]="category"
        ></app-category-card>
      </section>

      <app-recommendations [recommendations]="auditService.current()?.recommendations ?? []">
      </app-recommendations>
      <section class="card embed-card">
        <h3>Embed this overlay</h3>
        <p class="muted">Paste this iframe into your website to show the latest score.</p>
        <div class="embed-actions">
          <button class="btn-ghost" type="button" (click)="copyEmbedCode()">
            Copy embed code
          </button>
          <a class="btn-primary" [href]="embedUrl()" target="_blank" rel="noopener">
            Preview overlay
          </a>
        </div>
        <pre class="code-block">{{ embedCode() }}</pre>
      </section>
    </section>
    </ng-template>

    <ng-template #empty>
      <section class="card empty-state">
        <h2>No results found</h2>
        <p class="muted">
          We could not load that audit. Run a new scan to generate a fresh report.
        </p>
        <button class="btn-primary" type="button" (click)="runAgain()">Run a new audit</button>
      </section>
    </ng-template>
  `
})
export class ResultsPageComponent implements OnInit {
  shareLink = signal('');
  embedMode = signal(false);
  embedCode = signal('');
  embedUrl = signal('');

  constructor(private route: ActivatedRoute, private router: Router, public auditService: AuditService) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.auditService.loadAudit(id);
      }
    });
    this.route.queryParamMap.subscribe((params) => {
      const embed = params.get('embed');
      this.embedMode.set(embed === '1' || embed === 'true');
      this.updateEmbedSnippet();
    });
    this.auditService.current$.subscribe(() => this.updateEmbedSnippet());
  }

  async generateShareLink(): Promise<void> {
    const current = this.auditService.current();
    if (!current) {
      return;
    }
    this.auditService.persistAudit(current);
    const link = `${window.location.origin}/r/${current.id}`;
    this.shareLink.set(link);
    await this.router.navigate(['/r', current.id]);
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Clipboard access is optional; link is still shown.
    }
  }

  async copyEmbedCode(): Promise<void> {
    const code = this.embedCode();
    if (!code) {
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Ignore clipboard errors.
    }
  }

  async runAgain(): Promise<void> {
    await this.router.navigate(['/']);
  }

  private updateEmbedSnippet(): void {
    const current = this.auditService.current();
    if (!current) {
      return;
    }
    const origin = window.location.origin;
    const embedUrl = `${origin}/r/${current.id}?embed=1`;
    this.embedUrl.set(embedUrl);
    this.embedCode.set(
      `<iframe src="${embedUrl}" width="320" height="420" style="border:0;border-radius:16px;overflow:hidden" loading="lazy"></iframe>`
    );
  }
}
