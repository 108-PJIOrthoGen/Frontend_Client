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

export const patientPersistenceMiddleware = createListenerMiddleware();

patientPersistenceMiddleware.startListening({
    actionCreator: setCurrentCase,
    effect: (action) => {
        saveCurrentCase(action.payload);
    },
});

patientPersistenceMiddleware.startListening({
    actionCreator: clearCurrentCase,
    effect: () => {
        clearStoredCurrentCase();
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
