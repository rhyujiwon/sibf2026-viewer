export const $ = id => document.getElementById(id);
export const isMobile = () => window.innerWidth < 640;
export const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function username(url) {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url);
    return u.pathname.split('/').filter(Boolean)[0] || null;
  } catch { return null; }
}
