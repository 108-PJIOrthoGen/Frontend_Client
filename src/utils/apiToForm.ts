import { IEpisode } from "@/types/backend";
import { parseDateFromApi } from "./time";
import { EpisodeFormData } from "@/components/user/patient_table/episode/MedicalExamination";

export function episodeToFormData(ep: IEpisode): EpisodeFormData {
    return {
        arrivalTime: parseDateFromApi(ep.admissionDate),
        dischargeTime: parseDateFromApi(ep.dischargeDate),
        department: ep.department ?? '',
        admissionMethod: ep.direct ?? '',
        reason: ep.reason ?? '',
        referralSource: ep.referralSource ?? '',
        treatmentDays: ep.treatmentDays != null ? String(ep.treatmentDays) : '',
        treatmentResult: ep.result ?? '',
        status: ep.status ?? '',
    };
}

export function formDataToEpisodeRequest(form: EpisodeFormData) {
    return {
        admissionDate: form.arrivalTime || undefined,
        dischargeDate: form.dischargeTime || undefined,
        department: form.department || undefined,
        direct: form.admissionMethod || undefined,
        reason: form.reason || undefined,
        referralSource: form.referralSource || undefined,
        treatmentDays: form.treatmentDays ? Number(form.treatmentDays) : undefined,
        result: form.treatmentResult || undefined,
        status: form.status || undefined,
    };
}