import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="card empty-state">
      <h2>Page not found</h2>
      <p class="muted">The page you are looking for does not exist.</p>
      <a class="btn-primary" routerLink="/">Back to home</a>
    </section>
  `
})
export class NotFoundPageComponent {}
