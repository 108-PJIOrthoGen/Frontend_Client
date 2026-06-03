import { useCallback } from 'react';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState, store } from '@/redux/store';
import { setClinicForm } from '@/redux/slice/patientSlice';
import { IClinicFormState } from '@/types/types';


export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Unified hook replacing useDemographics + useClinical.
 * Stores backend types directly — no intermediate mapping.
 */
export function useClinicForm() {
    const form = useAppSelector(state => state.patient.clinicForm);
    const dispatch = useAppDispatch();

    const setForm = useCallback(
        (updater: IClinicFormState | ((prev: IClinicFormState) => IClinicFormState)) => {
            // Tại sao dùng store.getState() thay vì đọc form từ selector?
            //Đây là chi tiết quan trọng nhất. Khi dùng useCallback với [dispatch], closure của setForm không capture lại form khi state thay đổi — nếu dùng form từ selector bên trong, nó sẽ là giá trị cũ (stale closure).
            if (typeof updater === 'function') {
                const latestState = store.getState().patient.clinicForm;
                dispatch(setClinicForm(updater(latestState)));
            } else {
                dispatch(setClinicForm(updater));
            }
        },
        [dispatch]
    );

    return { form, setForm };
}
