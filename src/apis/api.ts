import instance from './axios.custom';
import {
    IBackendRes, IModelPaginate, IPatient, IPermission, IRole, IUser,
    IEpisode, IEpisodeRequest, IClinicalRecord, ILabResult, ICultureResult,
    IImageResult, ISensitivityResult, IMedicalHistory, ISurgery,
    IAiChatSession, IAiChatMessage, IAiRecommendationRun, IAiRecommendationRunDetail,
    IDoctorRecommendationReview, IPendingLabTask
} from '@/types/backend';

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
    return instance.delete(`/api/v1/patients/${id}`);
}
export const callCreatePatient = (user: IPatient): Promise<IBackendRes<IPatient>> => {
    return instance.post('/api/v1/patients', { ...user })
}

export const callUpdatePatient = (user: IPatient): Promise<IBackendRes<IPatient>> => {
    return instance.put(`/api/v1/patients/${user.id}`, { ...user })
}

/**
 *
Module Episode (formerly Medical Exam)
 */
export const callCreateEpisode = (data: IEpisodeRequest): Promise<IBackendRes<IEpisode>> => {
    return instance.post('/api/v1/episodes', { ...data });
}

export const callUpdateEpisode = (id: string, data: IEpisodeRequest): Promise<IBackendRes<IEpisode>> => {
    return instance.put(`/api/v1/episodes/${id}`, { ...data });
}

export const callFetchEpisodeById = (id: string): Promise<IBackendRes<IEpisode>> => {
    return instance.get(`/api/v1/episodes/${id}`);
}

export const callDeleteEpisode = (id: string): Promise<IBackendRes<IEpisode>> => {
    return instance.delete(`/api/v1/episodes/${id}`);
}

export const callFetchEpisodes = (query: string): Promise<IBackendRes<IModelPaginate<IEpisode>>> => {
    return instance.get(`/api/v1/episodes?${query}`);
}

export const callFetchEpisodesByPatient = (patientId: string, query: string): Promise<IBackendRes<IModelPaginate<IEpisode>>> => {
    return instance.get(`/api/v1/patients/${patientId}/episodes?${query}`);
}

/**
 *
Module ClinicalRecord
 */
export const callCreateClinicalRecord = (data: IClinicalRecord): Promise<IBackendRes<IClinicalRecord>> => {
    return instance.post('/api/v1/clinical-records', { ...data });
}

export const callUpdateClinicalRecord = (id: string, data: IClinicalRecord): Promise<IBackendRes<IClinicalRecord>> => {
    return instance.put(`/api/v1/clinical-records/${id}`, { ...data });
}

export const callFetchClinicalRecordById = (id: string): Promise<IBackendRes<IClinicalRecord>> => {
    return instance.get(`/api/v1/clinical-records/${id}`);
}

export const callDeleteClinicalRecord = (id: string): Promise<IBackendRes<IClinicalRecord>> => {
    return instance.delete(`/api/v1/clinical-records/${id}`);
}

export const callFetchClinicalRecordsByEpisode = (episodeId: string, query: string): Promise<IBackendRes<IModelPaginate<IClinicalRecord>>> => {
    return instance.get(`/api/v1/episodes/${episodeId}/clinical-records?${query}`);
}

/**
 *
Module LabResult
 */
export const callCreateLabResult = (data: ILabResult): Promise<IBackendRes<ILabResult>> => {
    return instance.post('/api/v1/lab-results', { ...data });
}

export const callUpdateLabResult = (id: string, data: ILabResult): Promise<IBackendRes<ILabResult>> => {
    return instance.put(`/api/v1/lab-results/${id}`, { ...data });
}

export const callFetchLabResultById = (id: string): Promise<IBackendRes<ILabResult>> => {
    return instance.get(`/api/v1/lab-results/${id}`);
}

export const callDeleteLabResult = (id: string): Promise<IBackendRes<ILabResult>> => {
    return instance.delete(`/api/v1/lab-results/${id}`);
}

export const callFetchLabResultsByEpisode = (episodeId: string, query: string): Promise<IBackendRes<IModelPaginate<ILabResult>>> => {
    return instance.get(`/api/v1/episodes/${episodeId}/lab-results?${query}`);
}

/**
 *
Module CultureResult
 */
export const callCreateCultureResult = (data: ICultureResult): Promise<IBackendRes<ICultureResult>> => {
    return instance.post('/api/v1/culture-results', { ...data });
}

export const callUpdateCultureResult = (id: string, data: ICultureResult): Promise<IBackendRes<ICultureResult>> => {
    return instance.put(`/api/v1/culture-results/${id}`, { ...data });
}

export const callFetchCultureResultById = (id: string): Promise<IBackendRes<ICultureResult>> => {
    return instance.get(`/api/v1/culture-results/${id}`);
}

export const callDeleteCultureResult = (id: string): Promise<IBackendRes<ICultureResult>> => {
    return instance.delete(`/api/v1/culture-results/${id}`);
}

export const callFetchCultureResultsByEpisode = (episodeId: string, query: string): Promise<IBackendRes<IModelPaginate<ICultureResult>>> => {
    return instance.get(`/api/v1/episodes/${episodeId}/culture-results?${query}`);
}

/**
 *
Module ImageResult
 */
export const callCreateImageResult = (data: IImageResult): Promise<IBackendRes<IImageResult>> => {
    return instance.post('/api/v1/image-results', { ...data });
}

export const callUpdateImageResult = (id: string, data: IImageResult): Promise<IBackendRes<IImageResult>> => {
    return instance.put(`/api/v1/image-results/${id}`, { ...data });
}

export const callFetchImageResultById = (id: string): Promise<IBackendRes<IImageResult>> => {
    return instance.get(`/api/v1/image-results/${id}`);
}

export const callDeleteImageResult = (id: string): Promise<IBackendRes<IImageResult>> => {
    return instance.delete(`/api/v1/image-results/${id}`);
}

export const callFetchImageResultsByEpisode = (episodeId: string, query: string): Promise<IBackendRes<IModelPaginate<IImageResult>>> => {
    return instance.get(`/api/v1/episodes/${episodeId}/image-results?${query}`);
}

/**
 *
Module SensitivityResult
 */
export const callCreateSensitivityResult = (data: ISensitivityResult): Promise<IBackendRes<ISensitivityResult>> => {
    return instance.post('/api/v1/sensitivity-results', { ...data });
}

export const callUpdateSensitivityResult = (id: string, data: ISensitivityResult): Promise<IBackendRes<ISensitivityResult>> => {
    return instance.put(`/api/v1/sensitivity-results/${id}`, { ...data });
}

export const callFetchSensitivityResultById = (id: string): Promise<IBackendRes<ISensitivityResult>> => {
    return instance.get(`/api/v1/sensitivity-results/${id}`);
}

export const callDeleteSensitivityResult = (id: string): Promise<IBackendRes<ISensitivityResult>> => {
    return instance.delete(`/api/v1/sensitivity-results/${id}`);
}

export const callFetchSensitivityResultsByCulture = (cultureId: string, query: string): Promise<IBackendRes<IModelPaginate<ISensitivityResult>>> => {
    return instance.get(`/api/v1/culture-results/${cultureId}/sensitivity-results?${query}`);
}

/**
 *
Module MedicalHistory
 */
export const callCreateMedicalHistory = (episodeId: string, data: IMedicalHistory): Promise<IBackendRes<IMedicalHistory>> => {
    return instance.post(`/api/v1/episodes/${episodeId}/medical-history`, { ...data });
}

export const callUpdateMedicalHistory = (episodeId: string, data: IMedicalHistory): Promise<IBackendRes<IMedicalHistory>> => {
    return instance.put(`/api/v1/episodes/${episodeId}/medical-history`, { ...data });
}

export const callFetchMedicalHistory = (episodeId: string): Promise<IBackendRes<IMedicalHistory>> => {
    return instance.get(`/api/v1/episodes/${episodeId}/medical-history`);
}

/**
 *
Module Surgery
 */
export const callCreateSurgery = (data: ISurgery): Promise<IBackendRes<ISurgery>> => {
    return instance.post('/api/v1/surgeries', { ...data });
}

export const callUpdateSurgery = (id: string, data: ISurgery): Promise<IBackendRes<ISurgery>> => {
    return instance.put(`/api/v1/surgeries/${id}`, { ...data });
}

export const callFetchSurgeryById = (id: string): Promise<IBackendRes<ISurgery>> => {
    return instance.get(`/api/v1/surgeries/${id}`);
}

export const callDeleteSurgery = (id: string): Promise<IBackendRes<ISurgery>> => {
    return instance.delete(`/api/v1/surgeries/${id}`);
}

export const callFetchSurgeriesByEpisode = (episodeId: string, query: string): Promise<IBackendRes<IModelPaginate<ISurgery>>> => {
    return instance.get(`/api/v1/episodes/${episodeId}/surgeries?${query}`);
}

/**
 *
Module AiChat
 */
export const callCreateAiChatSession = (data: Partial<IAiChatSession>): Promise<IBackendRes<IAiChatSession>> => {
    return instance.post('/api/v1/ai-chat/sessions', { ...data });
}

export const callSendAiChatMessage = (sessionId: string, data: { content: string; useEpisodeContext?: boolean; useRunContext?: boolean; useChatHistory?: boolean }): Promise<IBackendRes<IAiChatMessage>> => {
    return instance.post(`/api/v1/ai-chat/sessions/${sessionId}/messages`, { ...data });
}

export const callFetchAiChatMessages = (sessionId: string, query: string): Promise<IBackendRes<IModelPaginate<IAiChatMessage>>> => {
    return instance.get(`/api/v1/ai-chat/sessions/${sessionId}/messages?${query}`);
}

export const callFetchAiChatSessionsByEpisode = (episodeId: string, query: string): Promise<IBackendRes<IModelPaginate<IAiChatSession>>> => {
    return instance.get(`/api/v1/episodes/${episodeId}/ai-chat/sessions?${query}`);
}

/**
 *
Module AiRecommendation
 */
export const callGenerateAiRecommendation = (episodeId: string): Promise<IBackendRes<any>> => {
    return instance.post(`/api/v1/episodes/${episodeId}/ai-recommendations/generate`);
}

export const callFetchAiRecommendationRuns = (episodeId: string, query: string): Promise<IBackendRes<IModelPaginate<IAiRecommendationRun>>> => {
    return instance.get(`/api/v1/episodes/${episodeId}/ai-recommendations/runs?${query}`);
}

export const callFetchAiRecommendationRunDetail = (runId: string): Promise<IBackendRes<IAiRecommendationRunDetail>> => {
    return instance.get(`/api/v1/ai-recommendations/runs/${runId}`);
}

export const callRetryAiRecommendationRun = (runId: string): Promise<IBackendRes<any>> => {
    return instance.post(`/api/v1/ai-recommendations/runs/${runId}/retry`);
}

/**
 * Doctor Recommendation Reviews
 */
export const callCreateDoctorReview = (episodeId: string, data: {
    runId: number;
    reviewStatus: string;
    reviewNote?: string;
    modificationJson?: Record<string, any>;
    rejectionReason?: string;
}): Promise<IBackendRes<IDoctorRecommendationReview>> => {
    return instance.post(`/api/v1/episodes/${episodeId}/doctor-reviews`, data);
}

export const callFetchDoctorReviewByRunId = (runId: string): Promise<IBackendRes<IDoctorRecommendationReview>> => {
    return instance.get(`/api/v1/ai-recommendations/runs/${runId}/review`);
}

export const callFetchDoctorReviewsByEpisode = (episodeId: string): Promise<IBackendRes<IDoctorRecommendationReview[]>> => {
    return instance.get(`/api/v1/episodes/${episodeId}/doctor-reviews`);
}

/**
 * Module PendingLabTask
 */
export const callFetchMyPendingLabTasks = (): Promise<IBackendRes<IPendingLabTask[]>> => {
    return instance.get('/api/v1/pending-lab-tasks/my');
};

export const callFetchMyPendingLabTaskCount = (): Promise<IBackendRes<number>> => {
    return instance.get('/api/v1/pending-lab-tasks/my/count');
};

export const callDismissPendingLabTask = (taskId: number): Promise<IBackendRes<void>> => {
    return instance.post(`/api/v1/pending-lab-tasks/${taskId}/dismiss`);
};

export const callQuickEntryPendingLabTask = (
    taskId: number,
    data: { value: number | string; unit?: string }
): Promise<IBackendRes<void>> => {
    return instance.post(`/api/v1/pending-lab-tasks/${taskId}/quick-entry`, data);
};

export const callCreatePendingLabTasksFromCompleteness = (
    episodeId: number,
    data: { patientId?: number; runId?: number; missingItems: Record<string, any>[] }
): Promise<IBackendRes<void>> => {
    return instance.post(`/api/v1/episodes/${episodeId}/pending-lab-tasks/from-completeness`, data);
};






