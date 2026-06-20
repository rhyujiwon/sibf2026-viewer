import { $, esc } from './utils.js';
import { SNS } from './sns.js';
import { BOOTHS, favorites, memos, appState, saveFav } from './store.js';

export function filtered() {
  const q = appState.search.toLowerCase();
  return BOOTHS.filter(b => {
    if (q) {
      const m = memos[b._idx] || {};
      const books = (m.books || []).join(' ');
      const goods = (m.goods || []).map(g => g.name + ' ' + g.price).join(' ');
      const hit = (b['참가사명'] || '').toLowerCase().includes(q)
               || (b['부스번호'] || '').toLowerCase().includes(q)
               || (b['출판분야'] || '').toLowerCase().includes(q)
               || books.toLowerCase().includes(q)
               || goods.toLowerCase().includes(q);
      if (!hit) return false;
    }
    switch (appState.filter) {
      case 'favorites':  return !!favorites[b._idx];
      case 'memo': { const m = memos[b._idx]; return !!(m && ((m.goods || []).length || (m.books || []).length)); }
      case 'instagram':  return !!b['인스타그램'];
      case 'twitter':    return !!b['X(트위터)'];
      case 'facebook':   return !!b['페이스북'];
      case 'youtube':    return !!b['유튜브'];
      case 'blog':       return !!(b['네이버블로그'] || b['네이버포스트']);
      default:           return true;
    }
  });
}

export function card(b) {
  const idx    = b._idx;
  const fav    = !!favorites[idx];
  const m      = memos[idx] || {};
  const mGoods = m.goods || [];
  const mBooks = m.books || [];
  const hasMemo = mGoods.length || mBooks.length;

  const badges = SNS.filter(s => b[s.key]).map(s =>
    `<button class="sns-badge" data-action="sns" data-idx="${idx}" data-key="${s.key}">${s.icon} ${s.label}</button>`
  ).join('');

  const tel  = b['전화번호'];
  const hp   = b['홈페이지'];
  const cats = (b['출판분야'] || '').split(/[,\/]/).map(s => s.trim()).filter(Boolean);

  const goodsSnip = mGoods.length ? `
    <div style="border-left:3px solid #AAFF00;background:#fafafa;padding:8px 10px;margin-top:8px;">
      <p style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin:0 0 4px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> 굿즈</p>
      ${mGoods.map(g => `<p class="clamp1" style="font-size:12px;color:#333;margin:2px 0;">· ${esc(g.name)}${g.price ? ` <span style="color:#555;">(${esc(g.price)})</span>` : ''} </p>`).join('')}
    </div>` : '';

  const booksSnip = mBooks.length ? `
    <div style="border-left:3px solid #0d0d0d;background:#fafafa;padding:8px 10px;margin-top:8px;">
      <p style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin:0 0 4px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg> 관심도서</p>
      ${mBooks.map(t => `<p class="clamp1" style="font-size:12px;color:#333;margin:2px 0;">· ${esc(t)}</p>`).join('')}
    </div>` : '';

  return `
  <div class="card" style="padding:16px;display:flex;flex-direction:column;gap:0;">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:10px;">
      <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;min-width:0;">
        <span style="font-size:11px;font-weight:700;font-family:monospace;background:#AAFF00;color:#0d0d0d;padding:2px 7px;border-radius:4px;flex-shrink:0;letter-spacing:.01em;">${esc(b['부스번호'] || '-')}</span>
        ${cats.slice(0, 2).map(c => `<span style="font-size:11px;font-weight:500;border:1px solid #0d0d0d;color:#0d0d0d;padding:1px 6px;border-radius:4px;white-space:nowrap;">${esc(c)}</span>`).join('')}
      </div>
      <button data-action="fav" data-idx="${idx}"
              style="flex-shrink:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:18px;background:none;border:none;cursor:pointer;color:${fav ? '#AAFF00' : '#d1d5db'};transition:color .15s;line-height:1;-webkit-text-stroke:${fav ? '0' : '1px #ccc'};"
              aria-label="${fav ? '즐겨찾기 해제' : '즐겨찾기 추가'}">★</button>
    </div>

    <h2 style="font-size:16px;font-weight:800;letter-spacing:-0.02em;color:#0d0d0d;margin:0 0 8px;line-height:1.3;">${esc(b['참가사명'] || '')}</h2>

    <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:2px;">
      ${tel ? `<a href="tel:${esc(tel)}" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#666;text-decoration:none;" onmouseover="this.style.color='#0d0d0d'" onmouseout="this.style.color='#666'"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;opacity:.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.65A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 15z"/></svg>${esc(tel)}</a>` : ''}
      ${hp ? `<a href="${hp.startsWith('http') ? hp : 'https://' + hp}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#666;text-decoration:none;" onmouseover="this.style.color='#0d0d0d'" onmouseout="this.style.color='#666'"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;opacity:.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>홈페이지 방문</a>` : ''}
    </div>

    ${badges ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;">${badges}</div>` : ''}

    ${goodsSnip}${booksSnip}

    <button data-action="memo" data-idx="${idx}"
            style="margin-top:12px;width:100%;text-align:left;font-size:11px;color:#999;display:flex;align-items:center;gap:6px;padding:8px 10px;border:1.5px dashed #e8e8e8;border-radius:6px;background:transparent;cursor:pointer;transition:border-color .15s,color .15s;"
            onmouseover="this.style.borderColor='#0d0d0d';this.style.color='#0d0d0d'"
            onmouseout="this.style.borderColor='#e8e8e8';this.style.color='#999'">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;opacity:.4"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> ${hasMemo ? '메모 수정' : '메모 추가'}
    </button>
  </div>`;
}

export function render() {
  const list = filtered();
  $('count-badge').textContent = `${list.length}개`;
  if (!list.length) {
    $('grid').innerHTML = '';
    $('empty').classList.remove('hidden');
  } else {
    $('empty').classList.add('hidden');
    $('grid').innerHTML = list.map(card).join('');
  }
}

export function initListEvents() {
  $('grid').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, idx, key } = btn.dataset;
    const booth = BOOTHS[parseInt(idx)];
    if (!booth) return;

    if (action === 'fav') {
      favorites[idx] = !favorites[idx];
      if (!favorites[idx]) delete favorites[idx];
      saveFav();
      render();
    } else if (action === 'memo') {
      window.openMemo(booth);
    } else if (action === 'sns') {
      window.open(booth[key], '_blank', 'noopener');
    }
  });

  $('search-input').addEventListener('input', e => {
    appState.search = e.target.value;
    render();
  });

  $('filter-bar').addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    appState.filter = btn.dataset.filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    render();
  });

  const wrap = document.querySelector('.filter-fade');
  function updateMask() {
    const atEnd = wrap.scrollLeft + wrap.clientWidth >= wrap.scrollWidth - 4;
    const mask = atEnd ? 'none' : 'linear-gradient(to right, black calc(100% - 48px), transparent 100%)';
    wrap.style.webkitMaskImage = mask;
    wrap.style.maskImage = mask;
  }
  wrap.addEventListener('scroll', updateMask);
  updateMask();
}
