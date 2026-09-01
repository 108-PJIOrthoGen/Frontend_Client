import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import {
  Card,
  Button,
  Input,
  InputNumber,
  Select,
  Space,
  Tag,
  Typography,
  Popconfirm,
  Row,
  Col,
  Tooltip,
  Empty,
  Form
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  CheckOutlined,
  ExperimentOutlined,
  InfoCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type {
  SystemicPlanData,
  SystemicPhaseData,
  TemplateAntibiotic,
} from '@/types/treatmentType';

const { Text, Title, Paragraph } = Typography;

export interface SystemicAntibioticTreatmentHandle {
  getData: () => SystemicPlanData;
}

interface SystemicAntibioticTreatmentProps {
  guidelinePlan: SystemicPlanData;
  readOnly?: boolean;
  showSupportingDetails?: boolean;
}

const ROUTE_OPTIONS = [
  { value: 'IV', label: 'IV (Tĩnh mạch)' },
  { value: 'ORAL', label: 'ORAL (Uống)' },
  { value: 'PO', label: 'PO (Uống)' },
  { value: 'IM', label: 'IM (Tiêm bắp)' },
  { value: 'SC', label: 'SC (Dưới da)' },
];

const ROLE_OPTIONS = [
  { value: 'PRIMARY', label: 'PRIMARY (Chính)' },
  { value: 'ADJUNCT', label: 'ADJUNCT (Bổ trợ)' },
  { value: 'EMPIRIC', label: 'EMPIRIC (Kinh nghiệm)' },
  { value: 'DEFINITIVE', label: 'DEFINITIVE (Đích)' },
  { value: 'TARGETED', label: 'TARGETED (Nhắm trúng đích)' },
];

export const SystemicAntibioticTreatment = forwardRef<
  SystemicAntibioticTreatmentHandle,
  SystemicAntibioticTreatmentProps
>(({ guidelinePlan, readOnly = false, showSupportingDetails = true }, ref) => {
  const [plan, setPlan] = useState<SystemicPlanData>(() => ({
    ...guidelinePlan,
    regimenName: guidelinePlan.regimenName || 'Phác đồ kháng sinh toàn thân',
    indication: guidelinePlan.indication || '',
    totalDurationWeeks: guidelinePlan.totalDurationWeeks ?? 0,
  }));
  const [phases, setPhases] = useState<SystemicPhaseData[]>(
    () => guidelinePlan.phases ?? [],
  );

  const [editingGeneral, setEditingGeneral] = useState(false);
  const [editingPhaseId, setEditingPhaseId] = useState<number | null>(null);
  const [editingAbxKey, setEditingAbxKey] = useState<string | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      getData: () => ({
        ...plan,
        category: 'SYSTEMIC_ANTIBIOTIC',
        phases,
        totalDurationWeeks:
          plan.totalDurationWeeks ||
          phases.reduce((sum, p) => sum + (Number(p.durationWeeks) || 0), 0),
      }),
    }),
    [plan, phases],
  );

  // --- General Plan Handlers ---
  const handlePlanFieldChange = (
    field: keyof Pick<SystemicPlanData, 'regimenName' | 'indication' | 'notes'>,
    value: string,
  ) => {
    if (readOnly) return;
    setPlan((prev) => ({ ...prev, [field]: value }));
  };

  const handleTotalDurationChange = (value: number | null) => {
    if (readOnly) return;
    setPlan((prev) => ({ ...prev, totalDurationWeeks: value ?? 0 }));
  };

  // --- Phase Handlers ---
  const toggleEditPhase = useCallback(
    (phaseOrder: number) => {
      if (readOnly) return;
      setEditingPhaseId((prev) => (prev === phaseOrder ? null : phaseOrder));
    },
    [readOnly],
  );

  const handlePhaseFieldChange = useCallback(
    (
      phaseOrder: number,
      field: keyof Pick<SystemicPhaseData, 'phaseName' | 'durationNote'>,
      value: string,
    ) => {
      if (readOnly) return;
      setPhases((prev) =>
        prev.map((p) =>
          p.phaseOrder === phaseOrder ? { ...p, [field]: value } : p,
        ),
      );
    },
    [readOnly],
  );

  const handlePhaseDurationChange = useCallback(
    (phaseOrder: number, value: number | null) => {
      if (readOnly) return;
      setPhases((prev) =>
        prev.map((p) =>
          p.phaseOrder === phaseOrder
            ? { ...p, durationWeeks: value ?? 0 }
            : p,
        ),
      );
    },
    [readOnly],
  );

  const handleDeletePhase = useCallback(
    (phaseOrder: number) => {
      if (readOnly) return;
      setPhases((prev) => {
        const filtered = prev.filter((p) => p.phaseOrder !== phaseOrder);
        return filtered.map((p, idx) => ({ ...p, phaseOrder: idx + 1 }));
      });
      setEditingPhaseId(null);
      setEditingAbxKey(null);
    },
    [readOnly],
  );

  const handleAddPhase = useCallback(() => {
    if (readOnly) return;
    setPhases((prev) => {
      const nextOrder = prev.length + 1;
      const newPhase: SystemicPhaseData = {
        phaseName: `Giai đoạn ${nextOrder}`,
        phaseOrder: nextOrder,
        durationWeeks: 2,
        durationNote: '',
        antibiotics: [
          {
            antibioticName: '',
            dosage: '',
            frequency: '',
            route: 'IV',
            role: 'PRIMARY',
            notes: '',
          },
        ],
      };
      return [...prev, newPhase];
    });
    setEditingPhaseId(phases.length + 1);
  }, [readOnly, phases.length]);

  // --- Antibiotic Handlers ---
  const abxKey = (phaseOrder: number, abxIndex: number) =>
    `${phaseOrder}-${abxIndex}`;

  const toggleEditAbx = useCallback(
    (key: string) => {
      if (readOnly) return;
      setEditingAbxKey((prev) => (prev === key ? null : key));
    },
    [readOnly],
  );

  const handleAbxFieldChange = useCallback(
    (
      phaseOrder: number,
      abxIndex: number,
      field: keyof TemplateAntibiotic,
      value: string,
    ) => {
      if (readOnly) return;
      setPhases((prev) =>
        prev.map((p) => {
          if (p.phaseOrder !== phaseOrder) return p;
          const updatedAbx = (p.antibiotics ?? []).map((a, i) =>
            i === abxIndex ? { ...a, [field]: value } : a,
          );
          return { ...p, antibiotics: updatedAbx };
        }),
      );
    },
    [readOnly],
  );

  const handleDeleteAbx = useCallback(
    (phaseOrder: number, abxIndex: number) => {
      if (readOnly) return;
      setPhases((prev) =>
        prev.map((p) => {
          if (p.phaseOrder !== phaseOrder) return p;
          return {
            ...p,
            antibiotics: (p.antibiotics ?? []).filter((_, i) => i !== abxIndex),
          };
        }),
      );
      setEditingAbxKey(null);
    },
    [readOnly],
  );

  const handleAddAntibiotic = useCallback(
    (phaseOrder: number) => {
      if (readOnly) return;
      let newIdx = 0;
      setPhases((prev) =>
        prev.map((p) => {
          if (p.phaseOrder !== phaseOrder) return p;
          const currentList = p.antibiotics ?? [];
          newIdx = currentList.length;
          const newAbx: TemplateAntibiotic = {
            antibioticName: '',
            dosage: '',
            frequency: '',
            route: 'IV',
            role: 'PRIMARY',
            notes: '',
          };
          return { ...p, antibiotics: [...currentList, newAbx] };
        }),
      );
      setEditingAbxKey(abxKey(phaseOrder, newIdx));
    },
    [readOnly],
  );

  const calculatedTotalWeeks =
    plan.totalDurationWeeks ||
    phases.reduce((sum, p) => sum + (Number(p.durationWeeks) || 0), 0);

  return (
    <Card
      size="small"
      style={{
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      styles={{
        header: {
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          padding: '12px 16px',
        },
        body: {
          padding: 16,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        },
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
              border: '1px solid #7dd3fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7',
              fontSize: 18,
            }}
          >
            <ExperimentOutlined />
          </div>
          <div>
            <Title level={5} style={{ margin: 0, fontSize: 15, color: '#0f172a' }}>
              Điều trị kháng sinh toàn thân
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {plan.regimenName || 'Phác đồ dược sĩ'}
            </Text>
          </div>
        </div>
      }
      extra={
        <Space size={8}>
          <Tag color="blue" style={{ margin: 0, fontWeight: 600, padding: '2px 8px' }}>
            {calculatedTotalWeeks} TUẦN
          </Tag>
          {!readOnly && (
            <Tooltip title={editingGeneral ? 'Đóng chỉnh sửa chung' : 'Chỉnh sửa thông tin chung'}>
              <Button
                size="small"
                type={editingGeneral ? 'primary' : 'text'}
                icon={<SettingOutlined />}
                onClick={() => setEditingGeneral((prev) => !prev)}
              />
            </Tooltip>
          )}
        </Space>
      }
    >
      {/* General Settings / Indication */}
      {editingGeneral ? (
        <Card
          size="small"
          style={{ background: '#f0f9ff', borderColor: '#bae6fd', borderRadius: 8 }}
          title={<Text strong style={{ fontSize: 13, color: '#0369a1' }}>Hiệu chỉnh thông tin chung</Text>}
          extra={
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => setEditingGeneral(false)}
            >
              Xong
            </Button>
          }
        >
          <Row gutter={[12, 12]}>
            <Col xs={24}>
              <Form.Item label="Tên phác đồ" style={{ marginBottom: 8 }}>
                <Input
                  value={plan.regimenName}
                  onChange={(e) => handlePlanFieldChange('regimenName', e.target.value)}
                  placeholder="VD: Ceftriaxone IV sau đó Ciprofloxacin uống"
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="Tổng thời gian (tuần)" style={{ marginBottom: 8 }}>
                <InputNumber
                  min={0}
                  value={plan.totalDurationWeeks}
                  onChange={handleTotalDurationChange}
                  addonAfter="tuần"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="Chỉ định lâm sàng" style={{ marginBottom: 0 }}>
                <Input.TextArea
                  rows={2}
                  value={plan.indication}
                  onChange={(e) => handlePlanFieldChange('indication', e.target.value)}
                  placeholder="Nhập chỉ định..."
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      ) : (
        <div
          style={{
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            background: '#f8fafc',
            padding: '10px 14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                fontWeight: 700,
                color: '#64748b',
                letterSpacing: '0.05em',
              }}
            >
              CHỈ ĐỊNH
            </Text>
          </div>
          <Paragraph style={{ margin: '4px 0 0', color: '#1e293b', fontSize: 13 }}>
            {plan.indication || 'Chưa có chỉ định cụ thể.'}
          </Paragraph>
        </div>
      )}

      {/* Phases List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {phases.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có giai đoạn điều trị nào."
            style={{ margin: '16px 0' }}
          />
        ) : (
          phases.map((phase) => {
            const isPhaseEditing = editingPhaseId === phase.phaseOrder;

            return (
              <Card
                key={phase.phaseOrder}
                size="small"
                style={{
                  borderRadius: 8,
                  borderColor: isPhaseEditing ? '#93c5fd' : '#e2e8f0',
                  background: '#ffffff',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}
                styles={{
                  header: {
                    background: '#f1f5f9',
                    padding: '8px 12px',
                    minHeight: 40,
                  },
                  body: {
                    padding: 12,
                  },
                }}
                title={
                  <Space size={8} wrap>
                    <Tag color="green" style={{ margin: 0, fontWeight: 600 }}>
                      Giai đoạn {phase.phaseOrder}
                    </Tag>
                    {!isPhaseEditing ? (
                      <>
                        <Text strong style={{ fontSize: 13, color: '#1e293b' }}>
                          {phase.phaseName || `Giai đoạn ${phase.phaseOrder}`}
                        </Text>
                        <Tag color="blue" style={{ margin: 0 }}>
                          {phase.durationWeeks} tuần
                        </Tag>
                      </>
                    ) : null}
                  </Space>
                }
                extra={
                  !readOnly ? (
                    <Space size={4}>
                      <Tooltip title={isPhaseEditing ? 'Xong' : 'Sửa giai đoạn'}>
                        <Button
                          size="small"
                          type={isPhaseEditing ? 'primary' : 'text'}
                          icon={isPhaseEditing ? <CheckOutlined /> : <EditOutlined />}
                          onClick={() => toggleEditPhase(phase.phaseOrder)}
                        />
                      </Tooltip>
                      <Popconfirm
                        title="Xóa giai đoạn này?"
                        description="Toàn bộ kháng sinh trong giai đoạn này cũng sẽ bị xóa."
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDeletePhase(phase.phaseOrder)}
                      >
                        <Tooltip title="Xóa giai đoạn">
                          <Button size="small" danger type="text" icon={<DeleteOutlined />} />
                        </Tooltip>
                      </Popconfirm>
                    </Space>
                  ) : null
                }
              >
                {/* Phase inline editor */}
                {isPhaseEditing && (
                  <div
                    style={{
                      background: '#f8fafc',
                      padding: 10,
                      borderRadius: 6,
                      marginBottom: 12,
                      border: '1px dashed #cbd5e1',
                    }}
                  >
                    <Row gutter={[8, 8]}>
                      <Col xs={24}>
                        <Form.Item label="Tên giai đoạn" style={{ marginBottom: 0 }}>
                          <Input
                            size="small"
                            placeholder="VD: Khởi đầu tĩnh mạch"
                            value={phase.phaseName}
                            onChange={(e) =>
                              handlePhaseFieldChange(phase.phaseOrder, 'phaseName', e.target.value)
                            }
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24}>
                        <Form.Item label="Thời gian" style={{ marginBottom: 0 }}>
                          <InputNumber
                            size="small"
                            min={0}
                            placeholder="Số tuần"
                            value={phase.durationWeeks}
                            onChange={(val) => handlePhaseDurationChange(phase.phaseOrder, val)}
                            addonAfter="tuần"
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24}>
                        <Form.Item label="Ghi chú thời gian" style={{ marginBottom: 0 }}>
                          <Input
                            size="small"
                            placeholder="VD: Tối thiểu 2 tuần"
                            value={phase.durationNote}
                            onChange={(e) =>
                              handlePhaseFieldChange(phase.phaseOrder, 'durationNote', e.target.value)
                            }
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* Phase Duration Note */}
                {!isPhaseEditing && phase.durationNote && (
                  <Paragraph
                    type="secondary"
                    style={{ marginBottom: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <InfoCircleOutlined style={{ color: '#0284c7' }} />
                    {phase.durationNote}
                  </Paragraph>
                )}

                {/* Antibiotics List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(phase.antibiotics ?? []).map((abx, index) => {
                    const key = abxKey(phase.phaseOrder, index);
                    const isAbxEditing = editingAbxKey === key;

                    if (isAbxEditing) {
                      return (
                        <Card
                          key={key}
                          size="small"
                          style={{
                            background: '#f0fdf4',
                            borderColor: '#86efac',
                            borderRadius: 6,
                          }}
                          styles={{ body: { padding: 10 } }}
                          title={
                            <Text strong style={{ fontSize: 12, color: '#166534' }}>
                              Chỉnh sửa kháng sinh #{index + 1}
                            </Text>
                          }
                          extra={
                            <Space size={4}>
                              <Button
                                size="small"
                                type="primary"
                                icon={<CheckOutlined />}
                                onClick={() => setEditingAbxKey(null)}
                              >
                                Xong
                              </Button>
                              <Popconfirm
                                title="Xóa kháng sinh này?"
                                okText="Xóa"
                                cancelText="Hủy"
                                okButtonProps={{ danger: true }}
                                onConfirm={() => handleDeleteAbx(phase.phaseOrder, index)}
                              >
                                <Button size="small" danger type="text" icon={<DeleteOutlined />} />
                              </Popconfirm>
                            </Space>
                          }
                        >
                          <Row gutter={[8, 8]}>
                            <Col xs={24}>
                              <Form.Item label="Tên kháng sinh" style={{ marginBottom: 0 }}>
                                <Input
                                  size="small"
                                  placeholder="VD: Ceftriaxone"
                                  value={abx.antibioticName}
                                  onChange={(e) =>
                                    handleAbxFieldChange(
                                      phase.phaseOrder,
                                      index,
                                      'antibioticName',
                                      e.target.value,
                                    )
                                  }
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={24}>
                              <Form.Item label="Đường dùng" style={{ marginBottom: 0 }}>
                                <Select
                                  size="small"
                                  placeholder="Chọn"
                                  value={abx.route || undefined}
                                  onChange={(val) =>
                                    handleAbxFieldChange(phase.phaseOrder, index, 'route', val)
                                  }
                                  options={ROUTE_OPTIONS}
                                  allowClear
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={24}>
                              <Form.Item label="Vai trò" style={{ marginBottom: 0 }}>
                                <Select
                                  size="small"
                                  placeholder="Chọn"
                                  value={abx.role || undefined}
                                  onChange={(val) =>
                                    handleAbxFieldChange(phase.phaseOrder, index, 'role', val)
                                  }
                                  options={ROLE_OPTIONS}
                                  allowClear
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={24}>
                              <Form.Item label="Liều lượng" style={{ marginBottom: 0 }}>
                                <Input
                                  size="small"
                                  placeholder="VD: 2g"
                                  value={abx.dosage}
                                  onChange={(e) =>
                                    handleAbxFieldChange(
                                      phase.phaseOrder,
                                      index,
                                      'dosage',
                                      e.target.value,
                                    )
                                  }
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={24}>
                              <Form.Item label="Tần suất" style={{ marginBottom: 0 }}>
                                <Input
                                  size="small"
                                  placeholder="VD: 1 lần/ngày"
                                  value={abx.frequency}
                                  onChange={(e) =>
                                    handleAbxFieldChange(
                                      phase.phaseOrder,
                                      index,
                                      'frequency',
                                      e.target.value,
                                    )
                                  }
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={24}>
                              <Form.Item label="Ghi chú thêm" style={{ marginBottom: 0 }}>
                                <Input
                                  size="small"
                                  placeholder="VD: Chỉnh liều theo ClCr..."
                                  value={abx.notes}
                                  onChange={(e) =>
                                    handleAbxFieldChange(
                                      phase.phaseOrder,
                                      index,
                                      'notes',
                                      e.target.value,
                                    )
                                  }
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Card>
                      );
                    }

                    return (
                      <Card
                        key={key}
                        size="small"
                        style={{
                          background: '#f8fafc',
                          borderColor: '#e2e8f0',
                          borderRadius: 6,
                        }}
                        styles={{ body: { padding: '8px 12px' } }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Space size={6} wrap>
                            <Text strong style={{ fontSize: 13, color: '#0f172a' }}>
                              {abx.antibioticName || 'Chưa đặt tên'}
                            </Text>
                            {abx.route && <Tag color="blue" style={{ margin: 0 }}>{abx.route}</Tag>}
                            {abx.role && <Tag color="purple" style={{ margin: 0 }}>{abx.role}</Tag>}
                          </Space>
                          {!readOnly && (
                            <Space size={2}>
                              <Tooltip title="Sửa kháng sinh">
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<EditOutlined />}
                                  onClick={() => toggleEditAbx(key)}
                                />
                              </Tooltip>
                              <Popconfirm
                                title="Xóa kháng sinh này?"
                                okText="Xóa"
                                cancelText="Hủy"
                                okButtonProps={{ danger: true }}
                                onConfirm={() => handleDeleteAbx(phase.phaseOrder, index)}
                              >
                                <Tooltip title="Xóa kháng sinh">
                                  <Button size="small" danger type="text" icon={<DeleteOutlined />} />
                                </Tooltip>
                              </Popconfirm>
                            </Space>
                          )}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 12, color: '#475569' }}>
                          <span>Liều: </span>
                          <Text strong style={{ fontSize: 12 }}>{abx.dosage || '—'}</Text>
                          <span style={{ margin: '0 6px' }}>|</span>
                          <span>Tần suất: </span>
                          <Text strong style={{ fontSize: 12 }}>{abx.frequency || '—'}</Text>
                        </div>
                        {abx.notes ? (
                          <div style={{ marginTop: 4, fontSize: 12, color: '#64748b' }}>
                            <Text type="secondary" italic>{abx.notes}</Text>
                          </div>
                        ) : null}
                      </Card>
                    );
                  })}

                  {/* Add Antibiotic to Phase */}
                  {!readOnly && (
                    <Button
                      type="dashed"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => handleAddAntibiotic(phase.phaseOrder)}
                      style={{ borderRadius: 6 }}
                      block
                    >
                      Thêm kháng sinh vào giai đoạn {phase.phaseOrder}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}

        {/* Add Phase Button */}
        {!readOnly && (
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddPhase}
            style={{ borderRadius: 8, height: 40 }}
            block
          >
            Thêm phase điều trị mới
          </Button>
        )}
      </div>

      {/* Supporting details */}

    </Card>
  );
});

export default SystemicAntibioticTreatment;
