import type {
    IBackendRes,
    IModelPaginate,
    IPermission,
} from '@/types/backend';
import instance from './axios.custom';

export const callCreatePermission = (
    permission: IPermission,
): Promise<IBackendRes<IPermission>> =>
    instance.post('/api/v1/add-permission', { ...permission });

export const callUpdatePermission = (
    permission: IPermission,
    id: string,
): Promise<IBackendRes<IPermission>> =>
    instance.put('/api/v1/update-permission', { id, ...permission });

export const callDeletePermission = (
    id: string,
): Promise<IBackendRes<IPermission>> =>
    instance.delete(`/api/v1/delete-permission/${id}`);

export const callFetchPermission = (
    query: string,
): Promise<IBackendRes<IModelPaginate<IPermission>>> =>
    instance.get(`/api/v1/permissions?${query}`);
