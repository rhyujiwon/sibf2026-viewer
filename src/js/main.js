import '../styles/main.css';
import { $ } from './utils.js';
import { BOOTHS, SEARCH_INDEX, boothNumIdx } from './store.js';
import { render, initListEvents } from './list.js';
import { openMemo, initMemoEvents } from './memo.js';
import { applyMapTransform, initMap, syncMapOverlays, initMapEvents } from './map.js';
import { openBoothPanel, closeBoothPanel, initModalEvents } from './modal.js';

/* Expose globals needed by inline event handlers */
window.openMemo       = openMemo;
window.openBoothPanel = openBoothPanel;
window.closeBoothPanel = closeBoothPanel;
window.BOOTHS         = BOOTHS;
window.SEARCH_INDEX   = SEARCH_INDEX;
window.syncMapOverlays = syncMapOverlays;

/* Build boothNumIdx from BOOTHS data */
BOOTHS.forEach((b, i) => {
  const num = b['부스번호'];
  if (!boothNumIdx[num]) boothNumIdx[num] = [];
  boothNumIdx[num].push(i);
});

/* Tab switching */
function switchTab(tab) {
  const isMap = tab === 'map';
  document.querySelector('main').style.display    = isMap ? 'none' : '';
  document.getElementById('map-view').style.display = isMap ? 'flex' : 'none';
  document.querySelectorAll('.view-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  if (isMap) {
    /* Load SVG if not yet loaded */
    const stage = $('map-stage');
    if (!stage.querySelector('svg')) {
      fetch('/floormap.svg')
        .then(r => r.text())
        .then(svgText => {
          stage.insertAdjacentHTML('afterbegin', svgText);
          syncMapOverlays();
          initMap();
          applyMapTransform();
        });
    } else {
      syncMapOverlays();
      initMap();
    }
  }
}

document.getElementById('tab-bar').addEventListener('click', e => {
  const btn = e.target.closest('.view-tab');
  if (btn) switchTab(btn.dataset.tab);
});

/* Initialise */
initListEvents();
initMemoEvents();
initMapEvents();
initModalEvents();
render();
