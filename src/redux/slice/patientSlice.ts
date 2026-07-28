import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { callFetchPatient } from '@/apis/api';
import { IModelPaginate, IPatient, IEpisode } from '@/types/backend';
import { IClinicFormState } from '@/types/types';
import { labsForGroup } from '@/constants/canonicalLabRegistry';

interface ICurrentCase {
    patient: IPatient;
    episode: IEpisode;
}

interface IState {
    isFetching: boolean;
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    },
    result: IPatient[];
    currentCase: ICurrentCase | null;
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
    clinicalRecord: {},
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

const loadCurrentCase = (): ICurrentCase | null => {
    try {
        const saved = localStorage.getItem('pji_currentCase');
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
};

const loadClinicForm = (): IClinicFormState => {
    try {
        const saved = localStorage.getItem('pji_clinicForm');
        return saved ? JSON.parse(saved) : defaultClinicForm;
    } catch {
        return defaultClinicForm;
    }
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
    clinicForm: loadClinicForm(),
};


export const patientSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setCurrentCase: (state, action: PayloadAction<ICurrentCase>) => {
            state.currentCase = action.payload;
            localStorage.setItem('pji_currentCase', JSON.stringify(action.payload));
        },
        clearCurrentCase: (state) => {
            state.currentCase = null;
            localStorage.removeItem('pji_currentCase');
        },
        setClinicForm: (state, action: PayloadAction<IClinicFormState>) => {
            state.clinicForm = action.payload;
            localStorage.setItem('pji_clinicForm', JSON.stringify(action.payload));
        },
        resetClinicForm: (state) => {
            state.clinicForm = defaultClinicForm;
            localStorage.removeItem('pji_clinicForm');
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
