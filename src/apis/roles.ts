import type { IBackendRes, IModelPaginate, IRole } from '@/types/backend';
import instance from './axios.custom';

export const callCreateRole = (
  role: IRole,
): Promise<IBackendRes<IRole>> =>
  instance.post('/api/v1/add-role', { ...role });

export const callUpdateRole = (
  role: IRole,
  id: string,
): Promise<IBackendRes<IRole>> =>
  instance.put('/api/v1/update-role', { id, ...role });

export const callDeleteRole = (
  id: string,
): Promise<IBackendRes<IRole>> =>
  instance.delete(`/api/v1/delete-role/${id}`);

export const callFetchRole = (
  query: string,
): Promise<IBackendRes<IModelPaginate<IRole>>> =>
  instance.get(`/api/v1/roles?${query}`);

export const callFetchRoleById = (
  id: string,
): Promise<IBackendRes<IRole>> =>
  instance.get(`/api/v1/role/${id}`);
