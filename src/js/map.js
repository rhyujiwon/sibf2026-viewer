import { $ } from './utils.js';
import { SEARCH_INDEX, boothNumIdx, favorites, memos } from './store.js';

const MAP_VBW = 3230, MAP_VBH = 3650;
let mScale = 1, mTx = 0, mTy = 0;
let mapReady = false, mapFavOnly = false, mapMemoOnly = false;
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
    el.classList.toggle('map-dim',  (mapFavOnly && !isFav) || (mapMemoOnly && !hasMemo));

    const rect = el.querySelector('rect');
    if (!rect) return;
    const x = +rect.getAttribute('x'), y = +rect.getAttribute('y');
    const w = +rect.getAttribute('width');

    if (isFav) {
      const size = 14, scale = size / 24;
      const heart = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      heart.setAttribute('d', 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z');
      heart.setAttribute('fill', '#f43f5e');
      heart.setAttribute('stroke', '#fff');
      heart.setAttribute('stroke-width', String(+(2 / scale).toFixed(1)));
      heart.setAttribute('stroke-linecap', 'round');
      heart.setAttribute('stroke-linejoin', 'round');
      heart.setAttribute('transform', `translate(${x + w - size - 3},${y + 4}) scale(${scale})`);
      heart.setAttribute('class', 'map-star');
      heart.setAttribute('pointer-events', 'none');
      el.appendChild(heart);
    }
    if (hasMemo) {
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', x + 8); dot.setAttribute('cy', y + 8); dot.setAttribute('r', '6');
      dot.setAttribute('fill', '#AAFF00'); dot.setAttribute('stroke', '#fff'); dot.setAttribute('stroke-width', '2');
      dot.setAttribute('class', 'map-memo-dot'); dot.setAttribute('pointer-events', 'none');
      el.appendChild(dot);
    }
  });
}

export function initMap() {
  if (mapReady) return;
  mapReady = true;
  const stage = $('map-stage');

  /* ── 멀티터치 상태 추적 ── */
  const ptrs = new Map(); // pointerId → {x, y}
  let drag = false, lx = 0, ly = 0, didDrag = false;

  function fit() {
    const r = stage.getBoundingClientRect();
    return Math.min(r.width / MAP_VBW, r.height / MAP_VBH);
  }

  stage.addEventListener('pointerdown', e => {
    stage.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (ptrs.size === 1) {
      drag = true; lx = e.clientX; ly = e.clientY; didDrag = false;
      stage.classList.add('dragging');
    } else {
      // 두 번째 손가락 → 핀치 모드 전환
      drag = false; didDrag = true;
      stage.classList.remove('dragging');
    }
  });

  stage.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return;

    if (ptrs.size >= 2) {
      // ── 핀치줌 + 패닝 ──
      const prevPts = [...ptrs.values()];
      const prevDist = Math.hypot(prevPts[0].x - prevPts[1].x, prevPts[0].y - prevPts[1].y);
      const prevMidX = (prevPts[0].x + prevPts[1].x) / 2;
      const prevMidY = (prevPts[0].y + prevPts[1].y) / 2;

      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });

      const newPts = [...ptrs.values()];
      const newDist = Math.hypot(newPts[0].x - newPts[1].x, newPts[0].y - newPts[1].y);
      const newMidX = (newPts[0].x + newPts[1].x) / 2;
      const newMidY = (newPts[0].y + newPts[1].y) / 2;

      if (prevDist > 0 && newDist > 0) {
        const f = fit();
        const r = stage.getBoundingClientRect();
        const svgMidX = (prevMidX - r.left) / f;
        const svgMidY = (prevMidY - r.top)  / f;
        const ns = mClamp(mScale * (newDist / prevDist), 0.5, 14);
        mTx = svgMidX + (mTx - svgMidX) * (ns / mScale);
        mTy = svgMidY + (mTy - svgMidY) * (ns / mScale);
        mScale = ns;
        // 두 손가락 중점 이동만큼 패닝
        mTx += (newMidX - prevMidX) / f;
        mTy += (newMidY - prevMidY) / f;
        applyMapTransform();
      }
    } else if (drag) {
      // ── 단일 손가락 드래그 ──
      const dx = e.clientX - lx, dy = e.clientY - ly;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag = true;
      mTx += dx / fit(); mTy += dy / fit();
      lx = e.clientX; ly = e.clientY;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      applyMapTransform();
    }
  });

  function endPointer(e) {
    const hadTwo = ptrs.size === 2;
    ptrs.delete(e.pointerId);

    if (ptrs.size === 0) {
      stage.classList.remove('dragging');
      drag = false;
      if (!didDrag && e.type === 'pointerup') {
        const under = document.elementFromPoint(e.clientX, e.clientY);
        const booth = under && under.closest('.booth');
        if (booth) window.openBoothPanel(booth.dataset.booth);
      }
    } else if (ptrs.size === 1 && hadTwo) {
      // 핀치 → 단일 손가락으로 전환: 드래그 재개
      const [, pos] = [...ptrs.entries()][0];
      drag = true; lx = pos.x; ly = pos.y;
      didDrag = true; // 전환 후 실수로 부스 열리지 않게
      stage.classList.add('dragging');
    }
  }

  stage.addEventListener('pointerup',     endPointer);
  stage.addEventListener('pointercancel', endPointer);
  stage.addEventListener('pointerleave',  endPointer);
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
    if (drag || ptrs.size >= 2) { mapTip.classList.remove('visible'); return; }
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
  $('map-memo-toggle').addEventListener('click', () => {
    mapMemoOnly = !mapMemoOnly;
    $('map-memo-toggle').classList.toggle('active', mapMemoOnly);
    syncMapOverlays();
  });
}
