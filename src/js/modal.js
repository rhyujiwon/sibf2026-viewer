import { $, esc } from './utils.js';
import { SNS } from './sns.js';
import { BOOTHS, boothNumIdx, favorites, memos, saveFav } from './store.js';
import { render } from './list.js';
import { syncMapOverlays } from './map.js';
import { openMemo } from './memo.js';

let bpCurrentIdx  = null;
let bpBoothNum    = null;
let bmBodyAbort   = new AbortController();

const heartSVG = filled =>
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

export function openBoothPanel(boothNum) {
  bpBoothNum = boothNum;
  const idxList = boothNumIdx[boothNum] || [];
  if (idxList.length === 0) {
    bpCurrentIdx = null;
    $('bm-tags').innerHTML      = `<span class="bm-tag-booth">${boothNum}</span>`;
    $('bm-name').textContent    = '정보 없음';
    $('bm-phone').innerHTML     = '';
    $('bm-body').innerHTML      = '<p style="font-size:13px;color:#94a3b8;text-align:center;padding:32px 0;">참가사 정보가 없습니다.</p>';
    $('bm-fav-btn').innerHTML = heartSVG(false);
    $('bm-fav-btn').className   = '';
    $('bm-fav-btn').onclick     = null;
    $('bm-fav-btn').style.display = '';
    $('bm-back-btn').style.display = 'none';
    showBP(); return;
  }
  if (idxList.length === 1) {
    bpCurrentIdx = idxList[0];
    $('bm-back-btn').style.display = 'none';
    renderBoothPanel(idxList[0]);
  } else {
    bpCurrentIdx = null;
    $('bm-back-btn').style.display = 'none';
    renderBoothList(boothNum, idxList);
  }
  showBP();
}

export function renderBoothList(boothNum, idxList) {
  $('bm-tags').innerHTML  = `<span class="bm-tag-booth">${boothNum}</span>`;
  $('bm-name').textContent = `${idxList.length}개 참가사`;
  $('bm-phone').innerHTML  = '';
  $('bm-fav-btn').style.display = 'none';

  $('bm-body').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${idxList.map(idx => {
        const b       = BOOTHS[idx];
        const isFav   = !!favorites[String(idx)];
        const m       = memos[String(idx)] || {};
        const hasMemo = !!(m.goods?.length || m.books?.length);
        return `<button
          data-action="select-exhibitor" data-idx="${idx}"
          style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border:1.5px solid #e8e8e8;border-radius:10px;background:#fff;cursor:pointer;text-align:left;width:100%;transition:border-color .15s;"
          onmouseover="this.style.borderColor='#0d0d0d'" onmouseout="this.style.borderColor='#e8e8e8'">
          <div style="display:flex;flex-direction:column;gap:3px;min-width:0;flex:1;">
            <span style="font-size:15px;font-weight:700;color:#0d0d0d;word-break:keep-all;">${esc(b['참가사명'])}</span>
            ${b['출판분야'] ? `<span style="font-size:11px;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(b['출판분야'])}</span>` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;margin-left:10px;">
            ${isFav   ? '<span style="color:#AAFF00;font-size:15px;line-height:1;">★</span>' : ''}
            ${hasMemo ? '<span style="width:6px;height:6px;border-radius:50%;background:#AAFF00;display:inline-block;"></span>' : ''}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </button>`;
      }).join('')}
    </div>`;

  bmBodyAbort.abort();
  bmBodyAbort = new AbortController();
  $('bm-body').addEventListener('click', e => {
    const btn = e.target.closest('[data-action="select-exhibitor"]');
    if (!btn) return;
    const idx = parseInt(btn.dataset.idx);
    bpCurrentIdx = idx;
    $('bm-back-btn').style.display = 'flex';
    $('bm-fav-btn').style.display  = '';
    renderBoothPanel(idx);
  }, { signal: bmBodyAbort.signal });
}

export function renderBoothPanel(idx) {
  const b     = BOOTHS[idx];
  const m     = memos[String(idx)] || {};
  const isFav = !!favorites[String(idx)];
  const goods = m.goods || [];
  const books = m.books || [];

  const cats = (b['출판분야'] || '').split(/[,\/]/).map(s => s.trim()).filter(Boolean);
  $('bm-tags').innerHTML =
    `<span class="bm-tag-booth">${b['부스번호']}</span>` +
    cats.map(c => `<span class="bm-tag-cat">${esc(c)}</span>`).join('');
  $('bm-name').textContent = b['참가사명'] || '';

  if (b['전화번호']) {
    $('bm-phone').innerHTML = `<a href="tel:${esc(b['전화번호'])}" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#666;text-decoration:none;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;opacity:.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.65A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 15z"/></svg>${esc(b['전화번호'])}</a>`;
  } else {
    $('bm-phone').innerHTML = '';
  }

  const favBtn = $('bm-fav-btn');
  favBtn.innerHTML  = heartSVG(isFav);
  favBtn.className   = isFav ? 'is-fav' : '';
  favBtn.onclick     = () => toggleMapFav(idx);

  const hp = b['홈페이지'];
  const hpHtml = hp ? `<div><a class="bm-hp-link" href="${hp.startsWith('http') ? hp : 'https://' + hp}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;opacity:.6"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> 홈페이지 방문 ↗</a></div>` : '';

  const snsLinks = SNS.filter(s => b[s.key]);
  const snsHtml  = snsLinks.length ? `
    <div>
      <p style="font-size:11px;font-weight:600;color:#94a3b8;margin:0 0 7px;letter-spacing:.04em;">SNS / 링크</p>
      <div class="bm-sns-row">
        ${snsLinks.map(s => `
          <button data-sns-key="${s.key}" data-booth-idx="${idx}"
            style="display:inline-flex;align-items:center;gap:5px;padding:7px 12px;border-radius:10px;font-size:12px;font-weight:500;border:1px solid;cursor:pointer;"
            class="sns-badge ${s.color}">${s.icon} ${s.label}</button>`).join('')}
      </div>
    </div>` : '';

  const goodsHtml = goods.length ? `
    <div class="bm-memo-box goods">
      <p class="bm-memo-title goods"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> 굿즈 메모</p>
      ${goods.map(g => `<p class="bm-memo-item goods">· ${esc(g.name)}${g.price ? ` <span style="color:#d97706;">${esc(g.price)}</span>` : ''}</p>`).join('')}
    </div>` : '';

  const booksHtml = books.length ? `
    <div class="bm-memo-box books">
      <p class="bm-memo-title books"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg> 관심 도서</p>
      ${books.map(t => `<p class="bm-memo-item books">· ${esc(t)}</p>`).join('')}
    </div>` : '';

  const memoLabel = (goods.length || books.length) ? '' :
    `<p style="font-size:12px;color:#94a3b8;margin:0;text-align:center;padding:4px 0;">메모 없음</p>`;

  $('bm-body').innerHTML =
    (hpHtml || '') +
    (snsHtml || '') +
    `<div>
      <p style="font-size:11px;font-weight:600;color:#94a3b8;margin:0 0 7px;letter-spacing:.04em;">메모</p>
      ${memoLabel}${goodsHtml}${booksHtml}
    </div>
    <button id="bm-edit-btn" data-action="edit-memo" data-idx="${idx}">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;opacity:.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> ${(goods.length || books.length) ? '메모 수정' : '메모 추가'}
    </button>`;

  bmBodyAbort.abort();
  bmBodyAbort = new AbortController();
  $('bm-body').addEventListener('click', e => {
    const editBtn = e.target.closest('[data-action="edit-memo"]');
    if (editBtn) { openMemo(BOOTHS[parseInt(editBtn.dataset.idx)]); closeBoothPanel(); return; }
    const snsBtn = e.target.closest('[data-sns-key]');
    if (snsBtn) { window.open(BOOTHS[parseInt(snsBtn.dataset.boothIdx)][snsBtn.dataset.snsKey], '_blank', 'noopener'); }
  }, { signal: bmBodyAbort.signal });
}

export function toggleMapFav(idx) {
  const key = String(idx);
  if (favorites[key]) { delete favorites[key]; } else { favorites[key] = true; }
  saveFav();
  render();
  renderBoothPanel(idx);
  syncMapOverlays();
}

export function showBP() {
  $('booth-modal-overlay').style.display = 'block';
  $('booth-modal').classList.add('bm-open');
  document.body.style.overflow = 'hidden';
}

export function closeBoothPanel() {
  $('booth-modal-overlay').style.display = 'none';
  $('booth-modal').classList.remove('bm-open');
  document.body.style.overflow = '';
}

export function initModalEvents() {
  $('bm-close-btn').addEventListener('click', closeBoothPanel);
  $('bm-back-btn').addEventListener('click', () => {
    const idxList = boothNumIdx[bpBoothNum] || [];
    bpCurrentIdx = null;
    $('bm-back-btn').style.display = 'none';
    $('bm-fav-btn').style.display  = 'none';
    renderBoothList(bpBoothNum, idxList);
  });
  $('booth-modal-overlay').addEventListener('click', closeBoothPanel);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeBoothPanel(); });
}
