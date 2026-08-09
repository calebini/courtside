import 'server-only';

export function isRegistrationOpen() {
  return process.env.COURTSIDE_REGISTRATION_MODE === 'open';
}

export function getCourtsideSiteUrl() {
  const configured = process.env.COURTSIDE_SITE_URL;
  if (!configured) {
    throw new Error('COURTSIDE_SITE_URL is required for authentication email redirects');
  }
  const url = new URL(configured);
  if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.username || url.password) {
    throw new Error('COURTSIDE_SITE_URL must use HTTP or HTTPS');
  }
  url.pathname = '/';
  url.search = '';
  url.hash = '';
  return url;
}
