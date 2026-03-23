import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { callFetchPatient } from '@/apis/api';
import { IModelPaginate, IPatient, IEpisode } from '@/types/backend';
import { Demographics } from '@/types/types';

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
} = patientSlice.actions;

export default patientSlice.reducer;
