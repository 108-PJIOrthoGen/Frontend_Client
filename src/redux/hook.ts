import { useCallback, useRef } from 'react';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState, store } from '@/redux/store';
import { setDemographics, setClinical } from '@/redux/slice/patientSlice';
import { Demographics, ClinicalAssessment } from '@/types/types';


export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Hook that mimics the old useState-style `setDemographics(prev => ...)` pattern
 */
export function useDemographics() {
    const demographics = useAppSelector(state => state.patient.demographics);
    const dispatch = useAppDispatch();

    const updateDemographics = useCallback(
        (updater: Demographics | ((prev: Demographics) => Demographics)) => {
            if (typeof updater === 'function') {
                const latestState = store.getState().patient.demographics;
                dispatch(setDemographics(updater(latestState)));
            } else {
                dispatch(setDemographics(updater));
            }
        },
        [dispatch]
    );

    return { demographics, setDemographics: updateDemographics };
}

/**
 * Hook that mimics the old useState-style `setClinical(prev => ...)` pattern
 */
export function useClinical() {
    const clinical = useAppSelector(state => state.patient.clinical);
    const dispatch = useAppDispatch();

    const updateClinical = useCallback(
        (updater: ClinicalAssessment | ((prev: ClinicalAssessment) => ClinicalAssessment)) => {
            if (typeof updater === 'function') {
                const latestState = store.getState().patient.clinical;
                dispatch(setClinical(updater(latestState)));
            } else {
                dispatch(setClinical(updater));
            }
        },
        [dispatch]
    );

    return { clinical, setClinical: updateClinical };
}
