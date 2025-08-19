import { writable, derived, type Writable, type Readable } from 'svelte/store';

// Base path from Vite config (e.g., "/ZoomingOnline/") without trailing slash
// Get Vite base URL if available at runtime; fall back to '/'
const baseEnv = ((import.meta as any)?.env?.BASE_URL as string) || '/';
const base = baseEnv.replace(/\/$/, '');

// Full path including base and query, e.g., "/ZoomingOnline/selection?x=1"
const fullPath: Writable<string> = writable(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/');

// Expose current route path without the base prefix, starting with '/', e.g., '/selection'
export const path: Readable<string> = derived(fullPath, ($full: string) => {
  try {
    const url = new URL($full, window.location.origin);
    const pathname = url.pathname.startsWith(base) ? url.pathname.slice(base.length) : url.pathname;
    return pathname || '/';
  } catch {
    // If $full isn't a full URL, treat it as a pathname
  const pathname = ($full || '/').split('?')[0] || '/';
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
  }
});

export function push(href: string): void {
  const relative = href.startsWith('/') ? href : `/${href}`;
  const hasQuery = relative.includes('?');
  const target = `${base}${relative}` + (hasQuery ? '' : window.location.search) + (window.location.hash || '');
  history.pushState(null, '', target);
  fullPath.set(window.location.pathname + window.location.search);
}

export function replace(href: string): void {
  const relative = href.startsWith('/') ? href : `/${href}`;
  const hasQuery = relative.includes('?');
  const target = `${base}${relative}` + (hasQuery ? '' : window.location.search) + (window.location.hash || '');
  history.replaceState(null, '', target);
  fullPath.set(window.location.pathname + window.location.search);
}

export function updateQuery(mutator: (url: URL) => void): void {
  const url = new URL(window.location.href);
  mutator(url);
  history.replaceState(null, '', url.toString());
}

export function initRouter(): void {
  if (typeof window === 'undefined') return;
  // Sync on initial load
  fullPath.set(window.location.pathname + window.location.search);
  // Listen to back/forward
  window.addEventListener('popstate', () => {
    fullPath.set(window.location.pathname + window.location.search);
  });
}
