import boothsRaw from '../data/booths.json';
import searchIndexRaw from '../data/searchIndex.json';

export const BOOTHS = boothsRaw.map((b, i) => ({ ...b, _idx: i }));
export const SEARCH_INDEX = searchIndexRaw;

export const boothNumIdx = {};

export const favorites = JSON.parse(localStorage.getItem('sibf_fav') || '{}');
export const memos = JSON.parse(localStorage.getItem('sibf_memo') || '{}');

export const appState = { search: '', filter: 'all' };

export const memoState = { target: null, draftGoods: [], draftBooks: [] };

export function saveFav() {
  localStorage.setItem('sibf_fav', JSON.stringify(favorites));
}

export function saveMemo() {
  localStorage.setItem('sibf_memo', JSON.stringify(memos));
}
