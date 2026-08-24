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
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'NONE';

export interface IUser {
    id?: string;
    fullName?: string;
    email: string;
    password?: string;
    phone?: string;
    department?: string;
    avatar?: string;
    status?: UserStatus;
    lastLogin?: string;
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
    admissionCount?: number;
    treatmentDays?: number;
    initialDepartmentTreatmentDays?: number;
    initialDepartmentAdmissionDate?: string;
    reason?: string;
    department?: string;
    direct?: string;
    referralSource?: string;
    departmentTransfers?: IEpisodeDepartmentTransfer[];
    hospitalTransferType?: string;
    hospitalTransferDestination?: string;
    dischargeDisposition?: string;
    referralDiagnosis?: string;
    emergencyDiagnosis?: string;
    inpatientDiagnosis?: string;
    hasIncident?: boolean;
    hasComplication?: boolean;
    complicationCause?: string;
    postoperativeTreatmentDays?: number;
    surgeryCount?: number;
    dischargePrimaryDiagnosis?: string;
    dischargeCause?: string;
    accompanyingDisease?: string;
    preoperativeDiagnosis?: string;
    postoperativeDiagnosis?: string;
    result?: string;
    status?: string;
}

export interface IEpisodeDepartmentTransfer {
    department?: string;
    admissionDate?: string;
    admissionTime?: string;
    treatmentDays?: number;
}

export interface IEpisode extends IEpisodeRequest {
    id?: string;
    medicalRecordCode?: string;
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
    onsetTiming?: string;
    bloodPressure?: string;
    heightCm?: number;
    weightKg?: number;
    bmi?: number;
    fever?: boolean;
    pain?: boolean;
    erythema?: boolean;
    swelling?: boolean;
    sinusTract?: boolean;
    hematogenousSuspected?: boolean;
    pmmaAllergy?: boolean;
    suspectedTransmissionRoute?: string;
    softTissue?: string;
    implantStability?: string;
    generalExam?: string;
    surgicalDisease?: string;
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

export interface ILabTestItem {
    id: string;
    name: string;
    value?: string | null;
    unit: string;
    normalRange: string;
}

export interface ILabResult {
    id?: string;
    episodeId?: number;
    hematologyTests?: ILabTestItem[];
    fluidAnalysis?: ILabTestItem[];
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
    incubationDays?: number;
    name?: string;
    result?: string;
    gramType?: string;
    notes?: string;
    antibioticed?: boolean;
    daysOffAntibio?: number;
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
    /** S3/MinIO bucket the file lives in. Persist this so the backend can regenerate fresh URLs. */
    bucket?: string;
    /** S3/MinIO object key. Persist this so the backend can regenerate fresh URLs. */
    objectKey?: string;
    /** Fresh presigned URL generated by the backend per response. Do NOT persist; treat as ephemeral. */
    url?: string;
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
    positiveHistology?: boolean | null;
    intraoperativePurulence?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Aggregate episode payloads for the atomic /episodes/{id}/full endpoints.
 * GET returns the raw entities the editor consumes; POST/PUT send a single
 * payload whose child `id` (number) drives create/update/delete server-side.
 */
export interface IEpisodeFullResponse {
    episode: IEpisode;
    medicalHistory: IMedicalHistory | null;
    clinicalRecord: IClinicalRecord | null;
    surgeries: ISurgery[];
    labResults: ILabResult[];
    imageResults: IImageResult[];
    cultureResults: ICultureResult[];
    sensitivityMap: Record<string, ISensitivityResult[]>;
}

export interface IEpisodeFullSurgeryItem {
    id?: number;
    surgeryDate?: string;
    surgeryType?: string;
    findings?: string;
    positiveHistology?: boolean | null;
    intraoperativePurulence?: boolean | null;
}

export interface IEpisodeFullImageItem {
    id?: number;
    type?: string;
    findings?: string;
    fileMetadata?: string;
    bucket?: string;
    objectKey?: string;
}

export interface IEpisodeFullSensitivityItem {
    id?: number;
    antibioticName?: string;
    micValue?: string;
    sensitivityCode?: string;
}

export interface IEpisodeFullCultureItem {
    id?: number;
    name?: string;
    result?: string;
    gramType?: string;
    sampleType?: string;
    incubationDays?: number;
    antibioticed?: boolean;
    daysOffAntibio?: number;
    notes?: string;
    sensitivities?: IEpisodeFullSensitivityItem[];
}

export interface IEpisodeFullRequest {
    episode: IEpisodeRequest;
    medicalHistory?: Partial<IMedicalHistory>;
    clinicalRecord?: Partial<IClinicalRecord>;
    labResult?: Partial<ILabResult>;
    surgeries?: IEpisodeFullSurgeryItem[];
    images?: IEpisodeFullImageItem[];
    cultures?: IEpisodeFullCultureItem[];
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
    runNo?: number;
    recommendationScope?: RecommendationScope;
    modelName?: string;
    latencyMs?: number;
    errorMessage?: string;
    dataCompletenessJson?: IDataCompleteness;
    pendingTasksSaved?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface IRuleBasedDiagnosticResult {
    id?: string;
    title?: string;
    itemJson?: Record<string, any>;
    assessmentJson?: Record<string, any>;
    explanationJson?: Record<string, any>;
    createdAt?: string;
    updatedAt?: string;
}

export interface IDataCompleteness {
    is_complete?: boolean;
    missing_items?: IMissingItem[];
    completeness_score?: string;
    impact_note?: string;
}

export interface IMissingItem {
    field?: string;
    category?: string;
    importance?: string;
    message?: string;
    input_type?: 'lab' | 'clinical' | 'culture';
    section?: 'hematology' | 'fluid' | 'biochemical';
    unit?: string;
    normal_range?: string;
}

export interface IPendingLabTask {
    id?: number;
    episode?: { id?: number };
    patient?: { id?: number; fullName?: string; patientCode?: string };
    assignedToUserId?: number;
    field?: string;
    category?: string;
    importance?: string;
    message?: string;
    status?: string;
    inputType?: 'lab' | 'clinical' | 'culture';
    section?: 'hematology' | 'fluid' | 'biochemical';
    unit?: string;
    normalRange?: string;
    createdFromRunId?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface IAiRecommendationItem {
    id?: string;
    clientItemKey?: string;
    category?: 'SYSTEMIC_ANTIBIOTIC' | 'SURGERY_PROCEDURE' | 'LOCAL_ANTIBIOTIC' | 'ANTIBIOTIC_CARE_PLAN';
    title?: string;
    priorityOrder?: number;
    isPrimary?: boolean;
    itemJson?: Record<string, any>;
}

export interface IAiRagCitation {
    id?: string;
    sourceType?: string;
    sourceTitle?: string;
    sourceUri?: string;
    snippet?: string;
    relevanceScore?: number;
    citedFor?: string;
}

export interface IAiRecommendationRunDetail {
    run?: IAiRecommendationRun;
    diagnostic?: IRuleBasedDiagnosticResult;
    items?: IAiRecommendationItem[];
    citations?: IAiRagCitation[];
}

export type ClinicalDecisionStatus = 'DRAFT' | 'SIGNED';
export type RecommendationScope = 'SURGERY' | 'ANTIBIOTIC' | 'LEGACY_COMBINED';

export interface IClinicalDecisionActor {
    userId?: number;
    fullName?: string;
    email?: string;
}

export interface IDoctorClinicalDecision {
    id?: number;
    status: ClinicalDecisionStatus;
    author?: IClinicalDecisionActor;
    diagnosisJson?: IDoctorDiagnosis;
    surgeryPlanJson?: import('./treatmentType').SurgeryPlanData;
    signedAt?: string;
    revision: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface IPharmacistClinicalDecision {
    id?: number;
    status: ClinicalDecisionStatus;
    author?: IClinicalDecisionActor;
    systemicAntibioticPlanJson?: import('./treatmentType').SystemicPlanData;
    localAntibioticPlanJson?: import('./treatmentType').LocalPlanData;
    carePlanJson?: import('./treatmentType').AntibioticCarePlanData;
    notes?: string;
    signedAt?: string;
    revision: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface IRunClinicalDecision {
    run: IAiRecommendationRun;
    doctorDecision?: IDoctorClinicalDecision;
    pharmacistDecision?: IPharmacistClinicalDecision;
    finalSelection: boolean;
    eligibleForFinal: boolean;
    canEditDoctor: boolean;
    canEditPharmacist: boolean;
    canSelectFinal: boolean;
}

export interface IClinicalDecisionWorkspace {
    episodeId: number;
    finalRunId?: number;
    finalDoctorRunId?: number;
    finalPharmacistRunId?: number;
    runs: IRunClinicalDecision[];
}

export interface IAntibioticCarePlanGeneration {
    requestId: string;
    status: 'SUCCESS';
    model?: {
        name?: string;
        version?: string;
    };
    latencyMs?: number;
    episodeId: number;
    sourceRunId: number;
    sourceRunNo?: number;
    pharmacistName?: string;
    carePlan: Record<string, any>;
    citations?: Array<{
        sourceTitle?: string;
        sourceUri?: string;
        snippet?: string;
    }>;
}

export interface IDoctorRecommendationReview {
    id?: string;
    episode?: IEpisode;
    run?: IAiRecommendationRun;
    episodeId?: number;
    runId?: number;
    reviewStatus?: string;
    reviewNote?: string;
    modificationJson?: Record<string, any>;
    rejectionReason?: string;
    /** Doctor's own final diagnosis (Chẩn đoán bác sĩ step) — snake_case keys. */
    doctorDiagnosisJson?: IDoctorDiagnosis;
    /** True when this run/review is the episode's selected final version. */
    finalDecision?: boolean;
    doctorFinalDecision?: IDoctorFinalDecision;
    createdBy?: string;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface IDoctorFinalDecision {
    id?: string;
    diagnosisJson?: IDoctorDiagnosis;
    surgeryPlanJson?: import('./treatmentType').SurgeryPlanData;
    createdAt?: string;
    updatedAt?: string;
}

export interface IDoctorDiagnosis {
    pji_conclusion?: string; // INFECTED | NOT_INFECTED | INCONCLUSIVE
    infection_classification?: string;
    primary_diagnosis?: string;
    clinical_reasoning?: string;
    identified_organism?: string;
}
