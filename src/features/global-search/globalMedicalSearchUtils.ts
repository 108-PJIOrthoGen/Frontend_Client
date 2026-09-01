import {
  sfAnd,
  sfEqual,
  sfGt,
  sfIn,
  sfLike,
  sfOr,
} from 'spring-filter-query-builder';

export type GlobalSearchKind = 'episode' | 'patient';
export type UpdatedWithin = 'any' | 'today' | '7d' | '30d' | '365d';

export interface GlobalSearchFilters {
  updatedWithin: UpdatedWithin;
  statuses: string[];
  department: string;
  genders: string[];
}

export const EMPTY_GLOBAL_SEARCH_FILTERS: GlobalSearchFilters = {
  updatedWithin: 'any',
  statuses: [],
  department: '',
  genders: [],
};

const updatedAfter = (updatedWithin: UpdatedWithin, now: Date): string | null => {
  if (updatedWithin === 'any') return null;

  const date = new Date(now);
  if (updatedWithin === 'today') {
    date.setHours(0, 0, 0, 0);
  } else {
    const days = updatedWithin === '7d' ? 7 : updatedWithin === '30d' ? 30 : 365;
    date.setDate(date.getDate() - days);
  }
  return date.toISOString();
};

const paginate = (filter: unknown): string => {
  const query = new URLSearchParams({
    page: '0',
    size: '20',
    sort: 'updatedAt,desc',
  });
  if (filter) query.set('filter', String(filter));
  return query.toString();
};

export const hasActiveGlobalSearchFilters = (filters: GlobalSearchFilters): boolean => (
  filters.updatedWithin !== 'any'
  || filters.statuses.length > 0
  || filters.department.trim().length > 0
  || filters.genders.length > 0
);

export const buildGlobalSearchQuery = (
  kind: GlobalSearchKind,
  rawTerm: string,
  filters: GlobalSearchFilters,
  now = new Date(),
): string => {
  const term = rawTerm.trim();
  const expressions: unknown[] = [];

  if (term) {
    expressions.push(kind === 'episode'
      ? sfOr([
        sfLike('medicalRecordCode', term),
        sfLike('patient.patientCode', term),
        sfLike('patient.fullName', term, true),
        sfLike('patient.identityCard', term),
        sfLike('department', term, true),
        sfLike('inpatientDiagnosis', term, true),
      ])
      : sfOr([
        sfLike('patientCode', term),
        sfLike('fullName', term, true),
        sfLike('identityCard', term),
        sfLike('phone', term),
      ]));
  }

  const after = updatedAfter(filters.updatedWithin, now);
  if (after) expressions.push(sfGt('updatedAt', after));

  if (kind === 'episode') {
    if (filters.statuses.length === 1) {
      expressions.push(sfEqual('status', filters.statuses[0]));
    } else if (filters.statuses.length > 1) {
      expressions.push(sfIn('status', filters.statuses));
    }
    if (filters.department.trim()) {
      expressions.push(sfLike('department', filters.department.trim(), true));
    }
  } else if (filters.genders.length === 1) {
    expressions.push(sfEqual('gender', filters.genders[0]));
  } else if (filters.genders.length > 1) {
    expressions.push(sfIn('gender', filters.genders));
  }

  const filter = expressions.length === 0
    ? null
    : expressions.length === 1
      ? expressions[0]
      : sfAnd(expressions as any[]);

  return paginate(filter);
};
