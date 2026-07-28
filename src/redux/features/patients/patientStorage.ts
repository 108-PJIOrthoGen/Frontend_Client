import type { IEpisode, IPatient } from '@/types/backend';
import type { IClinicFormState } from '@/types/types';

export interface CurrentCase {
    patient: IPatient;
    episode: IEpisode;
}

const CURRENT_CASE_KEY = 'pji_currentCase';
const CLINIC_FORM_KEY = 'pji_clinicForm';

const readStoredValue = <T>(key: string, fallback: T): T => {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    } catch {
        return fallback;
    }
};

export const loadCurrentCase = (): CurrentCase | null =>
    readStoredValue<CurrentCase | null>(CURRENT_CASE_KEY, null);

export const loadClinicForm = (
    fallback: IClinicFormState,
): IClinicFormState =>
    readStoredValue(CLINIC_FORM_KEY, fallback);

export const saveCurrentCase = (currentCase: CurrentCase): void => {
    localStorage.setItem(CURRENT_CASE_KEY, JSON.stringify(currentCase));
};

export const clearStoredCurrentCase = (): void => {
    localStorage.removeItem(CURRENT_CASE_KEY);
};

export const saveClinicForm = (form: IClinicFormState): void => {
    localStorage.setItem(CLINIC_FORM_KEY, JSON.stringify(form));
};

export const clearStoredClinicForm = (): void => {
    localStorage.removeItem(CLINIC_FORM_KEY);
};
