// Classifies a clinical test row by its id prefix. Only clinician-created rows
// have special editing behavior; every server-provided row is presented as a
// regular laboratory result without an inferred source label.
// Returning a kind (instead of inlining startsWith) also defends against rows
// with a missing id, which used to crash the table on .startsWith().
export type TestRowKind = 'default' | 'custom';

export const getTestRowKind = (id?: string): TestRowKind => {
  if (!id) return 'default';
  if (id.includes('_custom_')) return 'custom';
  return 'default';
};
