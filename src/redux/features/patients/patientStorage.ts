import type { IEpisode, IPatient } from '@/types/backend';
import type { IClinicFormState } from '@/types/types';

export interface CurrentCase {
    patient: IPatient;
    episode: IEpisode;
}

let currentCaseValue: CurrentCase | null = null;
let clinicFormValue: IClinicFormState | null = null;

export const loadCurrentCase = (): CurrentCase | null =>
    currentCaseValue;

export const loadClinicForm = (
    fallback: IClinicFormState,
): IClinicFormState =>
    clinicFormValue ?? fallback;

export const saveCurrentCase = (currentCase: CurrentCase): void => {
    currentCaseValue = currentCase;
};

export const clearStoredCurrentCase = (): void => {
    currentCaseValue = null;
};

export const saveClinicForm = (form: IClinicFormState): void => {
    clinicFormValue = form;
};

export const clearStoredClinicForm = (): void => {
    clinicFormValue = null;
};
