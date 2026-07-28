export const asArray = <T,>(value: T[] | undefined | null): T[] => (
  Array.isArray(value) ? value : []
);

export const toNumber = (value: unknown): number => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

export const formatScore = (value: number): string => (
  Number.isInteger(value) ? String(value) : value.toFixed(1)
);

export const conclusionLabel = (interpretation: unknown): string => {
  switch (interpretation) {
    case 'INFECTED':
      return 'NHIỄM TRÙNG';
    case 'NOT_INFECTED':
      return 'KHÔNG NHIỄM';
    case 'INCONCLUSIVE':
      return 'CHƯA RÕ';
    default:
      return interpretation ? String(interpretation) : 'CHƯA CÓ';
  }
};

export const formatEnumText = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return 'Chưa xác định';
  }
  return String(value)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, match => match.toUpperCase());
};

export const organismInitials = (name: unknown): string => {
  const text = String(name || 'PJI').trim();
  const initials = text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
  return initials || 'PJI';
};

export const criterionDetailColor = (result: unknown): string => {
  if (result === true) return '#16a34a';
  if (result === false) return '#ef4444';
  return '#d97706';
};

export const severityAlertType = (
  severity: unknown,
): 'error' | 'warning' | 'info' => {
  if (severity === 'HIGH') return 'error';
  if (severity === 'LOW') return 'info';
  return 'warning';
};

export const conclusionTone = (interpretation: unknown) => {
  if (interpretation === 'INFECTED') {
    return { color: '#dc2626', border: '#ffccc7', background: '#fff1f0' };
  }
  if (interpretation === 'INCONCLUSIVE') {
    return { color: '#d97706', border: '#ffe58f', background: '#fffbe6' };
  }
  return { color: '#16a34a', border: '#b7eb8f', background: '#f6ffed' };
};
