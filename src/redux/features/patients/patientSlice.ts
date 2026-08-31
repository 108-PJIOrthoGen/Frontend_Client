import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { callFetchPatient } from '@/apis/api';
import { IModelPaginate, IPatient } from '@/types/backend';
import { IClinicFormState } from '@/types/types';
import { labsForGroup } from '@/constants/canonicalLabRegistry';
import {
    loadClinicForm,
    loadCurrentCase,
    type CurrentCase,
} from './patientStorage';

interface IState {
    isFetching: boolean;
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    },
    result: IPatient[];
    currentCase: CurrentCase | null;
    clinicForm: IClinicFormState;
}

export const fetchPatient = createAsyncThunk(
    'patient/fetchPatient',
    async ({ query }: { query: string }) => {
        const response = await callFetchPatient(query);
        return response;
    }
)

export const defaultClinicForm: IClinicFormState = {
    // Checkboxes express observed symptoms. An unchecked box is a documented
    // negative finding, not missing evidence, so persist it as false.
    clinicalRecord: {
        fever: false,
        pain: false,
        erythema: false,
        swelling: false,
        sinusTract: false,
    },
    medicalHistory: {},
    surgeries: [{ _tempId: '1', surgeryDate: '', surgeryType: '', findings: '' }],
    cultureResults: [{
        _tempId: 'default-1',
        sampleNumber: 1,
        name: '',
        incubationDays: undefined,
        result: '',
        notes: '',
        gramType: '',
        antibioticed: false,
        daysOffAntibio: 0,
    }],
    formImages: [],
    imagingDescription: '',
    hematologyTests: labsForGroup('hematologyTests'),
    biochemistryTests: labsForGroup('biochemistryTests'),
    fluidAnalysis: labsForGroup('fluidAnalysis'),
    surgeryDate: '',
    isAcute: false,
};

const initialState: IState = {
    isFetching: true,
    meta: {
        page: 1,
        pageSize: 10,
        pages: 0,
        total: 0
    },
    result: [],
    currentCase: loadCurrentCase(),
    clinicForm: loadClinicForm(defaultClinicForm),
};


export const patientSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setCurrentCase: (state, action: PayloadAction<CurrentCase>) => {
            state.currentCase = action.payload;
        },
        clearCurrentCase: (state) => {
            state.currentCase = null;
        },
        setClinicForm: (state, action: PayloadAction<IClinicFormState>) => {
            state.clinicForm = action.payload;
        },
        resetClinicForm: (state) => {
            state.clinicForm = defaultClinicForm;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchPatient.pending, (state, action) => {
            state.isFetching = true;
        })

        builder.addCase(fetchPatient.rejected, (state, action) => {
            state.isFetching = false;
        })

        builder.addCase(fetchPatient.fulfilled, (state, action) => {
            const payload = action.payload;
            if (payload && payload.data) {
                const pageData = payload.data as unknown as IModelPaginate<IPatient>;
                state.isFetching = false;
                state.meta = pageData.meta;
                state.result = pageData.result;
            }
        })
    },

});

export const {
    setCurrentCase,
    clearCurrentCase,
    setClinicForm,
    resetClinicForm,
} = patientSlice.actions;

export default patientSlice.reducer;
