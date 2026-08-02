import { IEpisode, IEpisodeDepartmentTransfer } from "@/types/backend";
import { parseDateFromApi } from "./time";
import { EpisodeFormData } from "@/components/user/patient_table/episode/MedicalExamination";

const toOptionalNumber = (value: string): number | undefined =>
    value === '' || value == null ? undefined : Number(value);

const transferToFormData = (transfer: IEpisodeDepartmentTransfer) => ({
    department: transfer.department ?? '',
    admissionDate: parseDateFromApi(transfer.admissionDate),
    admissionTime: transfer.admissionTime ?? '',
    treatmentDays: transfer.treatmentDays != null ? String(transfer.treatmentDays) : '',
});

export function episodeToFormData(ep: IEpisode): EpisodeFormData {
    return {
        admissionDate: parseDateFromApi(ep.admissionDate),
        dischargeDate: parseDateFromApi(ep.dischargeDate),
        department: ep.department ?? '',
        admissionMethod: ep.direct ?? '',
        reason: ep.reason ?? '',
        referralSource: ep.referralSource ?? '',
        admissionCount: ep.admissionCount != null ? String(ep.admissionCount) : '',
        treatmentDays: ep.treatmentDays != null ? String(ep.treatmentDays) : '',
        initialDepartmentTreatmentDays:
            ep.initialDepartmentTreatmentDays != null ? String(ep.initialDepartmentTreatmentDays) : '',
        initialDepartmentAdmissionDate: parseDateFromApi(ep.initialDepartmentAdmissionDate),
        departmentTransfers: (ep.departmentTransfers ?? []).map(transferToFormData),
        hospitalTransferType: ep.hospitalTransferType ?? '',
        hospitalTransferDestination: ep.hospitalTransferDestination ?? '',
        dischargeDisposition: ep.dischargeDisposition ?? '',
        referralDiagnosis: ep.referralDiagnosis ?? '',
        emergencyDiagnosis: ep.emergencyDiagnosis ?? '',
        inpatientDiagnosis: ep.inpatientDiagnosis ?? '',
        hasIncident: ep.hasIncident ?? false,
        hasComplication: ep.hasComplication ?? false,
        complicationCause: ep.complicationCause ?? '',
        postoperativeTreatmentDays:
            ep.postoperativeTreatmentDays != null ? String(ep.postoperativeTreatmentDays) : '',
        surgeryCount: ep.surgeryCount != null ? String(ep.surgeryCount) : '',
        dischargePrimaryDiagnosis: ep.dischargePrimaryDiagnosis ?? '',
        dischargeCause: ep.dischargeCause ?? '',
        accompanyingDisease: ep.accompanyingDisease ?? '',
        preoperativeDiagnosis: ep.preoperativeDiagnosis ?? '',
        postoperativeDiagnosis: ep.postoperativeDiagnosis ?? '',
        treatmentResult: ep.result ?? '',
        status: ep.status ?? '',
    };
}

export function formDataToEpisodeRequest(form: EpisodeFormData) {
    return {
        admissionDate: form.admissionDate || undefined,
        dischargeDate: form.dischargeDate || undefined,
        department: form.department || undefined,
        direct: form.admissionMethod || undefined,
        reason: form.reason || undefined,
        referralSource: form.referralSource || undefined,
        admissionCount: toOptionalNumber(form.admissionCount),
        treatmentDays: toOptionalNumber(form.treatmentDays),
        initialDepartmentTreatmentDays: toOptionalNumber(form.initialDepartmentTreatmentDays),
        initialDepartmentAdmissionDate: form.initialDepartmentAdmissionDate || undefined,
        departmentTransfers: form.departmentTransfers
            .filter((transfer) => transfer.department || transfer.admissionDate || transfer.admissionTime || transfer.treatmentDays)
            .map((transfer) => ({
                department: transfer.department || undefined,
                admissionDate: transfer.admissionDate || undefined,
                admissionTime: transfer.admissionTime || undefined,
                treatmentDays: toOptionalNumber(transfer.treatmentDays),
            })),
        hospitalTransferType: form.hospitalTransferType || undefined,
        hospitalTransferDestination: form.hospitalTransferDestination || undefined,
        dischargeDisposition: form.dischargeDisposition || undefined,
        referralDiagnosis: form.referralDiagnosis || undefined,
        emergencyDiagnosis: form.emergencyDiagnosis || undefined,
        inpatientDiagnosis: form.inpatientDiagnosis || undefined,
        hasIncident: form.hasIncident,
        hasComplication: form.hasComplication,
        complicationCause: form.complicationCause || undefined,
        postoperativeTreatmentDays: toOptionalNumber(form.postoperativeTreatmentDays),
        surgeryCount: toOptionalNumber(form.surgeryCount),
        dischargePrimaryDiagnosis: form.dischargePrimaryDiagnosis || undefined,
        dischargeCause: form.dischargeCause || undefined,
        accompanyingDisease: form.accompanyingDisease || undefined,
        preoperativeDiagnosis: form.preoperativeDiagnosis || undefined,
        postoperativeDiagnosis: form.postoperativeDiagnosis || undefined,
        result: form.treatmentResult || undefined,
        status: form.status || undefined,
    };
}
