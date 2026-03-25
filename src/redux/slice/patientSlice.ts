import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { callFetchPatient } from '@/apis/api';
import { IModelPaginate, IPatient, IEpisode } from '@/types/backend';
import { Demographics, ClinicalAssessment } from '@/types/types';

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
    demographics: Demographics;
    clinical: ClinicalAssessment;
}
// First, create the thunk
export const fetchPatient = createAsyncThunk(
    'patient/fetchPatient',
    async ({ query }: { query: string }) => {
        const response = await callFetchPatient(query);
        return response;
    }
)

const defaultCharacteristic = { checked: false, note: '' };

const defaultDemographics: Demographics = {
    medicalHistory: '',
    pastMedicalHistory: '',
    antibioticHistory: '',
    surgeryDate: '',
    symptomDate: '',
    isAcute: false,
    dob: '',
    gender: '',
    relatedCharacteristics: {
        allergy: { ...defaultCharacteristic },
        drugs: { ...defaultCharacteristic },
        alcohol: { ...defaultCharacteristic },
        smoking: { ...defaultCharacteristic },
        other: { ...defaultCharacteristic },
    },
    surgicalHistory: [{ id: '1', surgeryDate: '', procedure: '', notes: '' }],
};

export const defaultClinical: ClinicalAssessment = {
    major: { sinusTract: false, twoPositiveCultures: false },
    examination: {
        date_on_illness: '',
        whole_body: '',
        vessel: '',
        temperature: '',
        blood_press: '',
        breath: '',
        bmi: '',
    },
    symptoms: {
        fever: false,
        sinusTract: false,
        erythema: false,
        pain: false,
        swelling: false,
        drainage: false,
        purulence: false,
    },
    imaging: {
        description: '',
        images: []
    },
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
    cultureSamples: [
        {
            id: 'default-1',
            sampleNumber: 1,
            bacteriaName: '',
            incubation_days: '' as '',
            used_antibiotic_before: false,
            days_off_antibiotic: '' as '',
            notes: '',
            result: '' as any
        }
    ],
};

const loadDemographics = (): Demographics => {
    try {
        const saved = localStorage.getItem('pji_demographics');
        return saved ? JSON.parse(saved) : defaultDemographics;
    } catch {
        return defaultDemographics;
    }
};

const loadCurrentCase = (): ICurrentCase | null => {
    try {
        const saved = localStorage.getItem('pji_currentCase');
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
};

const loadClinical = (): ClinicalAssessment => {
    try {
        const saved = localStorage.getItem('pji_clinical');
        return saved ? JSON.parse(saved) : defaultClinical;
    } catch {
        return defaultClinical;
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
    demographics: loadDemographics(),
    clinical: loadClinical(),
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
        setDemographics: (state, action: PayloadAction<Demographics>) => {
            state.demographics = action.payload;
            localStorage.setItem('pji_demographics', JSON.stringify(action.payload));
        },
        resetDemographics: (state) => {
            state.demographics = defaultDemographics;
            localStorage.removeItem('pji_demographics');
        },
        setClinical: (state, action: PayloadAction<ClinicalAssessment>) => {
            state.clinical = action.payload;
            localStorage.setItem('pji_clinical', JSON.stringify(action.payload));
        },
        resetClinical: (state) => {
            state.clinical = defaultClinical;
            localStorage.removeItem('pji_clinical');
        },
    },
    extraReducers: (builder) => {
        // Add reducers for additional action types here, and handle loading state as needed
        builder.addCase(fetchPatient.pending, (state, action) => {
            state.isFetching = true;

        })

        builder.addCase(fetchPatient.rejected, (state, action) => {
            state.isFetching = false;

        })

        builder.addCase(fetchPatient.fulfilled, (state, action) => {
            const payload = action.payload;
            if (payload && payload.data) {
                //Cast payload.data as IModelPaginate<IRole> before reading meta/result.
                const pageData = payload.data as unknown as IModelPaginate<IPatient>;
                state.isFetching = false;
                state.meta = pageData.meta;
                state.result = pageData.result;
            }

            // state.courseOrder = action.payload;
        })
    },

});

export const {
    setActiveMenu,
    setCurrentCase,
    clearCurrentCase,
    setDemographics,
    resetDemographics,
    setClinical,
    resetClinical,
} = patientSlice.actions;

export default patientSlice.reducer;
