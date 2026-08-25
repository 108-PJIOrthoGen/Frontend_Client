import { forwardRef, useEffect, useImperativeHandle } from 'react';
import dayjs from 'dayjs';
import {
    Button,
    Checkbox,
    DatePicker,
    Form,
    Input,
    InputNumber,
    Select,
    TimePicker,
    Tooltip,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import locale from 'antd/es/date-picker/locale/vi_VN';
import { IEpisode } from '@/types/backend';
import { stringToDayjs } from '@/config/utils';
import { episodeToFormData } from '@/utils/apiToForm';
import { recalculateAllTreatmentDays, parseDateToDayjs } from '@/utils/medicalCalculation';

export interface DepartmentTransferFormData {
    department: string;
    admissionDate: string;
    admissionTime: string;
    treatmentDays: string;
}

export interface EpisodeFormData {
    admissionDate: string;
    dischargeDate: string;
    department: string;
    admissionMethod: string;
    reason: string;
    referralSource: string;
    admissionCount: string;
    treatmentDays: string;
    initialDepartmentTreatmentDays: string;
    initialDepartmentAdmissionDate: string;
    departmentTransfers: DepartmentTransferFormData[];
    hospitalTransferType: string;
    hospitalTransferDestination: string;
    dischargeDisposition: string;
    referralDiagnosis: string;
    emergencyDiagnosis: string;
    inpatientDiagnosis: string;
    hasIncident: boolean;
    hasComplication: boolean;
    complicationCause: string;
    postoperativeTreatmentDays: string;
    surgeryCount: string;
    dischargePrimaryDiagnosis: string;
    dischargeCause: string;
    accompanyingDisease: string;
    preoperativeDiagnosis: string;
    postoperativeDiagnosis: string;
    treatmentResult: string;
    status: string;
}

interface MedicalExaminationProps {
    mode?: 'wizard' | 'standalone';
    episodeData?: IEpisode | null;
    onFormChange?: (data: EpisodeFormData) => void;
}

const emptyFormData: EpisodeFormData = {
    admissionDate: '',
    dischargeDate: '',
    department: '',
    admissionMethod: '',
    reason: '',
    referralSource: '',
    admissionCount: '',
    treatmentDays: '',
    initialDepartmentTreatmentDays: '',
    initialDepartmentAdmissionDate: '',
    departmentTransfers: [],
    hospitalTransferType: '',
    hospitalTransferDestination: '',
    dischargeDisposition: '',
    referralDiagnosis: '',
    emergencyDiagnosis: '',
    inpatientDiagnosis: '',
    hasIncident: false,
    hasComplication: false,
    complicationCause: '',
    postoperativeTreatmentDays: '',
    surgeryCount: '',
    dischargePrimaryDiagnosis: '',
    dischargeCause: '',
    accompanyingDisease: '',
    preoperativeDiagnosis: '',
    postoperativeDiagnosis: '',
    treatmentResult: '',
    status: '',
};

const pickerValue = (_value: unknown, valueString: string | string[]) =>
    (Array.isArray(valueString) ? valueString[0] : valueString) || '';

const stringToTimeValue = (value?: string) => {
    if (!value) return null;
    const parsed = dayjs(`2000-01-01T${value.length === 5 ? `${value}:00` : value}`);
    return parsed.isValid() ? parsed : null;
};

export interface MedicalExaminationHandle {
    /** Runs the Antd field rules. Resolves true if valid, false if any rule fails. */
    validate: () => Promise<boolean>;
}

export const MedicalExamination = forwardRef<MedicalExaminationHandle, MedicalExaminationProps>(({
    episodeData,
    onFormChange,
}, ref) => {
    const [form] = Form.useForm<EpisodeFormData>();

    useImperativeHandle(ref, () => ({
        validate: async () => {
            try {
                await form.validateFields();
                return true;
            } catch {
                return false;
            }
        },
    }), [form]);

    useEffect(() => {
        const data = episodeData ? episodeToFormData(episodeData) : emptyFormData;
        const updates = recalculateAllTreatmentDays(data);
        const mergedData: EpisodeFormData = {
            ...data,
            treatmentDays: data.treatmentDays || updates.treatmentDays || '',
            initialDepartmentTreatmentDays:
                data.initialDepartmentTreatmentDays || updates.initialDepartmentTreatmentDays || '',
            departmentTransfers: (data.departmentTransfers || []).map((t, idx) => ({
                ...t,
                treatmentDays: t.treatmentDays || updates.departmentTransfers?.[idx]?.treatmentDays || '',
            })),
        };
        form.setFieldsValue(mergedData);
        onFormChange?.(mergedData);
    }, [episodeData, form]);

    const handleValuesChange = (changedValues: Partial<EpisodeFormData>, allValues: EpisodeFormData) => {
        const updatedValues: EpisodeFormData = { ...allValues };
        let hasCalculatedChanges = false;

        const isAdmissionChanged = 'admissionDate' in changedValues;
        const isDischargeChanged = 'dischargeDate' in changedValues;
        const isInitialAdmissionChanged = 'initialDepartmentAdmissionDate' in changedValues;
        const isTransfersChanged = 'departmentTransfers' in changedValues;

        // Tự động đồng bộ Ngày vào khoa nếu chưa nhập và đã có Ngày vào viện
        if (isAdmissionChanged && changedValues.admissionDate && !updatedValues.initialDepartmentAdmissionDate) {
            updatedValues.initialDepartmentAdmissionDate = changedValues.admissionDate;
            hasCalculatedChanges = true;
        }

        // Tự động tính toán lại số ngày điều trị theo chuẩn Bộ Y tế khi ngày thay đổi
        if (isAdmissionChanged || isDischargeChanged || isInitialAdmissionChanged || isTransfersChanged) {
            const calculated = recalculateAllTreatmentDays(updatedValues);

            if (calculated.treatmentDays !== undefined && calculated.treatmentDays !== updatedValues.treatmentDays) {
                updatedValues.treatmentDays = calculated.treatmentDays;
                hasCalculatedChanges = true;
            }

            if (
                calculated.initialDepartmentTreatmentDays !== undefined &&
                calculated.initialDepartmentTreatmentDays !== updatedValues.initialDepartmentTreatmentDays
            ) {
                updatedValues.initialDepartmentTreatmentDays = calculated.initialDepartmentTreatmentDays;
                hasCalculatedChanges = true;
            }

            if (calculated.departmentTransfers) {
                const newTransfers = calculated.departmentTransfers.map((t, idx) => ({
                    ...(updatedValues.departmentTransfers?.[idx] || {
                        department: '',
                        admissionDate: '',
                        admissionTime: '',
                        treatmentDays: '',
                    }),
                    ...t,
                }));
                const transferDaysChanged = newTransfers.some(
                    (nt, idx) => nt.treatmentDays !== updatedValues.departmentTransfers?.[idx]?.treatmentDays
                );
                if (transferDaysChanged) {
                    updatedValues.departmentTransfers = newTransfers;
                    hasCalculatedChanges = true;
                }
            }
        }

        if (hasCalculatedChanges) {
            form.setFieldsValue(updatedValues);
        }

        onFormChange?.(updatedValues);
    };

    const requiredRule = { required: true, message: 'Trường này bắt buộc điền' };
    const integerRules = [{ pattern: /^\d*$/, message: 'Chỉ nhập số nguyên không âm' }];

    const renderDiagnosisRow = (
        label: string,
        field: keyof EpisodeFormData,
        className = '',
    ) => (
        <Form.Item
            name={field}
            label={<span className="font-medium text-slate-700">{label}</span>}
            className={className}
        >
            <Input.TextArea
                autoSize={{ minRows: 2, maxRows: 4 }}
                placeholder={`Nhập ${label.toLocaleLowerCase('vi')}`}
                className="rounded-lg"
            />
        </Form.Item>
    );

    return (
        <div className="flex-1 overflow-y-auto p-4 pb-32 md:p-8">
            <div className="mx-auto max-w-6xl">
                <Form
                    form={form}
                    layout="vertical"
                    onValuesChange={handleValuesChange}
                    initialValues={emptyFormData}
                    className="space-y-6"
                >
                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                Quản lý người bệnh
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Thông tin vào viện, quá trình điều trị và ra viện.
                            </p>
                        </div>

                        <div className="space-y-7 p-6">
                            <div className="grid grid-cols-1 gap-x-5 md:grid-cols-2 xl:grid-cols-4">
                                <Form.Item
                                    name="admissionDate"
                                    label={<span className="font-medium text-slate-700">12. Ngày vào viện</span>}
                                    rules={[requiredRule]}
                                    getValueFromEvent={pickerValue}
                                    getValueProps={(value) => ({ value: stringToDayjs(value) })}
                                >
                                    <DatePicker
                                        locale={locale}
                                        format="DD/MM/YYYY"
                                        placeholder="dd/mm/yyyy"
                                        className="h-11 w-full"
                                    />
                                </Form.Item>
                                <Form.Item
                                    name="admissionMethod"
                                    label={<span className="font-medium text-slate-700">13. Trực tiếp vào</span>}
                                    rules={[requiredRule]}
                                >
                                    <Select
                                        placeholder="Chọn hình thức"
                                        className="h-11"
                                        options={[
                                            { value: 'CC', label: '1. Cấp cứu' },
                                            { value: 'KKB', label: '2. KKB' },
                                            { value: 'KDT', label: '3. Khoa điều trị' },
                                        ]}
                                    />
                                </Form.Item>
                                <Form.Item
                                    name="admissionCount"
                                    label={<span className="font-medium text-slate-700">Vào viện do bệnh này lần thứ</span>}
                                    rules={integerRules}
                                >
                                    <InputNumber min={0} controls={false} stringMode className="h-11 w-full" />
                                </Form.Item>
                                <Form.Item
                                    name="referralSource"
                                    label={<span className="font-medium text-slate-700">14. Nơi giới thiệu</span>}
                                >
                                    <Select
                                        placeholder="Chọn nơi giới thiệu"
                                        className="h-11"
                                        options={[
                                            { value: 'MEDICAL_FACILITY', label: '1. Cơ quan y tế' },
                                            { value: 'SELF', label: '2. Tự đến' },
                                            { value: 'OTHER', label: '3. Khác' },
                                        ]}
                                    />
                                </Form.Item>
                            </div>

                            <div className="overflow-hidden rounded-lg border border-slate-200">
                                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                                    <h2 className="font-bold text-slate-800">15–16. Quá trình vào/chuyển khoa</h2>
                                </div>
                                <div className="space-y-4 p-4">
                                    <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2 xl:grid-cols-3">
                                        <Form.Item
                                            name="department"
                                            label={<span className="font-medium text-slate-700">15. Vào khoa</span>}
                                            rules={[requiredRule]}
                                        >
                                            <Input placeholder="Ví dụ: B1-C" className="h-11 rounded-lg" />
                                        </Form.Item>
                                        <Form.Item
                                            name="initialDepartmentAdmissionDate"
                                            label={<span className="font-medium text-slate-700">Ngày vào khoa</span>}
                                            getValueFromEvent={pickerValue}
                                            getValueProps={(value) => ({ value: stringToDayjs(value) })}
                                            rules={[
                                                ({ getFieldValue }) => ({
                                                    validator(_, value) {
                                                        const admissionDate = getFieldValue('admissionDate');
                                                        if (!value || !admissionDate) return Promise.resolve();
                                                        const start = parseDateToDayjs(admissionDate)?.startOf('day');
                                                        const current = parseDateToDayjs(value)?.startOf('day');
                                                        if (start && current && current.isBefore(start)) {
                                                            return Promise.reject(new Error('Ngày vào khoa không được trước ngày vào viện'));
                                                        }
                                                        return Promise.resolve();
                                                    },
                                                }),
                                            ]}
                                        >
                                            <DatePicker
                                                locale={locale}
                                                format="DD/MM/YYYY"
                                                placeholder="dd/mm/yyyy"
                                                className="h-11 w-full"
                                            />
                                        </Form.Item>
                                        <Form.Item
                                            name="initialDepartmentTreatmentDays"
                                            label={
                                                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                                                    <span>Ngày điều trị</span>
                                                    <Tooltip title="Tự động tính theo chuẩn y tế từ Ngày vào khoa đến Ngày chuyển khoa tiếp theo (hoặc Ngày ra viện).">
                                                        <InfoCircleOutlined className="text-slate-400 hover:text-blue-500 cursor-pointer text-xs" />
                                                    </Tooltip>
                                                </span>
                                            }
                                            rules={integerRules}
                                        >
                                            <InputNumber min={0} controls={false} stringMode placeholder="Tự động tính" className="h-11 w-full" />
                                        </Form.Item>
                                    </div>

                                    <Form.List name="departmentTransfers">
                                        {(fields, { add, remove }) => (
                                            <div className="space-y-4">
                                                {fields.map((field, index) => (
                                                    <div
                                                        key={field.key}
                                                        className="grid grid-cols-1 gap-4 rounded-lg bg-slate-50 p-3 md:grid-cols-2 lg:grid-cols-12"
                                                    >
                                                        <Form.Item
                                                            {...field}
                                                            name={[field.name, 'department']}
                                                            label={`16. Chuyển khoa ${index + 1}`}
                                                            className="mb-0 lg:col-span-4"
                                                        >
                                                            <Input placeholder="Tên khoa" className="h-11" />
                                                        </Form.Item>
                                                        <Form.Item
                                                            name={[field.name, 'admissionDate']}
                                                            label="Ngày chuyển"
                                                            getValueFromEvent={pickerValue}
                                                            getValueProps={(value) => ({ value: stringToDayjs(value) })}
                                                            rules={[
                                                                ({ getFieldValue }) => ({
                                                                    validator(_, value) {
                                                                        const admissionDate = getFieldValue('admissionDate');
                                                                        if (!value || !admissionDate) return Promise.resolve();
                                                                        const start = parseDateToDayjs(admissionDate)?.startOf('day');
                                                                        const current = parseDateToDayjs(value)?.startOf('day');
                                                                        if (start && current && current.isBefore(start)) {
                                                                            return Promise.reject(new Error('Ngày chuyển khoa không được trước ngày vào viện'));
                                                                        }
                                                                        return Promise.resolve();
                                                                    },
                                                                }),
                                                            ]}
                                                            className="mb-0 lg:col-span-3"
                                                        >
                                                            <DatePicker
                                                                locale={locale}
                                                                format="DD/MM/YYYY"
                                                                placeholder="dd/mm/yyyy"
                                                                className="h-11 w-full"
                                                            />
                                                        </Form.Item>
                                                        <Form.Item
                                                            name={[field.name, 'admissionTime']}
                                                            label="Giờ chuyển"
                                                            getValueFromEvent={pickerValue}
                                                            getValueProps={(value) => ({ value: stringToTimeValue(value) })}
                                                            className="mb-0 lg:col-span-2"
                                                        >
                                                            <TimePicker format="HH:mm" className="h-11 w-full" />
                                                        </Form.Item>
                                                        <Form.Item
                                                            name={[field.name, 'treatmentDays']}
                                                            label={
                                                                <span className="flex items-center gap-1.5">
                                                                    <span>Ngày điều trị</span>
                                                                    <Tooltip title="Tự động tính từ Ngày chuyển đến Ngày chuyển khoa tiếp theo (hoặc Ngày ra viện).">
                                                                        <InfoCircleOutlined className="text-slate-400 hover:text-blue-500 cursor-pointer text-xs" />
                                                                    </Tooltip>
                                                                </span>
                                                            }
                                                            rules={integerRules}
                                                            className="mb-0 lg:col-span-2"
                                                        >
                                                            <InputNumber min={0} controls={false} stringMode placeholder="Tự động tính" className="h-11 w-full" />
                                                        </Form.Item>
                                                        <div className="flex items-end lg:col-span-1">
                                                            <Button danger type="text" onClick={() => remove(field.name)}>
                                                                Xóa
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <Button
                                                    type="dashed"
                                                    onClick={() => add({
                                                        department: '',
                                                        admissionDate: '',
                                                        admissionTime: '',
                                                        treatmentDays: '',
                                                    })}
                                                    disabled={fields.length >= 3}
                                                    block
                                                >
                                                    Thêm chuyển khoa
                                                </Button>
                                            </div>
                                        )}
                                    </Form.List>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                <Form.Item
                                    name="hospitalTransferType"
                                    label={<span className="font-medium text-slate-700">17. Chuyển viện</span>}
                                >
                                    <Select
                                        allowClear
                                        placeholder="Chọn hình thức chuyển viện"
                                        className="h-11"
                                        options={[
                                            { value: 'TRANSFER_IN', label: '1. Chuyển đến' },
                                            { value: 'TRANSFER_OUT', label: '2. Chuyển đi' },
                                            { value: 'CK', label: '3. CK' },
                                        ]}
                                    />
                                </Form.Item>
                                <Form.Item
                                    name="hospitalTransferDestination"
                                    label={<span className="font-medium text-slate-700">Chuyển đến</span>}
                                >
                                    <Input placeholder="Tên cơ sở tiếp nhận" className="h-11 rounded-lg" />
                                </Form.Item>
                            </div>

                            <div className="grid grid-cols-1 gap-x-5 md:grid-cols-2 xl:grid-cols-3">
                                <Form.Item
                                    name="dischargeDate"
                                    label={<span className="font-medium text-slate-700">18. Ngày ra viện</span>}
                                    getValueFromEvent={pickerValue}
                                    getValueProps={(value) => ({ value: stringToDayjs(value) })}
                                    rules={[
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                const admissionDate = getFieldValue('admissionDate');
                                                if (!value || !admissionDate) return Promise.resolve();
                                                const start = parseDateToDayjs(admissionDate)?.startOf('day');
                                                const end = parseDateToDayjs(value)?.startOf('day');
                                                if (start && end && end.isBefore(start)) {
                                                    return Promise.reject(new Error('Ngày ra viện phải bằng hoặc sau ngày vào viện'));
                                                }
                                                return Promise.resolve();
                                            },
                                        }),
                                    ]}
                                >
                                    <DatePicker
                                        locale={locale}
                                        format="DD/MM/YYYY"
                                        placeholder="dd/mm/yyyy"
                                        className="h-11 w-full"
                                    />
                                </Form.Item>
                                <Form.Item
                                    name="dischargeDisposition"
                                    label={<span className="font-medium text-slate-700">Hình thức ra viện</span>}
                                >
                                    <Select
                                        allowClear
                                        placeholder="Chọn hình thức"
                                        className="h-11"
                                        options={[
                                            { value: 'DISCHARGED', label: '1. Ra viện' },
                                            { value: 'REQUESTED', label: '2. Xin về' },
                                            { value: 'LEFT', label: '3. Bỏ về' },
                                            { value: 'TAKEN_HOME', label: '4. Đưa về' },
                                        ]}
                                    />
                                </Form.Item>
                                <Form.Item
                                    name="treatmentDays"
                                    label={
                                        <span className="flex items-center gap-1.5 font-medium text-slate-700">
                                            <span>20. Tổng số ngày điều trị</span>
                                            <Tooltip title="Tự động tính theo chuẩn Bộ Y tế (QĐ 4069/1998/QĐ-BYT): Vào và ra cùng ngày tính 1 ngày; khác ngày tính Ngày ra - Ngày vào. Bạn vẫn có thể chỉnh sửa nếu cần.">
                                                <InfoCircleOutlined className="text-slate-400 hover:text-blue-500 cursor-pointer text-xs" />
                                            </Tooltip>
                                        </span>
                                    }
                                    rules={integerRules}
                                >
                                    <InputNumber
                                        min={0}
                                        controls={false}
                                        stringMode
                                        placeholder="Tự động tính"
                                        className="h-11 w-full"
                                    />
                                </Form.Item>
                            </div>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Chẩn đoán</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Chẩn đoán theo từng giai đoạn của đợt điều trị.
                            </p>
                        </div>

                        <div className="space-y-6 p-6">
                            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                                {renderDiagnosisRow('20. Nơi chuyển đến', 'referralDiagnosis', 'mb-0')}
                                {renderDiagnosisRow('21. KKB/Cấp cứu', 'emergencyDiagnosis', 'mb-0')}
                                {renderDiagnosisRow('22. Khi vào khoa điều trị', 'inpatientDiagnosis', 'mb-0')}
                            </div>

                            <div className="grid grid-cols-1 gap-5 border-y border-slate-100 py-5 lg:grid-cols-4">
                                <Form.Item name="hasIncident" valuePropName="checked" className="mb-0">
                                    <Checkbox>Tai biến</Checkbox>
                                </Form.Item>
                                <Form.Item name="hasComplication" valuePropName="checked" className="mb-0">
                                    <Checkbox>Biến chứng</Checkbox>
                                </Form.Item>
                                <Form.Item
                                    name="complicationCause"
                                    label={<span className="font-medium text-slate-700">Nguyên nhân</span>}
                                    className="mb-0 lg:col-span-2"
                                >
                                    <Select
                                        allowClear
                                        placeholder="Chọn nguyên nhân"
                                        options={[
                                            { value: 'SURGERY', label: '1. Do phẫu thuật' },
                                            { value: 'ANESTHESIA', label: '2. Do gây mê' },
                                            { value: 'INFECTION', label: '3. Do nhiễm khuẩn' },
                                            { value: 'OTHER', label: '4. Khác' },
                                        ]}
                                    />
                                </Form.Item>
                                <Form.Item
                                    name="postoperativeTreatmentDays"
                                    label={<span className="font-medium text-slate-700">23. Tổng số ngày điều trị sau phẫu thuật</span>}
                                    rules={integerRules}
                                    className="mb-0 lg:col-span-2"
                                >
                                    <InputNumber min={0} controls={false} stringMode className="h-11 w-full" />
                                </Form.Item>
                                <Form.Item
                                    name="surgeryCount"
                                    label={<span className="font-medium text-slate-700">24. Tổng số lần phẫu thuật</span>}
                                    rules={integerRules}
                                    className="mb-0 lg:col-span-2"
                                >
                                    <InputNumber min={0} controls={false} stringMode className="h-11 w-full" />
                                </Form.Item>
                            </div>

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                {renderDiagnosisRow(
                                    '25. Ra viện - Bệnh chính (tổn thương)',
                                    'dischargePrimaryDiagnosis',
                                    'mb-0 md:col-span-2',
                                )}
                                {renderDiagnosisRow('Nguyên nhân', 'dischargeCause', 'mb-0')}
                                {renderDiagnosisRow('Bệnh kèm theo', 'accompanyingDisease', 'mb-0')}
                                {renderDiagnosisRow(
                                    'Chẩn đoán trước phẫu thuật',
                                    'preoperativeDiagnosis',
                                    'mb-0',
                                )}
                                {renderDiagnosisRow(
                                    'Chẩn đoán sau phẫu thuật',
                                    'postoperativeDiagnosis',
                                    'mb-0',
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                            <h2 className="text-lg font-bold text-slate-900">Thông tin hồ sơ</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                            <Form.Item
                                name="reason"
                                label={<span className="font-medium text-slate-700">Lý do vào viện</span>}
                                className="md:col-span-2"
                            >
                                <Input placeholder="Nhập lý do vào viện" className="h-11 rounded-lg" />
                            </Form.Item>
                            <Form.Item
                                name="treatmentResult"
                                label={<span className="font-medium text-slate-700">Kết quả điều trị</span>}
                            >
                                <Select
                                    allowClear
                                    placeholder="Nhập kết quả điều trị"
                                    className="h-11"
                                    options={[
                                        { value: 'Khỏi', label: 'Khỏi' },
                                        { value: 'Đỡ', label: 'Đỡ' },
                                        { value: 'Không thay đổi', label: 'Không thay đổi' },
                                        { value: 'Nặng hơn', label: 'Nặng hơn' },
                                        { value: 'Tử vong', label: 'Tử vong' }
                                    ]}
                                />
                            </Form.Item>
                            <Form.Item
                                name="status"
                                label={<span className="font-medium text-slate-700">Trạng thái hồ sơ</span>}
                                rules={[requiredRule]}
                            >
                                <Select
                                    placeholder="Chọn trạng thái hồ sơ"
                                    className="h-11"
                                    options={[
                                        { value: 'processing', label: 'Đang điều trị' },
                                        { value: 'completed', label: 'Hoàn thành' },
                                        { value: 'cancelled', label: 'Đã hủy' },
                                    ]}
                                />
                            </Form.Item>
                        </div>
                    </section>
                </Form>
            </div>
        </div>
    );
});

MedicalExamination.displayName = 'MedicalExamination';

export default MedicalExamination;
