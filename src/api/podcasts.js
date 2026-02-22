/**
 * src/api/podcasts.js
 * -------------------
 * Frontend proxy client for the PodVault podcast integration layer.
 *
 * SECURITY: All calls go to our own Django backend — never to Taddy,
 * iTunes, or Podchaser directly. API keys stay on the server and are
 * never bundled into the Vite client-side build.
 *
 * Usage
 * -----
 *   import { searchPodcasts, getPodcastDetail, getPodcastCredits } from '@/api/podcasts';
 *
 *   // In a React component / hook:
 *   const results = await searchPodcasts('The Daily', 'itunes');
 *   const detail  = await getPodcastDetail('the-daily');
 *   const credits = await getPodcastCredits('the-daily');
 */

/** Base URL — reads VITE_API_URL from .env.local, falls back to local Django dev server. */
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Thin fetch wrapper that:
 *  - Prepends BASE_URL
 *  - Throws a descriptive Error on non-2xx responses
 *  - Returns parsed JSON
 *
 * @param {string} path     - Absolute path, e.g. '/api/v1/podcasts/search/'
 * @param {RequestInit} [opts] - fetch options
 * @returns {Promise<any>}
 */
async function apiFetch(path, opts = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    credentials: 'include',           // send session/JWT cookies
    headers: { Accept: 'application/json', ...opts.headers },
    ...opts,
  });

  if (!response.ok) {
    /** @type {{ error?: string, detail?: string }} */
    let errorBody = {};
    try {
      errorBody = await response.json();
    } catch {
      // non-JSON error body — ignore
    }
    const message =
      errorBody.detail ??
      errorBody.error ??
      `Request failed: ${response.status} ${response.statusText}`;
    const err = new Error(message);
    err.status = response.status;
    err.provider = errorBody.provider ?? null;
    throw err;
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Search for podcasts via the Django proxy.
 *
 * The server performs the actual provider call (iTunes / Taddy / Podchaser)
 * and caches the result in Redis for 24 h.
 *
 * @param {string}  query              - Search term.
 * @param {'itunes'|'taddy'|'podchaser'} [provider='itunes'] - Provider to use.
 * @param {number}  [limit=20]         - Max results (1–50).
 * @returns {Promise<{ count: number, provider: string, results: PodcastResult[] }>}
 *
 * @example
 * const { results } = await searchPodcasts('technology', 'taddy', 10);
 */
export async function searchPodcasts(query, provider = 'itunes', limit = 20) {
  const params = new URLSearchParams({
    q: query,
    provider,
    limit: String(limit),
  });
  return apiFetch(`/api/v1/podcasts/search/?${params}`);
}

/**
 * Fetch hydrated podcast detail (iTunes base + Podchaser social enrichment).
 *
 * The detail is cached server-side under the slug key.
 *
 * @param {string} slug - URL-friendly podcast title (e.g. 'the-daily').
 * @returns {Promise<PodcastDetail>}
 *
 * @example
 * const detail = await getPodcastDetail('huberman-lab');
 */
export async function getPodcastDetail(slug) {
  return apiFetch(`/api/v1/podcasts/${encodeURIComponent(slug)}/`);
}

/**
 * Fetch guest and host credits from Podchaser for a given podcast slug.
 *
 * Returns an empty credits array (not an error) when Podchaser is
 * unconfigured or quota-exhausted, so the UI degrades gracefully.
 *
 * @param {string} slug - URL-friendly podcast title.
 * @returns {Promise<{ slug: string, provider: string, credits: Credit[] }>}
 *
 * @example
 * const { credits } = await getPodcastCredits('lex-fridman-podcast');
 */
export async function getPodcastCredits(slug) {
  return apiFetch(`/api/v1/podcasts/${encodeURIComponent(slug)}/credits/`);
}

// ---------------------------------------------------------------------------
// JSDoc type stubs (for IDE autocomplete — no TypeScript required)
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} PodcastResult
 * @property {string}  provider
 * @property {string}  remote_id
 * @property {string}  title
 * @property {string}  author
 * @property {string}  description
 * @property {string}  cover_url
 * @property {string}  rss_feed
 * @property {string}  genre
 * @property {number}  total_episodes
 * @property {number|null} rating
 * @property {Credit[]|null} credits
 * @property {string|null}  website
 */

/**
 * @typedef {PodcastResult} PodcastDetail
 */

/**
 * @typedef {Object} Credit
 * @property {{ id: string, name: string, imageUrl: string }} person
 * @property {{ title: string }} role
 * @property {{ id: string, title: string, airDate: string }} episode
 */
