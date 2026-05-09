import React, { useEffect } from 'react';
import { Input } from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useClinicForm } from '@/redux/hook';
import { IPatient } from '@/types/backend';
import { getTestStatus } from './utils/testStatus';

dayjs.extend(customParseFormat);

// Patient DOB is persisted as "DD-MM-YYYY" (see PatientModal), but backend
// payloads may also return ISO strings. Try the known formats in order, then
// fall back to dayjs's default parser.
const parseDob = (raw?: string) => {
  if (!raw) return null;
  const known = ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];
  for (const fmt of known) {
    const d = dayjs(raw, fmt, true);
    if (d.isValid()) return d;
  }
  const fallback = dayjs(raw);
  return fallback.isValid() ? fallback : null;
};

// CKD-EPI 2021 race-free formula. Creatinine input is in µmol/L (bc_6's unit).
// Returns an empty string when age/creatinine aren't usable so the eGFR cell
// clears instead of holding a stale value.
const calculateEgfr = (
  creatinineUmolL: string,
  patient?: IPatient | null,
): string => {
  if (!creatinineUmolL || isNaN(Number(creatinineUmolL))) return '';
  const dob = parseDob(patient?.dateOfBirth);
  const age = dob ? dayjs().diff(dob, 'year') : 0;
  if (age <= 0) return '';

  const scr = Number(creatinineUmolL) / 88.4;
  const isFemale = patient?.gender?.toLowerCase() === 'female';
  const k = isFemale ? 0.7 : 0.9;
  const alpha = isFemale ? -0.241 : -0.302;
  const scrDivK = scr / k;
  const minVal = Math.min(scrDivK, 1);
  const maxVal = Math.max(scrDivK, 1);
  let egfr =
    142 * Math.pow(minVal, alpha) * Math.pow(maxVal, -1.2) * Math.pow(0.9938, age);
  if (isFemale) egfr *= 1.012;
  return Math.round(egfr).toString();
};

interface Props {
  patient?: IPatient | null;
}

const BiochemistryTestsTable: React.FC<Props> = ({ patient }) => {
  const { form: clinicForm, setForm } = useClinicForm();

  // Recompute eGFR whenever creatinine, DOB, or gender change. This covers
  // programmatic creatinine writes (lab-result hydration, quick-import,
  // image extraction) — the bc_6 onChange path alone misses those. eGFR's
  // row id is 'ht_20' but it lives in biochemistryTests (see patientSlice).
  const creatinineResult =
    clinicForm.biochemistryTests?.find((t) => t.id === 'bc_6')?.result ?? '';
  const dob = patient?.dateOfBirth;
  const gender = patient?.gender;
  useEffect(() => {
    const expected = calculateEgfr(creatinineResult, { dateOfBirth: dob, gender });
    setForm((prev) => {
      const current =
        prev.biochemistryTests.find((t) => t.id === 'ht_20')?.result ?? '';
      if (current === expected) return prev;
      return {
        ...prev,
        biochemistryTests: prev.biochemistryTests.map((t) =>
          t.id === 'ht_20' ? { ...t, result: expected } : t,
        ),
      };
    });
  }, [creatinineResult, dob, gender, setForm]);

  return (
    <div className="border-b border-slate-200">
      <div className="bg-gradient-to-r from-green-50 to-slate-50 px-6 py-3 border-b border-green-100">
        <h4 className="text-green-900 font-bold text-base flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded bg-green-500/10 text-green-600 text-xs font-bold">
            2
          </span>
          Xét nghiệm sinh hóa
        </h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-700">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 border-r border-slate-200">Tên xét nghiệm</th>
              <th className="px-4 py-3 border-r border-slate-200 w-32">Kết quả</th>
              <th className="px-4 py-3 border-r border-slate-200 w-16 text-center">Ghi chú</th>
              <th className="px-4 py-3 border-r border-slate-200 w-32">Chỉ số BT</th>
              <th className="px-4 py-3">Đơn vị</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {clinicForm.biochemistryTests?.map((test, index) => (
              <tr key={test.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-2 font-medium text-slate-900 border-r border-slate-200">{test.name}</td>
                <td className="px-4 py-2 border-r border-slate-200 p-0">
                  <Input
                    type="text"
                    value={test.result}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        biochemistryTests: prev.biochemistryTests.map((t, i) =>
                          i === index ? { ...t, result: newValue } : t,
                        ),
                      }));
                    }}
                    className="w-full h-full px-4 py-2 border-none bg-transparent"
                  />
                </td>
                <td className="px-4 py-2 border-r border-slate-200 text-center font-bold">
                  {(() => {
                    const status = getTestStatus(test.result, test.normalRange);
                    return status ? (
                      <span className={status === 'H' ? 'text-red-600 font-bold' : 'text-yellow-600 font-bold'}>
                        {status}
                      </span>
                    ) : null;
                  })()}
                </td>
                <td className="px-4 py-2 border-r border-slate-200 text-slate-700">{test.normalRange}</td>
                <td className="px-4 py-2 text-slate-500 bg-slate-50/30">{test.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BiochemistryTestsTable;
