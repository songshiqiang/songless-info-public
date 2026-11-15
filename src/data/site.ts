// Site-wide facts shown on the About, Contact, Privacy and Terms pages.
//
// Anything that belongs to whoever runs the site (contact address, donation and
// community links, analytics) comes from environment variables, so a fork does
// not inherit the maintainer's accounts. Copy `.env.example` to `.env` and fill
// in what you want; anything left empty is hidden from the pages instead of
// rendering a dead link.

/** Where the contact links point. */
export const CONTACT_EMAIL = import.meta.env.PUBLIC_CONTACT_EMAIL || 'contact@songless.info';
/** Header "Buy me a coffee" button. Hidden when empty. */
export const COFFEE_URL = import.meta.env.PUBLIC_COFFEE_URL || '';
/** Footer Discord link. Hidden when empty. */
export const DISCORD_URL = import.meta.env.PUBLIC_DISCORD_URL || '';
/** Self-hosted Umami: set both to load the analytics script, leave both empty for none. */
export const UMAMI_SRC = import.meta.env.PUBLIC_UMAMI_SRC || '';
export const UMAMI_WEBSITE_ID = import.meta.env.PUBLIC_UMAMI_WEBSITE_ID || '';
// Bump when the Privacy Policy or Terms change. Each page shows it in its own language.
export const LEGAL_UPDATED = '2026-11-15';
