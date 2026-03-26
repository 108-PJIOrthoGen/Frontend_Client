import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { callFetchPatient } from '@/apis/api';
import { IModelPaginate, IPatient, IEpisode } from '@/types/backend';
import { IClinicFormState } from '@/types/types';

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
        usedAntibioticBefore: false,
        daysOffAntibiotic: '',
    }],
    formImages: [],
    imagingDescription: '',
    hematologyTests: [
        { id: 'ht_1', name: 'wbc', result: '', normalRange: '', unit: 'G/L' },
        { id: 'ht_2', name: '%NEUT', result: '', normalRange: '40 - 74', unit: '%' },
        { id: 'ht_4', name: '%MONO', result: '', normalRange: '3.4 - 9', unit: '%' },
        { id: 'ht_7', name: 'Máu lắng', result: '', normalRange: '< 10', unit: 'mm' },
        { id: 'ht_9', name: 'RBC', result: '', normalRange: '3.8 - 5.5', unit: 'x10^12/L' },
        { id: 'ht_12', name: 'MCV', result: '', normalRange: '75 - 96', unit: 'fL' },
        { id: 'ht_13', name: 'MCH', result: '', normalRange: '24 - 33', unit: 'pg' },
        { id: 'ht_15', name: 'RDW-CV', result: '', normalRange: '11.5 - 14.5', unit: '%' },
        { id: 'ht_16', name: 'IG%', result: '', normalRange: '6 - 11', unit: 'fL' },
        { id: 'ht_17', name: 'D-dimer', result: '', normalRange: '< 0.5', unit: 'mg/L FEU' },
        { id: 'ht_18', name: 'Serum IL-6', result: '', normalRange: '< 7.0', unit: 'pg/mL' },
        { id: 'ht_19', name: 'Alpha Defensin', result: '', normalRange: '< 0.12', unit: 'ug/mL' },
    ],
    biochemistryTests: [
        { id: 'bc_4', name: 'Định lượng Glucose', result: '', normalRange: '4.1 - 5.6', unit: 'mmol/l' },
        { id: 'bc_5', name: 'Định lượng Urê máu', result: '', normalRange: '2.8 - 7.2', unit: 'mmol/l' },
        { id: 'bc_6', name: 'Định lượng Creatinin', result: '', normalRange: '59 - 104', unit: 'µmol/l' },
        { id: 'ht_20', name: 'eGFR', result: '', normalRange: '>= 90', unit: 'mL/min/1.73m²' },
        { id: 'bc_7', name: 'Định lượng Albumin', result: '', normalRange: '35 - 52', unit: 'g/L' },
        { id: 'bc_8', name: 'Hoạt độ AST', result: '', normalRange: '35 - 52', unit: 'U/L' },
        { id: 'bc_9', name: 'Hoạt độ ALT', result: '', normalRange: '35 - 52', unit: 'U/L' },
        { id: 'bc_10', name: 'Na+', result: '', normalRange: '135 - 145', unit: 'mmol/L' },
        { id: 'bc_11', name: 'K+', result: '', normalRange: '3.5 - 5.0', unit: 'mmol/L' },
        { id: 'bc_12', name: 'Cl-', result: '', normalRange: '', unit: 'mmol/L' },
        { id: 'bc_13', name: 'Định lượng HbA1c', result: '', normalRange: '4 - 6.2', unit: '%' },
    ],
    fluidAnalysis: [
        { id: 'fa_1', name: 'Cấy khuẩn', result: '', normalRange: '', unit: 'CFU/mL' },
        { id: 'fa_2', name: 'Nhuộm Gram', result: '', normalRange: '', unit: '' },
        { id: 'fa_3', name: 'Bạch cầu (Dịch)', result: '', normalRange: '', unit: 'Tế bào/Vi trường' },
        { id: 'fa_5', name: 'Định lượng CRP (Dịch)', result: '', normalRange: '', unit: 'mg/l' },
        { id: 'fa_6', name: '%PMN (Dịch)', result: '', normalRange: '', unit: '%' },
    ],
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
        setActiveMenu: (state, action) => {
            // state.activeMenu = action.payload;
        },
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
    setActiveMenu,
    setCurrentCase,
    clearCurrentCase,
    setClinicForm,
    resetClinicForm,
} = patientSlice.actions;

export default patientSlice.reducer;
