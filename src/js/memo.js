import { $, esc } from './utils.js';
import { memoState, memos, saveMemo } from './store.js';
import { render } from './list.js';

const FIELD_CLS = 'field';

function collectDrafts() {
  memoState.draftGoods = memoState.draftGoods.map((_, i) => ({
    name:  (document.querySelector(`[data-goods-name="${i}"]`)?.value || '').trim(),
    price: (document.querySelector(`[data-goods-price="${i}"]`)?.value || '').trim(),
  }));
  memoState.draftBooks = memoState.draftBooks.map((_, i) =>
    (document.querySelector(`[data-book-idx="${i}"]`)?.value || '').trim()
  );
}

export function renderMemoBody() {
  const goodsRows = memoState.draftGoods.map((g, i) => `
    <div class="flex gap-2 items-center">
      <input type="text" value="${esc(g.name)}" placeholder="굿즈 이름"
             class="${FIELD_CLS} amber flex-1 min-w-0" data-goods-name="${i}">
      <input type="text" value="${esc(g.price)}" placeholder="가격"
             class="${FIELD_CLS} amber w-24 flex-shrink-0" data-goods-price="${i}">
      <button data-memo-action="del-goods" data-idx="${i}"
              class="flex-shrink-0 w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-400 active:text-red-500 rounded-lg transition text-base">✕</button>
    </div>`).join('');

  const bookRows = memoState.draftBooks.map((bk, i) => `
    <div class="flex gap-2 items-center">
      <input type="text" value="${esc(bk)}" placeholder="책 제목을 입력하세요"
             class="${FIELD_CLS} flex-1 min-w-0" data-book-idx="${i}">
      <button data-memo-action="del-book" data-idx="${i}"
              class="flex-shrink-0 w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-400 active:text-red-500 rounded-lg transition text-base">✕</button>
    </div>`).join('');

  $('memo-body').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:8px;">
      <p style="font-size:13px;font-weight:700;color:#0d0d0d;display:flex;align-items:center;gap:5px;border-left:3px solid #AAFF00;padding-left:8px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> 굿즈</p>
      <div id="goods-list" style="display:flex;flex-direction:column;gap:6px;">${goodsRows}</div>
      <button data-memo-action="add-goods"
              style="font-size:12px;color:#666;background:none;border:none;cursor:pointer;text-align:left;padding:2px 0;font-weight:500;transition:color .15s;"
              onmouseover="this.style.color='#0d0d0d'" onmouseout="this.style.color='#666'">
        + 굿즈 추가
      </button>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      <p style="font-size:13px;font-weight:700;color:#0d0d0d;display:flex;align-items:center;gap:5px;border-left:3px solid #0d0d0d;padding-left:8px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg> 관심 도서</p>
      <div id="books-list" style="display:flex;flex-direction:column;gap:6px;">${bookRows}</div>
      <button data-memo-action="add-book"
              style="font-size:12px;color:#666;background:none;border:none;cursor:pointer;text-align:left;padding:2px 0;font-weight:500;transition:color .15s;"
              onmouseover="this.style.color='#0d0d0d'" onmouseout="this.style.color='#666'">
        + 도서 추가
      </button>
    </div>`;

  $('memo-body').addEventListener('click', e => {
    const btn = e.target.closest('[data-memo-action]');
    if (!btn) return;
    collectDrafts();
    const action = btn.dataset.memoAction;
    const i = parseInt(btn.dataset.idx);
    if (action === 'add-goods')  { memoState.draftGoods.push({ name: '', price: '' }); }
    if (action === 'del-goods')  { memoState.draftGoods.splice(i, 1); }
    if (action === 'add-book')   { memoState.draftBooks.push(''); }
    if (action === 'del-book')   { memoState.draftBooks.splice(i, 1); }
    renderMemoBody();
  }, { once: true });
}

export function openMemo(b) {
  memoState.target = String(b._idx);
  $('memo-title').textContent    = b['참가사명'];
  $('memo-subtitle').textContent = '부스 ' + b['부스번호'];
  const m = memos[memoState.target] || {};
  memoState.draftGoods = (m.goods || []).map(g => ({ ...g }));
  memoState.draftBooks = (m.books && m.books.length) ? [...m.books] : [''];
  renderMemoBody();
  $('memo-overlay').classList.remove('hidden');
  setTimeout(() => document.querySelector('[data-book-idx="0"]')?.focus(), 60);
}

export function closeMemo() {
  $('memo-overlay').classList.add('hidden');
  memoState.target = null;
}

function saveMemoData() {
  collectDrafts();
  const validGoods = memoState.draftGoods.filter(g => g.name || g.price);
  const validBooks = memoState.draftBooks.filter(s => s);
  if (validGoods.length || validBooks.length) {
    memos[memoState.target] = { goods: validGoods, books: validBooks };
  } else {
    delete memos[memoState.target];
  }
  saveMemo();
  closeMemo();
  render();
}

export function initMemoEvents() {
  $('memo-save-btn').onclick   = saveMemoData;
  $('memo-cancel-btn').onclick = closeMemo;
  $('memo-close-btn').onclick  = closeMemo;
  $('memo-overlay').addEventListener('click', e => {
    if (e.target === $('memo-overlay')) closeMemo();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMemo();
  });
}
