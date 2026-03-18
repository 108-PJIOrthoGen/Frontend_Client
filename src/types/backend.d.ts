export interface IBackendRes<T> {
    error?: string | string[];
    message: string;
    statusCode: number | string;
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

export interface IMedicalExam {
    id?: string;
    arrivalTime?: string; // LocalDate -> string
    receptionTime?: string;
    referralSource?: string;
    symptoms?: string;
    reason?: string;
    daysOfSymptoms?: number;

    hasAllergy?: boolean;
    allergyMonths?: number;

    usesDrugs?: boolean;
    drugsMonths?: number;

    usesAlcohol?: boolean;
    alcoholMonths?: number;

    usesTobacco?: boolean;
    tobaccoMonths?: number;

    hasOther?: boolean;
    otherMonths?: number;
    otherDescription?: string;

    personalMedicalHistory?: string;
    familyMedicalHistory?: string;

    patient?: string;
    department?: IDepartment;
}

export interface IVitalSign {
    id: number;
    temperature: number;
    height: number;
    weight: number;
    heart_rate: number;
    blood_group: string;
    blood_type: string;
    systolic_bp: number;
    diastolic_bp: number;
    pulse_rate: number;
    respiratory_rate?: number;
    notes?: string;
    medical_exam_id?: IMedicalExamRes;
}

export interface IBloodTest {
    id?: string;
    conclusion?: string;
    glucose?: number;
    urea?: number;
    rbc?: number;
    hb?: number;
    hct?: number;
    mcv?: number;
    mch?: number;
    wbc?: number;
    neut?: number;
    blood_group?: string;
    blood_type?: string;
    image_url?: string;
    clinical_services?: IClinicalService;
    medical_exam_id?: IMedicalExam;
}

export interface IRadiology {
    id?: string;
    image_path?: string;
    conclusion?: string;
    patient_id?: number;
    clinical_service_id?: IClinicalService; // 
    medical_exam_id?: IMedicalExamRes;
}

export interface IDiagnose {
    id?: string;
    main_disease?: string;
    comorbidity?: string;
    conclusion?: string;
    prognosis?: string;
    treatment_plan?: string;
    patient_id?: number;
    medical_exam_id?: MedicalExamRes;
}

export interface IClinicalInfo {
    id?: number;
    medical_exam_id?: string;
    clinical_services?: IClinicalService[]; // Set -> Array

    circulatory_diagnosis?: string;
    respiratory_diagnosis?: string;
    genitourinary_diagnosis?: string;
    bone_diagnosis?: string;
    digestive_diagnosis?: string;
    nervous_diagnosis?: string;
    ent_diagnosis?: string;
    other_diagnoses?: string;
    syndrome?: string;
}

export interface IDepartment {
    id?: string;
    name?: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface IClinicalService {
    id?: string;
    serviceName?: string;
}

export interface IMedicalExamRes {
    id?: string;
    patientId?: number;
    department?: string;
}

export interface IMedicalExamFull {
    id?: string;
    arrivalTime?: string;
    dischargeTime?: string;
    department?: string;
    admissionMethod?: string;
    referralSource?: string;
    treatmentDays?: number;
    treatmentResult?: string;
    status?: string;
    patient?: IPatient;
    createdAt?: string;
    updatedAt?: string;
}
export interface IAppointment {
    id?: string;
    full_name?: string;
    contact?: string;
    appointment_start_time?: string;
    phone?: string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
    status?: 'PENDING' | 'SCHEDULED' | 'CANCELED';
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

export interface IPayment {
    id?: string;
    patientId?: string;
    patientCode?: string;
    patientName?: string;
    invoiceNumber?: string;
    invoiceDate?: string;
    serviceCharge?: number;
    medicineCharge?: number;
    examinationFee?: number;
    treatmentFee?: number;
    laboratoryFee?: number;
    radiologyFee?: number;
    otherCharge?: number;
    discount?: number;
    discountReason?: string;
    totalAmount?: number;
    amountPaid?: number;
    remainingAmount?: number;
    paymentStatus?: 'UNPAID' | 'PARTIAL' | 'PAID' | 'CANCELLED';
    paymentMethod?: 'CASH' | 'BANK' | 'INSURANCE' | 'OTHER';
    paymentDate?: string;
    notes?: string;
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
}