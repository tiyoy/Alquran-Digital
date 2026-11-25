import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TAJWID_RULES,
  getTajwidRuleById,
  parseTajwidSegments,
} from '../src/lib/tajwid.js';

test('every TAJWID_RULES entry provides jenis, hukum, caraBaca, and tempo and can be looked up by id', () => {
  assert.ok(TAJWID_RULES.length >= 7);
  for (const rule of TAJWID_RULES) {
    assert.ok(rule.jenis && rule.jenis.length > 3, `missing jenis for ${rule.id}`);
    assert.ok(rule.hukum && rule.hukum.length > 3, `missing hukum for ${rule.id}`);
    assert.ok(rule.caraBaca && rule.caraBaca.length > 10, `missing caraBaca for ${rule.id}`);
    assert.ok(rule.tempo && rule.tempo.length > 2, `missing tempo for ${rule.id}`);
    assert.equal(getTajwidRuleById(rule.id)?.id, rule.id);
  }
  assert.equal(getTajwidRuleById('nonexistent'), null);
});

test('parseTajwidSegments preserves exact Arabic text and attaches contextual jenis/hukum/caraBaca details', () => {
  const sampleIkhfa = 'مِنْ قَبْلُ';
  const segsIkhfa = parseTajwidSegments(sampleIkhfa);
  assert.equal(segsIkhfa.map((s) => s.text).join(''), sampleIkhfa);

  const ikhfaSeg = segsIkhfa.find((s) => s.rule === 'ikhfa');
  assert.ok(ikhfaSeg, 'should detect ikhfa segment');
  assert.equal(ikhfaSeg.detail.jenis, 'Hukum Nun Sukun & Tanwin');
  assert.match(ikhfaSeg.detail.hukum, /Ikhfa/i);
  assert.match(ikhfaSeg.detail.triggerText, /ق/);
  assert.ok(ikhfaSeg.detail.caraBaca.length > 10);

  const qalqalahMid = segsIkhfa.find((s) => s.rule === 'qalqalah');
  assert.ok(qalqalahMid, 'should detect mid-word qalqalah');
  assert.match(qalqalahMid.detail.hukum, /Sugra/i);
  assert.match(qalqalahMid.detail.triggerText, /ب/);

  const sampleKubra = 'قُلْ هُوَ اللّٰهُ أَحَدْ';
  const segsKubra = parseTajwidSegments(sampleKubra);
  assert.equal(segsKubra.map((s) => s.text).join(''), sampleKubra);
  const kubraSeg = segsKubra.find((s) => s.rule === 'qalqalah');
  assert.ok(kubraSeg, 'should detect end-of-ayah qalqalah');
  assert.match(kubraSeg.detail.hukum, /Kubra/i);

  const sampleGhunnah = 'إِنَّ ثُمَّ';
  const segsGhunnah = parseTajwidSegments(sampleGhunnah);
  const ghunnahSegs = segsGhunnah.filter((s) => s.rule === 'ghunnah');
  assert.equal(ghunnahSegs.length, 2);
  assert.match(ghunnahSegs[0].detail.triggerText, /Nun/i);
  assert.match(ghunnahSegs[1].detail.triggerText, /Mim/i);

  const sampleMixed = 'مِنْ بَعْدِ مِنْ يَقُولُ مِنْ رَبِّهِمْ وَلَا الضَّالِّينَٓ';
  const segsMixed = parseTajwidSegments(sampleMixed);
  assert.equal(segsMixed.map((s) => s.text).join(''), sampleMixed);
  assert.ok(segsMixed.some((s) => s.rule === 'iqlab' && s.detail.triggerText.includes('ب')));
  assert.ok(segsMixed.some((s) => s.rule === 'idgham-bighunnah' && s.detail.triggerText.includes('ي')));
  assert.ok(segsMixed.some((s) => s.rule === 'idgham-bilaghunnah' && s.detail.triggerText.includes('ر')));
  assert.ok(segsMixed.some((s) => s.rule === 'mad' && s.detail.jenis === 'Hukum Mad'));
});

test('plain segments have null detail and tanwin triggers report Tanwin in triggerText', () => {
  const sampleTanwin = 'غَفُورٌ رَحِيمٌ';
  const segs = parseTajwidSegments(sampleTanwin);
  assert.equal(segs.map((s) => s.text).join(''), sampleTanwin);
  const plain = segs.find((s) => s.rule === null);
  assert.equal(plain?.detail, null);
  const bilaghunnah = segs.find((s) => s.rule === 'idgham-bilaghunnah');
  assert.ok(bilaghunnah, 'should detect tanwin + ra as idgham bilaghunnah');
  assert.match(bilaghunnah.detail.triggerText, /Tanwin/i);
  assert.match(bilaghunnah.detail.triggerText, /ر/);
});
