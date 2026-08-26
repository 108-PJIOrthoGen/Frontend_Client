import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { conclusionLabel, conclusionTone, criterionDetailColor } from './assessmentPresentation.ts';

describe('PJI assessment presentation preserves unknown evidence', () => {
  it('does not render an incomplete conclusion with the negative green tone', () => {
    assert.equal(conclusionLabel('INCOMPLETE'), 'DỮ LIỆU CHƯA ĐỦ ĐỂ PHÂN LOẠI PJI');
    assert.equal(conclusionTone('INCOMPLETE').color, '#475569');
    assert.notEqual(conclusionTone('INCOMPLETE').color, conclusionTone('NOT_INFECTED').color);
  });

  it('uses a distinct warning color for unknown criterion results', () => {
    assert.equal(criterionDetailColor(null), '#d97706');
    assert.notEqual(criterionDetailColor(null), criterionDetailColor(false));
  });
});
