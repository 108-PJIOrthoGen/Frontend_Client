import type {
    IBackendRes,
    IModelPaginate,
    IUser,
} from '@/types/backend';
import instance from './axios.custom';

export const callCreateUser = (
    user: IUser,
): Promise<IBackendRes<IUser>> =>
    instance.post('/api/v1/add-user', { ...user });

export const callUpdateUser = (
    user: IUser,
): Promise<IBackendRes<IUser>> =>
    instance.put('/api/v1/update-user', { ...user });

export const callDeleteUser = (
    id: string,
): Promise<IBackendRes<IUser>> =>
    instance.delete(`/api/v1/delete-user/${id}`);

export const callFetchUser = (
    query: string,
): Promise<IBackendRes<IModelPaginate<IUser>>> =>
    instance.get(`/api/v1/users?${query}`);
