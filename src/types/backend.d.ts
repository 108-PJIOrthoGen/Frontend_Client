export interface IBackendRes<T> {
    error?: string | string[];
    message: string;
    status: number | string;
    data?: T;
}

export interface IModelPaginate<T> {
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    };
    result: T[];
}
export interface IUser {
    id?: string;
    fullname?: string;
    email: string;
    password?: string;
    role?: {
        id: string;
        name: string;
    };
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
}
export interface IPatient {
    id?: string;
    fullName?: string;
    avatar?: string;
    patientCode?: string;
    dateOfBirth?: string;
    email?: string;
    phone?: number;
    nationality?: string;
    address?: string;
    identityCard?: string;
    insuranceNumber?: string;
    insuranceExpired?: string;
    gender?: string;
    career?: string;
    relativeInfo?: {
        name: string;
        phone: string;
    }
    ethnicity?: string;
    religion?: string;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;

}

export interface IDepartment {
    id?: string;
    name?: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}


export interface IPermission {
    id?: string;
    name?: string;
    apiPath?: string;
    method?: string;
    module?: string;

    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface IRole {
    id?: string;
    name: string;
    description: string;
    active: boolean;
    permissions: IPermission[] | string[];

    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Module Episode
 */
export interface IEpisodeRequest {
    patientId?: number;
    admissionDate?: string;
    dischargeDate?: string;
    treatmentDays?: number;
    reason?: string;
    department?: string;
    direct?: string;
    referralSource?: string;
    result?: string;
    status?: string;
}

export interface IEpisode {
    id?: string;
    patientId?: number;
    admissionDate?: string;
    dischargeDate?: string;
    treatmentDays?: number;
    reason?: string;
    department?: string;
    direct?: string;
    referralSource?: string;
    result?: string;
    status?: string;
    patient?: IPatient;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Module ClinicalRecord
 */
export interface IClinicalRecord {
    id?: string;
    episodeId?: number;
    illnessOnsetDate?: string;
    bloodPressure?: string;
    bmi?: number;
    fever?: boolean;
    pain?: boolean;
    erythema?: boolean;
    swelling?: boolean;
    sinusTract?: boolean;
    hematogenousSuspected?: boolean;
    pmmaAllergy?: boolean;
    suspectedInfectionType?: string;
    softTissue?: string;
    implantStability?: string;
    prosthesisJoint?: string;
    daysSinceIndexArthroplasty?: number;
    notations?: string;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Module LabResult
 */
export interface IMeasurement {
    value?: number;
    unit?: string;
}

export interface ILabResult {
    id?: string;
    episodeId?: number;
    esr?: IMeasurement;
    wbcBlood?: IMeasurement;
    neut?: IMeasurement;
    mono?: IMeasurement;
    lymph?: IMeasurement;
    eos?: IMeasurement;
    baso?: IMeasurement;
    rbc?: IMeasurement;
    hgb?: IMeasurement;
    hct?: IMeasurement;
    rdw?: IMeasurement;
    ig?: IMeasurement;
    mcv?: IMeasurement;
    mch?: IMeasurement;
    mchc?: IMeasurement;
    crp?: IMeasurement;
    synovialWbc?: IMeasurement;
    synovialPmn?: IMeasurement;
    biochemicalData?: Record<string, any>;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Module CultureResult
 */
export interface ICultureResult {
    id?: string;
    episodeId?: number;
    sampleType?: string;
    incubationDays?: number;
    name?: string;
    result?: string;
    gramType?: string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Module ImageResult
 */
export interface IImageResult {
    id?: string;
    episodeId?: number;
    type?: string;
    imagingDate?: string;
    findings?: string;
    fileMetadata?: string;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Module SensitivityResult
 */
export interface ISensitivityResult {
    id?: string;
    cultureId?: number;
    antibioticName?: string;
    micValue?: string;
    sensitivityCode?: string;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Module MedicalHistory
 */
export interface IMedicalHistory {
    id?: string;
    episodeId?: number;
    medicalHistory?: string;
    antibioticHistory?: string;
    process?: string;
    isAllergy?: boolean;
    allergyNote?: string;
    isDrug?: boolean;
    drugNote?: string;
    isAlcohol?: boolean;
    alcoholNote?: string;
    isSmoking?: boolean;
    smokingNote?: string;
    isOther?: boolean;
    otherNote?: string;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Module Surgery
 */
export interface ISurgery {
    id?: string;
    episodeId?: number;
    surgeryDate?: string;
    surgeryType?: string;
    woundStatus?: string;
    findings?: string;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Module AiChat
 */
export interface IAiChatSession {
    id?: string;
    episodeId?: number;
    runId?: number;
    currentItemId?: number;
    chatType?: string;
    title?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface IAiChatMessage {
    id?: string;
    sessionId?: string;
    role?: string;
    content?: string;
    answer?: string;
    latencyMs?: number;
    tokensUsed?: number;
    references?: Record<string, any>[];
    createdAt?: string;
}

/**
 * Module AiRecommendation
 */
export interface IAiRecommendationRun {
    id?: string;
    episodeId?: number;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface IAiRecommendationItem {
    id?: string;
    clientItemKey?: string;
    category?: string;
    title?: string;
    priorityOrder?: number;
    isPrimary?: boolean;
    itemJson?: Record<string, any>;
}

export interface IAiRecommendationRunDetail {
    run?: IAiRecommendationRun;
    items?: IAiRecommendationItem[];
    citations?: Record<string, any>[];
}