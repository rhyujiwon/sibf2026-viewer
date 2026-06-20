import { $ } from './utils.js';
import { SEARCH_INDEX, boothNumIdx, favorites, memos } from './store.js';

const MAP_VBW = 3230, MAP_VBH = 3650;
let mScale = 1, mTx = 0, mTy = 0;
let mapReady = false, mapFavOnly = false;
const mClamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function applyMapTransform() {
  const layer = document.getElementById('map-zoomLayer');
  if (layer) layer.setAttribute('transform', `translate(${mTx},${mTy}) scale(${mScale})`);
}

export function syncMapOverlays() {
  document.querySelectorAll('#map-stage .map-star, #map-stage .map-memo-dot').forEach(el => el.remove());
  document.querySelectorAll('#map-stage .booth').forEach(el => {
    const idxList = boothNumIdx[el.dataset.booth] || [];
    const isFav   = idxList.some(i => !!favorites[String(i)]);
    const hasMemo = idxList.some(i => { const m = memos[String(i)] || {}; return !!(m.goods?.length || m.books?.length); });
    el.classList.toggle('map-fav',  isFav);
    el.classList.toggle('map-memo', hasMemo);
    el.classList.toggle('map-dim',  mapFavOnly && !isFav);

    const rect = el.querySelector('rect');
    if (!rect) return;
    const x = +rect.getAttribute('x'), y = +rect.getAttribute('y');
    const w = +rect.getAttribute('width');

    if (isFav) {
      const star = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      star.setAttribute('x', x + w - 3); star.setAttribute('y', y + 23);
      star.setAttribute('font-size', '22'); star.setAttribute('text-anchor', 'end');
      star.setAttribute('class', 'map-star'); star.setAttribute('pointer-events', 'none');
      star.textContent = '⭐';
      el.appendChild(star);
    }
    if (hasMemo) {
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', x + 11); dot.setAttribute('cy', y + 11); dot.setAttribute('r', '9');
      dot.setAttribute('fill', '#AAFF00'); dot.setAttribute('stroke', '#111'); dot.setAttribute('stroke-width', '1.5');
      dot.setAttribute('class', 'map-memo-dot'); dot.setAttribute('pointer-events', 'none');
      el.appendChild(dot);
    }
  });
}

export function initMap() {
  if (mapReady) return;
  mapReady = true;
  const stage = $('map-stage');
  let drag = false, lx = 0, ly = 0, didDrag = false;

  stage.addEventListener('pointerdown', e => {
    drag = true; lx = e.clientX; ly = e.clientY; didDrag = false;
    stage.classList.add('dragging');
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - lx, dy = e.clientY - ly;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag = true;
    const r = stage.getBoundingClientRect();
    const fit = Math.min(r.width / MAP_VBW, r.height / MAP_VBH);
    mTx += dx / fit; mTy += dy / fit;
    lx = e.clientX; ly = e.clientY;
    applyMapTransform();
  });
  stage.addEventListener('pointerup', e => {
    drag = false; stage.classList.remove('dragging');
    if (!didDrag) {
      const under = document.elementFromPoint(e.clientX, e.clientY);
      const booth = under && under.closest('.booth');
      if (booth) window.openBoothPanel(booth.dataset.booth);
    }
  });
  stage.addEventListener('pointercancel', () => { drag = false; stage.classList.remove('dragging'); });
  stage.addEventListener('pointerleave',  () => { drag = false; stage.classList.remove('dragging'); });
  stage.addEventListener('wheel', e => {
    e.preventDefault();
    const r = stage.getBoundingClientRect();
    const fit = Math.min(r.width / MAP_VBW, r.height / MAP_VBH);
    const svgX = (e.clientX - r.left) / fit;
    const svgY = (e.clientY - r.top)  / fit;
    const f  = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const ns = mClamp(mScale * f, 0.5, 14);
    mTx = svgX + (mTx - svgX) * (ns / mScale);
    mTy = svgY + (mTy - svgY) * (ns / mScale);
    mScale = ns;
    applyMapTransform();
  }, { passive: false });

  $('map-zoom-in').onclick    = () => { mScale = mClamp(mScale * 1.3, 0.5, 14); applyMapTransform(); };
  $('map-zoom-out').onclick   = () => { mScale = mClamp(mScale / 1.3, 0.5, 14); applyMapTransform(); };
  $('map-zoom-reset').onclick = () => { mScale = 1; mTx = 0; mTy = 0; applyMapTransform(); };

  /* Map search */
  const mInput   = $('map-search');
  const mResults = $('map-search-results');

  function normStr(s) { return (s || '').toLowerCase().replace(/\s+/g, ''); }

  mInput.addEventListener('input', () => {
    const q = normStr(mInput.value);
    document.querySelectorAll('#map-stage .booth').forEach(b => b.classList.remove('map-highlight', 'map-dim'));
    if (!q) { mResults.classList.remove('show'); mResults.innerHTML = ''; return; }
    const hits = SEARCH_INDEX.filter(it =>
      normStr(it.nameKo).includes(q) || normStr(it.nameEn).includes(q) || normStr(it.booth).includes(q)
    );
    if (!hits.length) {
      mResults.classList.add('show');
      mResults.innerHTML = '<div class="msr-item">검색 결과 없음</div>';
      return;
    }
    const hitBooths = new Set(hits.map(h => h.jumpBooth));
    document.querySelectorAll('#map-stage .booth').forEach(b => {
      b.classList.toggle('map-dim',       !hitBooths.has(b.dataset.booth));
      b.classList.toggle('map-highlight',  hitBooths.has(b.dataset.booth));
    });
    mResults.classList.add('show');
    mResults.innerHTML = hits.slice(0, 40).map(h =>
      `<div class="msr-item" data-cx="${h.cx}" data-cy="${h.cy}" data-booth="${h.jumpBooth}">
         <b>${h.nameKo || h.nameEn}</b>
         <span>${h.booth}${h.nameEn && h.nameKo ? ' · ' + h.nameEn : ''}</span>
       </div>`
    ).join('');

    mResults.querySelectorAll('.msr-item').forEach(item => {
      item.addEventListener('click', () => {
        const boothId = item.dataset.booth;
        mResults.classList.remove('show');
        mInput.value = '';
        document.querySelectorAll('#map-stage .booth').forEach(b => b.classList.remove('map-dim'));

        const boothEl = document.querySelector(`#map-stage .booth[data-booth="${CSS.escape(boothId)}"]`);
        let bCx = parseFloat(item.dataset.cx), bCy = parseFloat(item.dataset.cy);
        if (boothEl) {
          const rect = boothEl.querySelector('rect');
          if (rect) {
            bCx = +rect.getAttribute('x') + +rect.getAttribute('width')  / 2;
            bCy = +rect.getAttribute('y') + +rect.getAttribute('height') / 2;
          }
        }

        const fromTx = mTx, fromTy = mTy, fromS = mScale;
        const toTx = MAP_VBW / 2 - bCx * 4, toTy = MAP_VBH / 2 - bCy * 4, toS = 4;
        const dur = 420, t0 = performance.now();
        function ease(t) { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
        function animFrame(now) {
          const p = Math.min((now - t0) / dur, 1), e = ease(p);
          mScale = fromS + (toS - fromS) * e;
          mTx    = fromTx + (toTx - fromTx) * e;
          mTy    = fromTy + (toTy - fromTy) * e;
          applyMapTransform();
          if (p < 1) requestAnimationFrame(animFrame);
        }
        requestAnimationFrame(animFrame);

        if (boothEl) {
          boothEl.classList.add('map-highlight');
          setTimeout(() => boothEl.classList.remove('map-highlight'), 2000);
        }
      });
    });
  });

  document.addEventListener('click', e => {
    if (!$('map-search-wrap')?.contains(e.target)) mResults.classList.remove('show');
  });

  /* Custom hover tooltip */
  const mapTip  = document.getElementById('map-tooltip');
  const tipBooth = document.getElementById('map-tooltip-booth');
  const tipNames = document.getElementById('map-tooltip-names');
  let lastBoothEl = null, savedTitle = '';

  stage.addEventListener('pointermove', e => {
    if (drag) { mapTip.classList.remove('visible'); return; }
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('.booth');
    if (!el) {
      mapTip.classList.remove('visible');
      if (lastBoothEl) { const t = lastBoothEl.querySelector('title'); if (t) t.textContent = savedTitle; lastBoothEl = null; }
      return;
    }
    if (el !== lastBoothEl) {
      if (lastBoothEl) { const t = lastBoothEl.querySelector('title'); if (t) t.textContent = savedTitle; }
      const titleEl2 = el.querySelector('title');
      savedTitle = titleEl2 ? titleEl2.textContent : '';
      if (titleEl2) titleEl2.textContent = '';
      lastBoothEl = el;
    }
    if (!savedTitle) { mapTip.classList.remove('visible'); return; }
    const lines    = savedTitle.trim().split('\n').map(l => l.trim()).filter(Boolean);
    const boothNum = lines[0];
    const names    = lines.slice(1).map(l => l.replace(/^-\s*/, '').replace(/\s*\(.*?\)\s*$/, '').trim()).filter(Boolean);
    tipBooth.textContent = boothNum;
    tipNames.innerHTML   = names.map(n => `<span>${n}</span>`).join('');

    const margin = 12, tw = mapTip.offsetWidth || 220, th = mapTip.offsetHeight || 60;
    let tx = e.clientX + margin, ty = e.clientY + margin;
    if (tx + tw > window.innerWidth  - 8) tx = e.clientX - tw - margin;
    if (ty + th > window.innerHeight - 8) ty = e.clientY - th - margin;
    mapTip.style.left = tx + 'px';
    mapTip.style.top  = ty + 'px';
    mapTip.classList.add('visible');
  });

  stage.addEventListener('pointerleave', () => {
    mapTip.classList.remove('visible');
    if (lastBoothEl) { const t = lastBoothEl.querySelector('title'); if (t) t.textContent = savedTitle; lastBoothEl = null; }
  });
  stage.addEventListener('pointerdown', () => mapTip.classList.remove('visible'));

  applyMapTransform();
}

export function initMapEvents() {
  $('map-fav-toggle').addEventListener('click', () => {
    mapFavOnly = !mapFavOnly;
    $('map-fav-toggle').classList.toggle('active', mapFavOnly);
    syncMapOverlays();
  });
}
