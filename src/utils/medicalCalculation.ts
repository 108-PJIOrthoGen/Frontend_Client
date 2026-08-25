import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(customParseFormat);

export interface BmiClassification {
    label: string;
    color: string;
}

/**
 * Tính chỉ số BMI (kg/m²) dựa trên chiều cao (cm) và cân nặng (kg).
 * Công thức: BMI = weightKg / (heightM * heightM), làm tròn 2 chữ số thập phân.
 */
export function calculateBmi(
    heightCm?: number | null,
    weightKg?: number | null
): number | undefined {
    if (
        heightCm == null ||
        weightKg == null ||
        typeof heightCm !== 'number' ||
        typeof weightKg !== 'number' ||
        !Number.isFinite(heightCm) ||
        !Number.isFinite(weightKg) ||
        heightCm <= 0 ||
        weightKg <= 0
    ) {
        return undefined;
    }

    const meters = heightCm / 100;
    const bmi = Math.round((weightKg / (meters * meters)) * 100) / 100;
    return Number.isFinite(bmi) && bmi > 0 ? bmi : undefined;
}

/**
 * Phân loại chỉ số khối cơ thể (BMI) theo tiêu chuẩn của Tổ chức Y tế Thế giới (WHO).
 */
export function classifyBmi(bmi?: number | null): BmiClassification | null {
    if (bmi == null || typeof bmi !== 'number' || !Number.isFinite(bmi) || bmi <= 0) {
        return null;
    }

    if (bmi < 18.5) return { label: 'Thiếu cân', color: 'blue' };
    if (bmi < 25) return { label: 'Bình thường', color: 'green' };
    if (bmi < 30) return { label: 'Thừa cân', color: 'gold' };
    if (bmi < 35) return { label: 'Béo phì độ I', color: 'orange' };
    if (bmi < 40) return { label: 'Béo phì độ II', color: 'volcano' };
    return { label: 'Béo phì độ III', color: 'red' };
}

export interface DepartmentTransferDateFields {
    department?: string;
    admissionDate?: string;
    admissionTime?: string;
    treatmentDays?: string;
}

export interface EpisodeDateFields {
    admissionDate?: string;
    dischargeDate?: string;
    initialDepartmentAdmissionDate?: string;
    initialDepartmentTreatmentDays?: string;
    treatmentDays?: string;
    departmentTransfers?: DepartmentTransferDateFields[];
}

/**
 * Chuyển đổi chuỗi ngày hoặc đối tượng ngày sang đối tượng Dayjs
 */
export function parseDateToDayjs(dateStr?: string | Dayjs | null): Dayjs | null {
    if (!dateStr) return null;
    if (dayjs.isDayjs(dateStr)) return dateStr.isValid() ? dateStr : null;

    const trimmed = String(dateStr).trim();
    if (!trimmed) return null;

    // Check if DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(trimmed);
    if (dmyMatch) {
        const day = parseInt(dmyMatch[1], 10);
        const month = parseInt(dmyMatch[2], 10) - 1;
        const year = parseInt(dmyMatch[3], 10);
        const d = dayjs(new Date(year, month, day));
        return d.isValid() ? d : null;
    }

    const formats = ['DD/MM/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD', 'YYYY-MM-DDTHH:mm:ss'];
    for (const fmt of formats) {
        const parsed = dayjs(trimmed, fmt, true);
        if (parsed.isValid()) return parsed;
    }

    const fallback = dayjs(trimmed);
    return fallback.isValid() ? fallback : null;
}

/**
 * Tính số ngày điều trị theo chuẩn y tế Việt Nam (Quyết định 4069/1998/QĐ-BYT):
 * - Nếu vào viện và ra viện trong cùng một ngày: Tính là 1 ngày điều trị.
 * - Nếu vào viện và ra viện khác ngày (Ngày ra > Ngày vào): Số ngày điều trị = Ngày ra - Ngày vào.
 * - Nếu ngày ra < ngày vào hoặc thiếu ngày: Trả về chuỗi rỗng ('').
 */
export function calculateMedicalTreatmentDays(
    startDateStr?: string | Dayjs | null,
    endDateStr?: string | Dayjs | null
): string {
    if (!startDateStr || !endDateStr) return '';

    const start = parseDateToDayjs(startDateStr)?.startOf('day');
    const end = parseDateToDayjs(endDateStr)?.startOf('day');

    if (!start || !end || !start.isValid() || !end.isValid()) return '';

    const diffDays = end.diff(start, 'day');

    if (diffDays < 0) return '';
    if (diffDays === 0) return '1';
    return String(diffDays);
}

/**
 * Tự động tính toán lại toàn bộ số ngày điều trị cho hồ sơ bệnh án:
 * 1. Mục 20: Tổng số ngày điều trị (toàn bộ đợt từ admissionDate -> dischargeDate)
 * 2. Mục 15: Ngày điều trị khoa ban đầu (từ initialDepartmentAdmissionDate -> chuyển khoa 1 hoặc dischargeDate)
 * 3. Mục 16: Ngày điều trị của từng khoa chuyển (từ transfer[i].admissionDate -> transfer[i+1].admissionDate hoặc dischargeDate)
 */
export function recalculateAllTreatmentDays<T extends EpisodeDateFields>(formData: T): {
    treatmentDays?: string;
    initialDepartmentTreatmentDays?: string;
    departmentTransfers?: T['departmentTransfers'];
} {
    const admissionDate = formData.admissionDate;
    const dischargeDate = formData.dischargeDate;
    const initialDeptDate = formData.initialDepartmentAdmissionDate || admissionDate;
    const transfers = formData.departmentTransfers || [];

    const updates: {
        treatmentDays?: string;
        initialDepartmentTreatmentDays?: string;
        departmentTransfers?: T['departmentTransfers'];
    } = {};

    // 1. Tính tổng số ngày điều trị mục 20 (nếu có ngày vào và ngày ra)
    if (admissionDate && dischargeDate) {
        updates.treatmentDays = calculateMedicalTreatmentDays(admissionDate, dischargeDate);
    }

    // 2. Tính ngày điều trị cho khoa ban đầu (mục 15)
    if (initialDeptDate) {
        let firstTransferDate: string | undefined;
        if (transfers.length > 0 && transfers[0]?.admissionDate) {
            firstTransferDate = transfers[0].admissionDate;
        }

        const initialEndDate = firstTransferDate || dischargeDate;
        if (initialEndDate) {
            updates.initialDepartmentTreatmentDays = calculateMedicalTreatmentDays(initialDeptDate, initialEndDate);
        }
    }

    // 3. Tính ngày điều trị cho từng khoa chuyển (mục 16)
    if (transfers.length > 0) {
        const updatedTransfers = transfers.map((transfer, index) => {
            const transferStartDate = transfer.admissionDate;
            if (!transferStartDate) {
                return { ...transfer };
            }

            let transferEndDate: string | undefined;
            if (index < transfers.length - 1 && transfers[index + 1]?.admissionDate) {
                transferEndDate = transfers[index + 1].admissionDate;
            } else if (dischargeDate) {
                transferEndDate = dischargeDate;
            }

            const calculatedDays = transferEndDate
                ? calculateMedicalTreatmentDays(transferStartDate, transferEndDate)
                : transfer.treatmentDays;

            return {
                ...transfer,
                treatmentDays: calculatedDays !== '' ? calculatedDays : transfer.treatmentDays,
            };
        });

        updates.departmentTransfers = updatedTransfers as T['departmentTransfers'];
    }

    return updates;
}
