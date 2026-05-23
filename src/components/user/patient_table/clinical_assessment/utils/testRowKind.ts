// Classifies a clinical test row by its id prefix. Backend writes ht_*/fa_*/bc_*
// for canonical rows, *_extra_* for AI-requested rows that aren't in the FE
// default panel, and *_custom_* for rows the clinician adds manually.
// Returning a kind (instead of inlining startsWith) also defends against rows
// with a missing id, which used to crash the table on .startsWith().
export type TestRowKind = 'default' | 'extra' | 'custom';

export const getTestRowKind = (id?: string): TestRowKind => {
  if (!id) return 'default';
  if (id.includes('_custom_')) return 'custom';
  if (id.includes('_extra_')) return 'extra';
  return 'default';
};
