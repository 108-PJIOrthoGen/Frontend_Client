import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ClinicalAssessment, LabResult, TreatmentPlan } from '../types/types';

interface PatientContextType {
  clinical: ClinicalAssessment;
  setClinical: React.Dispatch<React.SetStateAction<ClinicalAssessment>>;
  resetClinical: () => void;
  labData: LabResult[];
  updateLabData: (day: string, field: keyof LabResult, value: number) => void;
  treatment: TreatmentPlan;
  setTreatment: React.Dispatch<React.SetStateAction<TreatmentPlan>>;
}



const defaultClinical: ClinicalAssessment = {
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
  diagnosis: { score: 0, probability: 0, status: 'Inconclusive', reasoning: [] },
};

const defaultLabs: LabResult[] = [
  { day: 'Trước mổ', wbc: 6.5, neu: 55, esr: 12, crp: 4.0 },
  { day: '7/3/2026', wbc: 12.1, neu: 82, esr: 45, crp: 145 },
  { day: '5/4/2026', wbc: 9.8, neu: 65, esr: 38, crp: 85 },
  { day: '6/5/2026', wbc: null, neu: null, esr: null, crp: null },
];

const defaultTreatment: TreatmentPlan = {
  pathogen: 'mrsa',
  resistance: 'vancomycin',
  ivDrug: 'Daptomycin',
  ivDosage: '6-8 mg/kg IV',
  ivDuration: '2 tuần',
  oralDrug: 'Rifampin + Ciprofloxacin',
  oralDosage: '600mg mỗi ngày / 750mg BID',
  oralDuration: '3-6 tuần',
  citation: '"Đối với PJI do MRSA khi MIC Vancomycin > 1.5 mcg/mL, Daptomycin được khuyến cáo là thuốc tiêm tĩnh mạch chính để tránh thất bại điều trị."',
  confidence: 94,
};

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

  const [clinical, setClinical] = useState<ClinicalAssessment>(() => {
    const saved = localStorage.getItem('pji_clinical');
    return saved ? JSON.parse(saved) : defaultClinical;
  });
  const [labData, setLabData] = useState<LabResult[]>(() => {
    const saved = localStorage.getItem('pji_labData');
    return saved ? JSON.parse(saved) : defaultLabs;
  });
  const [treatment, setTreatment] = useState<TreatmentPlan>(() => {
    const saved = localStorage.getItem('pji_treatment');
    return saved ? JSON.parse(saved) : defaultTreatment;
  });

  // Removed the useEffect block because React state might not update cleanly inside it when dealing with deep nested structures like biochemistryTests.
  // Instead, the calculation will be performed in a more controlled manner.

  const resetClinical = () => {
    setClinical(defaultClinical);
    localStorage.removeItem('pji_clinical');
  };

  const updateLabData = (day: string, field: keyof LabResult, value: number) => {
    setLabData(prev => prev.map(item => item.day === day ? { ...item, [field]: value } : item));
  };

  return (
    <PatientContext.Provider value={{
      clinical, setClinical, resetClinical,
      labData, updateLabData,
      treatment, setTreatment
    }}>
      {children}
    </PatientContext.Provider>
  );
};

export const usePatient = () => {
  const context = useContext(PatientContext);
  if (!context) throw new Error("usePatient must be used within a PatientProvider");
  return context;
};