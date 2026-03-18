import instance from './axios.custom';
import { IBackendRes, IClinicalInfo, IClinicalService, IDiagnose, IMedicalExam, IMedicalExamFull, IModelPaginate, IPatient, IPermission, IRadiology, IRole, IUser, IVitalSign, IPayment } from '@/types/backend';

export const callUploadImage = (file: any, folder: string) => {
    const bodyFormData = new FormData();
    bodyFormData.append('file', file);
    bodyFormData.append('folder', folder);
    return instance({
        method: 'post',
        url: '/api/v1/files',
        data: bodyFormData,
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
}
// authentication
export const registerAPI = (username: string, email: string, password: string, roleId: IRole) => {
    return instance.post(`/api/v1/auth/register`, {
        username, email, password,
        role: {
            "id": roleId
        }
    })
}
export const loginAPI = (username: string, password: string) => {
    return instance.post(`/api/v1/auth/login`, { username, password })
}
export const callFetchAccountAPI = () => {
    return instance.get(`/api/v1/auth/account`)
}
export const LogoutAPI = () => {
    return instance.post('/api/v1/auth/logout')
}
export const callCreateRole = (role: IRole): Promise<IBackendRes<IRole>> => {
    return instance.post('/api/v1/add-role', { ...role })
}

/**
Module Role
 */
export const callUpdateRole = (role: IRole, id: string): Promise<IBackendRes<IRole>> => {
    return instance.put(`/api/v1/update-role`, { id, ...role })
}

export const callDeleteRole = (id: string): Promise<IBackendRes<IRole>> => {
    return instance.delete(`/api/v1/delete-role/${id}`);
}
export const callFetchRole = (query: string): Promise<IBackendRes<IModelPaginate<IRole>>> => {
    return instance.get(`/api/v1/roles?${query}`);
}

export const callFetchRoleById = (id: string): Promise<IBackendRes<IRole>> => {
    return instance.get(`/api/v1/role/${id}`);
}
/**
Module Permission
 */
export const callCreatePermission = (permission: IPermission): Promise<IBackendRes<IPermission>> => {
    return instance.post('/api/v1/add-permission', { ...permission })
}
export const callUpdatePermission = (permission: IPermission, id: string): Promise<IBackendRes<IPermission>> => {
    return instance.put(`/api/v1/update-permission`, { id, ...permission })
}
export const callDeletePermission = (id: string): Promise<IBackendRes<IPermission>> => {
    return instance.delete(`/api/v1/delete-permission/${id}`);
}
export const callFetchPermission = (query: string): Promise<IBackendRes<IModelPaginate<IPermission>>> => {
    return instance.get(`/api/v1/permissions?${query}`);
}
/**
 * 
Module User
 */
export const callCreateUser = (user: IUser): Promise<IBackendRes<IUser>> => {
    return instance.post('/api/v1/add-user', { ...user })
}

export const callUpdateUser = (user: IUser): Promise<IBackendRes<IUser>> => {
    return instance.put(`/api/v1/update-user`, { ...user })
}

export const callDeleteUser = (id: string): Promise<IBackendRes<IUser>> => {
    return instance.delete(`/api/v1/delete-user/${id}`);
}

export const callFetchUser = (query: string): Promise<IBackendRes<IModelPaginate<IUser>>> => {
    return instance.get(`/api/v1/users?${query}`);
}
/**
 * 
Module Patient
 */
export const callFetchPatient = (query: string): Promise<IBackendRes<IModelPaginate<IPatient>>> => {
    return instance.get(`/api/v1/patients?${query}`);
}
export const callDeletePatient = (id: string): Promise<IBackendRes<IPatient>> => {
    return instance.delete(`/api/v1/delete-patient/${id}`);
}
export const callCreatePatient = (user: IPatient): Promise<IBackendRes<IPatient>> => {
    return instance.post('/api/v1/patients', { ...user })
}

export const callUpdatePatient = (user: IPatient): Promise<IBackendRes<IPatient>> => {
    return instance.put(`/api/v1/patients/${user.id}`, { ...user })
}

/**
 *
Module medical Exam
 */
export const callFetchMedicalExamByPatient = (patientId: string, query: string): Promise<IBackendRes<IModelPaginate<IMedicalExamFull>>> => {
    return instance.get(`/api/v1/patients/${patientId}/medical-exams?${query}`);
}

export const callCreateMedicalExam = (patientId: string, data: Partial<IMedicalExamFull>): Promise<IBackendRes<IMedicalExamFull>> => {
    return instance.post(`/api/v1/patients/${patientId}/medical-exams`, { ...data });
}

export const callUpdateMedicalExam = (examId: string, data: Partial<IMedicalExamFull>): Promise<IBackendRes<IMedicalExamFull>> => {
    return instance.put(`/api/v1/medical-exams/${examId}`, { ...data });
}

export const callDeleteMedicalExam = (examId: string): Promise<IBackendRes<IMedicalExamFull>> => {
    return instance.delete(`/api/v1/medical-exams/${examId}`);
}










