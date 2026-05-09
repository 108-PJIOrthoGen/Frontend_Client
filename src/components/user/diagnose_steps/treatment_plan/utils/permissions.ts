import type { IPermission } from '@/types/backend';

export const TREATMENT_REVIEW_WRITE_PERMISSION = {
  method: 'POST',
  apiPath: '/api/v1/episodes/{episodeId}/doctor-reviews',
};

export const hasPermission = (
  permissions: IPermission[] | undefined,
  target: { method: string; apiPath: string },
): boolean => {
  return !!permissions?.some(
    (permission) => permission.method === target.method && permission.apiPath === target.apiPath,
  );
};

export const normalizeIdentity = (value?: string | null): string =>
  value?.trim().toLowerCase() ?? '';
