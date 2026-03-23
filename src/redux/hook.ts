import { useCallback } from 'react';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { setDemographics } from '@/redux/slice/patientSlice';
import { Demographics } from '@/types/types';


export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Hook that mimics the old useState-style `setDemographics(prev => ...)` pattern
 * so components can use functional updaters with Redux state.
 */
export function useDemographics() {
    const demographics = useAppSelector(state => state.patient.demographics);
    const dispatch = useAppDispatch();

    const updateDemographics = useCallback(
        (updater: Demographics | ((prev: Demographics) => Demographics)) => {
            if (typeof updater === 'function') {
                dispatch(setDemographics(updater(demographics)));
            } else {
                dispatch(setDemographics(updater));
            }
        },
        [demographics, dispatch]
    );

    return { demographics, setDemographics: updateDemographics };
}


