import instance from './axios.custom';
import {
    IBackendRes, IModelPaginate, IPatient,
    IEpisode, IEpisodeRequest, IClinicalRecord, ILabResult, ICultureResult,
    IImageResult, ISensitivityResult, IMedicalHistory, ISurgery,
    IAiChatSession, IAiChatMessage, IAiRecommendationRun, IAiRecommendationRunDetail,
    IDoctorRecommendationReview, IDoctorReviewStats,
    IEpisodeFullResponse, IEpisodeFullRequest
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

export const callCreateExtractImageJob = (files: File[], episodeId?: string | number) => {
    const body = new FormData();
    files.forEach((file) => body.append('files', file));
    if (episodeId !== undefined && episodeId !== null && episodeId !== '') {
        body.append('episodeId', String(episodeId));
    }
    return instance({
        method: 'post',
        url: '/api/v1/extract-images/jobs',
        data: body,
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
}

export const callFetchExtractImageJob = (jobId: string) => {
    return instance.get(`/api/v1/extract-images/jobs/${jobId}`);
}
export const callCancelExtractImageJob = (jobId: string) => {
    return instance.post(`/api/v1/extract-images/jobs/${jobId}/cancel`);
}
// authentication
export {
    callChangeOwnPassword,
    callFetchAccountAPI,
    callUpdateOwnProfile,
    callVerifyDeviceAPI,
    forgotPasswordAPI,
    loginAPI,
    LogoutAPI,
    registerAPI,
    resetPasswordAPI,
} from './auth';
/**
Module Role
 */
export {
    callCreateRole,
    callDeleteRole,
    callFetchRole,
    callFetchRoleById,
    callUpdateRole,
} from './roles';
/**
Module Permission
 */
export {
    callCreatePermission,
    callDeletePermission,
    callFetchPermission,
    callUpdatePermission,
} from './permissions';
/**
 * 
Module User
 */
export {
    callCreateUser,
    callDeleteUser,
    callFetchUser,
    callUpdateUser,
} from './users';
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
export const callFetchPatientById = (id: string | number): Promise<IBackendRes<IPatient>> => {
    return instance.get(`/api/v1/patients/${id}`);
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
 * Episode aggregate — one transactional read and one atomic save covering the
 * episode plus all child records (history, clinical, labs, surgeries, images,
 * cultures + sensitivities). Replaces the multi-call read/save in MedicalExamDetail.
 */
export const callFetchEpisodeFull = (id: string): Promise<IBackendRes<IEpisodeFullResponse>> => {
    return instance.get(`/api/v1/episodes/${id}/full`);
}

export const callCreateEpisodeFull = (data: IEpisodeFullRequest): Promise<IBackendRes<IEpisodeFullResponse>> => {
    return instance.post('/api/v1/episodes/full', data);
}

export const callUpdateEpisodeFull = (id: string, data: IEpisodeFullRequest): Promise<IBackendRes<IEpisodeFullResponse>> => {
    return instance.put(`/api/v1/episodes/${id}/full`, data);
}

/**
 * Episode soft-lock (Redis pessimistic). The success response is wrapped in
 * IBackendRes; the busy response (HTTP 423) is returned by the axios
 * interceptor as a flat object — discriminated by `status === 423`.
 */
export interface IEpisodeLockState {
    episodeId: number;
    heldBy: number;
    expiresAt: string;
    ttlSeconds: number;
}

export interface IEpisodeLockBusy {
    timestamp?: string;
    status: 423;
    path?: string;
    error: 'Locked';
    message: string;
    heldBy: number | null;
    ttlSeconds: number;
}

export type IEpisodeLockResult = IBackendRes<IEpisodeLockState> | IEpisodeLockBusy;

export const isEpisodeLockBusy = (r: IEpisodeLockResult): r is IEpisodeLockBusy =>
    !!r && (r as IEpisodeLockBusy).status === 423;

export const callAcquireEpisodeLock = (id: string): Promise<IEpisodeLockResult> => {
    return instance.post(`/api/v1/episodes/${id}/lock`);
}

export const callHeartbeatEpisodeLock = (id: string): Promise<IEpisodeLockResult> => {
    return instance.post(`/api/v1/episodes/${id}/lock/heartbeat`);
}

export const callReleaseEpisodeLock = (id: string): Promise<IBackendRes<void>> => {
    return instance.delete(`/api/v1/episodes/${id}/lock`);
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

export const callEvaluatePjiDiagnostic = (episodeId: string): Promise<IBackendRes<any>> => {
    return instance.post(`/api/v1/episodes/${episodeId}/diagnostic-test/evaluate`);
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
    doctorDiagnosisJson?: Record<string, any>;
    agreementJson?: Record<string, any>;
}): Promise<IBackendRes<IDoctorRecommendationReview>> => {
    return instance.post(`/api/v1/episodes/${episodeId}/doctor-reviews`, data);
}

export const callFetchDoctorReviewStats = (): Promise<IBackendRes<IDoctorReviewStats>> => {
    return instance.get('/api/v1/doctor-reviews/stats');
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
export {
    callCreatePendingLabTasksFromCompleteness,
    callDismissPendingLabTask,
    callFetchMyPendingLabTaskCount,
    callFetchMyPendingLabTasks,
    callQuickEntryPendingLabTask,
} from './pendingLabTasks';






/**
 * Module Notification
 */
export {
    callFetchNotifications,
    callFetchUnreadNotificationCount,
    callMarkAllNotificationsRead,
    callMarkNotificationRead,
    type INotificationPage,
} from './notifications';

export const callCancelAiRun = (runId: number | string): Promise<IBackendRes<void>> => {
    return instance.post(`/api/v1/ai-recommendations/runs/${runId}/cancel`);
};
