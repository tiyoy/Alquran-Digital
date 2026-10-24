import { fallbackSurahs } from './data';

export const VERSE_COLLECTIONS_STORAGE_KEY = 'aq:verse-collections';
export const MAX_VERSE_COLLECTIONS = 50;
export const MAX_VERSES_PER_COLLECTION = 6236;
export const COLLECTION_NAME_MAX_LENGTH = 48;
export const COLLECTION_DESCRIPTION_MAX_LENGTH = 240;

export const VERSE_COLLECTION_COLORS = Object.freeze([
  { value: 'emerald', label: 'Hijau', hex: '#0b8f64' },
  { value: 'teal', label: 'Toska', hex: '#0d9488' },
  { value: 'gold', label: 'Emas', hex: '#c18b2c' },
  { value: 'blue', label: 'Biru', hex: '#3979c7' },
  { value: 'purple', label: 'Ungu', hex: '#8764c5' },
  { value: 'rose', label: 'Merah muda', hex: '#cf6682' }
]);

const COLOR_VALUES = new Set(VERSE_COLLECTION_COLORS.map((color) => color.value));
const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isInt = (value, min, max) => Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max;

export function isValidVerseKey(key) {
  const match = /^(\d{1,3}):(\d{1,3})$/.exec(String(key || ''));
  if (!match || !isInt(match[1], 1, 114) || !isInt(match[2], 1, 286)) return false;
  const surahNumber = Number(match[1]);
  const verseNumber = Number(match[2]);
  const maximumVerse = Number(fallbackSurahs[surahNumber - 1]?.jumlahAyat || 0);
  return maximumVerse > 0 && verseNumber <= maximumVerse;
}

export function normalizeVerseCollections(value) {
  if (!Array.isArray(value)) return [];
  const ids = new Set();
  const result = [];
  for (const item of value) {
    if (!isRecord(item) || result.length >= MAX_VERSE_COLLECTIONS) continue;
    const id = String(item.id || '').trim();
    const name = typeof item.name === 'string' ? item.name.trim().slice(0, COLLECTION_NAME_MAX_LENGTH) : '';
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id) || ids.has(id) || !name) continue;
    if (!Array.isArray(item.verseKeys) || item.verseKeys.length > MAX_VERSES_PER_COLLECTION || item.verseKeys.some((key) => !isValidVerseKey(key))) continue;
    const description = typeof item.description === 'string' ? item.description.trim().slice(0, COLLECTION_DESCRIPTION_MAX_LENGTH) : '';
    const verseKeys = [...new Set(item.verseKeys.map(String))];
    const createdAt = Number.isFinite(Number(item.createdAt)) ? Math.max(0, Number(item.createdAt)) : 0;
    const updatedAt = Number.isFinite(Number(item.updatedAt)) ? Math.max(createdAt, Number(item.updatedAt)) : createdAt;
    result.push({
      id,
      name,
      description,
      color: COLOR_VALUES.has(item.color) ? item.color : 'emerald',
      verseKeys,
      createdAt,
      updatedAt
    });
    ids.add(id);
  }
  return result;
}

/** Strict validation for importing backups: any malformed folder makes this category invalid. */
export function validateVerseCollections(value) {
  if (!Array.isArray(value) || value.length > MAX_VERSE_COLLECTIONS) return null;
  const normalized = normalizeVerseCollections(value);
  if (normalized.length !== value.length) return null;
  return normalized;
}

export function createVerseCollectionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return `vc-${crypto.randomUUID()}`;
  return `vc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function toggleVerseKeyInCollection(collection, verseKey, updatedAt = Date.now()) {
  if (!collection || !isValidVerseKey(verseKey) || !Array.isArray(collection.verseKeys)) return collection;
  const key = String(verseKey);
  const exists = collection.verseKeys.includes(key);
  if (!exists && collection.verseKeys.length >= MAX_VERSES_PER_COLLECTION) return collection;
  return {
    ...collection,
    verseKeys: exists ? collection.verseKeys.filter((item) => item !== key) : [...collection.verseKeys, key],
    updatedAt
  };
}
