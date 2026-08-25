import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    calculateBmi,
    calculateMedicalTreatmentDays,
    classifyBmi,
    recalculateAllTreatmentDays,
} from './medicalCalculation.ts';

describe('calculateMedicalTreatmentDays - Chuẩn Bộ Y tế', () => {
    it('Vào và ra cùng ngày => 1 ngày điều trị', () => {
        const result = calculateMedicalTreatmentDays('06/08/2026', '06/08/2026');
        assert.equal(result, '1');
    });

    it('Vào ngày trước, ra ngày hôm sau => 1 ngày điều trị', () => {
        const result = calculateMedicalTreatmentDays('01/08/2026', '02/08/2026');
        assert.equal(result, '1');
    });

    it('Vào 01/08/2026, ra 06/08/2026 => 5 ngày điều trị', () => {
        const result = calculateMedicalTreatmentDays('01/08/2026', '06/08/2026');
        assert.equal(result, '5');
    });

    it('Vào 28/02/2024 (năm nhuận), ra 02/03/2024 => 3 ngày điều trị', () => {
        const result = calculateMedicalTreatmentDays('28/02/2024', '02/03/2024');
        assert.equal(result, '3');
    });

    it('Hỗ trợ định dạng ISO YYYY-MM-DD', () => {
        const result = calculateMedicalTreatmentDays('2026-08-01', '2026-08-06');
        assert.equal(result, '5');
    });

    it('Ngày ra trước ngày vào => trả về chuỗi rỗng', () => {
        const result = calculateMedicalTreatmentDays('06/08/2026', '01/08/2026');
        assert.equal(result, '');
    });

    it('Thiếu ngày vào hoặc ngày ra => trả về chuỗi rỗng', () => {
        assert.equal(calculateMedicalTreatmentDays('', '06/08/2026'), '');
        assert.equal(calculateMedicalTreatmentDays('01/08/2026', ''), '');
        assert.equal(calculateMedicalTreatmentDays(null, null), '');
    });
});

describe('recalculateAllTreatmentDays - Tự động tính các mục 15, 16, 20', () => {
    it('Đợt điều trị đơn giản (chỉ 1 khoa, không chuyển khoa)', () => {
        const formData = {
            admissionDate: '01/08/2026',
            dischargeDate: '06/08/2026',
            initialDepartmentAdmissionDate: '01/08/2026',
            departmentTransfers: [],
        };
        const updates = recalculateAllTreatmentDays(formData);

        assert.equal(updates.treatmentDays, '5'); // Mục 20
        assert.equal(updates.initialDepartmentTreatmentDays, '5'); // Mục 15
    });

    it('Đợt điều trị có chuyển khoa qua nhiều khoa', () => {
        const formData = {
            admissionDate: '01/08/2026',
            dischargeDate: '06/08/2026',
            initialDepartmentAdmissionDate: '01/08/2026',
            departmentTransfers: [
                {
                    department: 'Khoa B',
                    admissionDate: '03/08/2026',
                    admissionTime: '09:00',
                    treatmentDays: '',
                },
                {
                    department: 'Khoa C',
                    admissionDate: '05/08/2026',
                    admissionTime: '14:00',
                    treatmentDays: '',
                },
            ],
        };
        const updates = recalculateAllTreatmentDays(formData);

        assert.equal(updates.treatmentDays, '5'); // 01/08 -> 06/08 = 5 ngày
        assert.equal(updates.initialDepartmentTreatmentDays, '2'); // 01/08 -> 03/08 = 2 ngày
        assert.equal(updates.departmentTransfers?.[0].treatmentDays, '2'); // 03/08 -> 05/08 = 2 ngày
        assert.equal(updates.departmentTransfers?.[1].treatmentDays, '1'); // 05/08 -> 06/08 = 1 ngày
        // Tổng: 2 + 2 + 1 = 5 ngày, khớp với Mục 20!
    });
});

describe('calculateBmi - Tính chỉ số BMI từ Chiều cao và Cân nặng', () => {
    it('Tính đúng BMI chuẩn (170cm, 65kg => 22.49)', () => {
        const bmi = calculateBmi(170, 65);
        assert.equal(bmi, 22.49);
    });

    it('Tính đúng BMI béo phì (160cm, 90kg => 35.16)', () => {
        const bmi = calculateBmi(160, 90);
        assert.equal(bmi, 35.16);
    });

    it('Xử lý giá trị không hợp lệ (chiều cao <= 0, cân nặng <= 0, null/undefined)', () => {
        assert.equal(calculateBmi(0, 65), undefined);
        assert.equal(calculateBmi(-170, 65), undefined);
        assert.equal(calculateBmi(170, 0), undefined);
        assert.equal(calculateBmi(170, -65), undefined);
        assert.equal(calculateBmi(undefined, 65), undefined);
        assert.equal(calculateBmi(170, null), undefined);
    });
});

describe('classifyBmi - Phân loại BMI theo WHO', () => {
    it('Phân loại đúng theo các ngưỡng WHO', () => {
        assert.deepEqual(classifyBmi(17.5), { label: 'Thiếu cân', color: 'blue' });
        assert.deepEqual(classifyBmi(22.0), { label: 'Bình thường', color: 'green' });
        assert.deepEqual(classifyBmi(27.5), { label: 'Thừa cân', color: 'gold' });
        assert.deepEqual(classifyBmi(32.0), { label: 'Béo phì độ I', color: 'orange' });
        assert.deepEqual(classifyBmi(37.0), { label: 'Béo phì độ II', color: 'volcano' });
        assert.deepEqual(classifyBmi(42.0), { label: 'Béo phì độ III', color: 'red' });
    });

    it('Trả về null cho giá trị rỗng hoặc không hợp lệ', () => {
        assert.equal(classifyBmi(undefined), null);
        assert.equal(classifyBmi(null), null);
        assert.equal(classifyBmi(0), null);
        assert.equal(classifyBmi(-10), null);
    });
});
