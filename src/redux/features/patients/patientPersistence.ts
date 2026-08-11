import { createListenerMiddleware } from '@reduxjs/toolkit';
import {
    clearCurrentCase,
    resetClinicForm,
    setClinicForm,
    setCurrentCase,
} from './patientSlice';
import {
    clearStoredClinicForm,
    clearStoredCurrentCase,
    saveClinicForm,
    saveCurrentCase,
} from './patientStorage';
import { runLogoutAction } from '@/redux/slice/accountSlice';
import {
    activateDiagnosisWorkflow,
    clearDiagnosisWorkflowSession,
    createDiagnosisWorkflowScope,
} from '@/features/diagnosis/diagnosisWorkflowSession';

export const patientPersistenceMiddleware = createListenerMiddleware();

patientPersistenceMiddleware.startListening({
    actionCreator: setCurrentCase,
    effect: (action) => {
        saveCurrentCase(action.payload);
        const scope = createDiagnosisWorkflowScope(
            action.payload.patient?.id,
            action.payload.episode?.id,
        );
        if (scope) activateDiagnosisWorkflow(scope);
    },
});

patientPersistenceMiddleware.startListening({
    actionCreator: clearCurrentCase,
    effect: () => {
        clearStoredCurrentCase();
        clearDiagnosisWorkflowSession();
    },
});

patientPersistenceMiddleware.startListening({
    actionCreator: runLogoutAction,
    effect: (_, listenerApi) => {
        clearStoredCurrentCase();
        clearStoredClinicForm();
        clearDiagnosisWorkflowSession();
        listenerApi.dispatch(clearCurrentCase());
        listenerApi.dispatch(resetClinicForm());
    },
});

patientPersistenceMiddleware.startListening({
    actionCreator: setClinicForm,
    effect: (action) => {
        saveClinicForm(action.payload);
    },
});

patientPersistenceMiddleware.startListening({
    actionCreator: resetClinicForm,
    effect: () => {
        clearStoredClinicForm();
    },
});
