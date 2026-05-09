export const getTestStatus = (result: string, normalRange: string): 'L' | 'H' | null => {
  if (!result || !normalRange) return null;
  const resVal = parseFloat(result);
  if (isNaN(resVal)) return null;
  if (normalRange.includes('-')) {
    const parts = normalRange.split('-').map((p) => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      if (resVal < parts[0]) return 'L';
      if (resVal > parts[1]) return 'H';
      return null;
    }
  }
  if (normalRange.trim().startsWith('<')) {
    const max = parseFloat(normalRange.replace('<', '').trim());
    if (!isNaN(max) && resVal > max) return 'H';
  }
  if (normalRange.trim().startsWith('>')) {
    const min = parseFloat(normalRange.replace('>', '').trim());
    if (!isNaN(min) && resVal < min) return 'L';
  }
  return null;
};
