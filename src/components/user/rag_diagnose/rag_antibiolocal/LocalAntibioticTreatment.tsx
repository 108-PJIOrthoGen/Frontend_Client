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
  Form,
  Alert,
  Divider,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  CheckOutlined,
  MedicineBoxOutlined,
  InfoCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { LocalPlanData, TemplateAntibiotic } from '@/types/treatmentType';

const { Text, Title, Paragraph } = Typography;

export interface LocalAntibioticTreatmentHandle {
  getData: () => LocalPlanData;
}

interface LocalAntibioticTreatmentProps {
  localPlan: LocalPlanData;
  readOnly?: boolean;
  showSupportingDetails?: boolean;
}

const ROUTE_OPTIONS = [
  { value: 'LOCAL_CEMENT', label: 'LOCAL_CEMENT (Xi măng)' },
  { value: 'INTRA_ARTICULAR', label: 'INTRA_ARTICULAR (Khớp)' },
  { value: 'IRRIGATION', label: 'IRRIGATION (Rửa)' },
  { value: 'BEADS', label: 'BEADS (Hạt chuỗi)' },
  { value: 'SPACER', label: 'SPACER (Spacer)' },
  { value: 'COLLAGEN_SPONGE', label: 'COLLAGEN_SPONGE (Xốp collagen)' },
];

const ROLE_OPTIONS = [
  { value: 'PRIMARY', label: 'PRIMARY (Chính)' },
  { value: 'ADJUNCT', label: 'ADJUNCT (Bổ trợ)' },
  { value: 'SYNERGISTIC', label: 'SYNERGISTIC (Hiệp đồng)' },
];

const LocalAntibioticTreatment = forwardRef<
  LocalAntibioticTreatmentHandle,
  LocalAntibioticTreatmentProps
>(({ localPlan, readOnly = false, showSupportingDetails = true }, ref) => {
  const [plan, setPlan] = useState<LocalPlanData>(() => ({
    ...localPlan,
    regimenName: localPlan.regimenName || 'Phác đồ kháng sinh tại chỗ',
    indication: localPlan.indication || '',
    durationDays: localPlan.durationDays ?? 0,
    durationNote: localPlan.durationNote || '',
    deliveryInfo: {
      deliveryMethod: localPlan.deliveryInfo?.deliveryMethod || '',
      spacerType: localPlan.deliveryInfo?.spacerType || '',
      cementBrandSuggestion: localPlan.deliveryInfo?.cementBrandSuggestion || '',
      mixingRatio: localPlan.deliveryInfo?.mixingRatio || '',
    },
  }));
  const [antibiotics, setAntibiotics] = useState<TemplateAntibiotic[]>(
    () => localPlan.antibiotics ?? [],
  );

  const [editingGeneral, setEditingGeneral] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      getData: () => ({
        ...plan,
        category: 'LOCAL_ANTIBIOTIC',
        antibiotics,
      }),
    }),
    [plan, antibiotics],
  );

  // --- Plan Level Handlers ---
  const handlePlanFieldChange = (
    field: keyof Pick<LocalPlanData, 'regimenName' | 'indication' | 'durationNote' | 'notes'>,
    value: string,
  ) => {
    if (readOnly) return;
    setPlan((prev) => ({ ...prev, [field]: value }));
  };

  const handleDurationDaysChange = (value: number | null) => {
    if (readOnly) return;
    setPlan((prev) => ({ ...prev, durationDays: value ?? 0 }));
  };

  const handleDeliveryInfoChange = (
    field: 'deliveryMethod' | 'spacerType' | 'cementBrandSuggestion' | 'mixingRatio',
    value: string,
  ) => {
    if (readOnly) return;
    setPlan((prev) => ({
      ...prev,
      deliveryInfo: {
        ...(prev.deliveryInfo ?? {}),
        [field]: value,
      },
    }));
  };

  // --- Antibiotic Handlers ---
  const toggleEdit = useCallback(
    (index: number) => {
      if (readOnly) return;
      setEditingIndex((prev) => (prev === index ? null : index));
    },
    [readOnly],
  );

  const handleFieldChange = useCallback(
    (index: number, field: keyof TemplateAntibiotic, value: string) => {
      if (readOnly) return;
      setAntibiotics((prev) =>
        prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)),
      );
    },
    [readOnly],
  );

  const handleDelete = useCallback(
    (index: number) => {
      if (readOnly) return;
      setAntibiotics((prev) => prev.filter((_, i) => i !== index));
      setEditingIndex(null);
    },
    [readOnly],
  );

  const handleAdd = useCallback(() => {
    if (readOnly) return;
    const newAbx: TemplateAntibiotic = {
      antibioticName: '',
      dosage: '',
      frequency: '',
      route: 'LOCAL_CEMENT',
      role: 'PRIMARY',
      notes: '',
    };
    setAntibiotics((prev) => [...prev, newAbx]);
    setEditingIndex(antibiotics.length);
  }, [readOnly, antibiotics.length]);

  const deliveryInfo = plan.deliveryInfo;

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
              background: 'linear-gradient(135deg, #ecfdf5 0%, #a7f3d0 100%)',
              border: '1px solid #6ee7b7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              fontSize: 18,
            }}
          >
            <MedicineBoxOutlined />
          </div>
          <div>
            <Title level={5} style={{ margin: 0, fontSize: 15, color: '#0f172a' }}>
              Phác đồ kháng sinh tại chỗ
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {plan.regimenName || 'Phác đồ dược sĩ'}
            </Text>
          </div>
        </div>
      }
      extra={
        <Space size={8}>
          <Tag color="cyan" style={{ margin: 0, fontWeight: 600, padding: '2px 8px' }}>
            {plan.durationDays || 0} NGÀY
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
          style={{ background: '#f0fdfa', borderColor: '#99f6e4', borderRadius: 8 }}
          title={<Text strong style={{ fontSize: 13, color: '#0f766e' }}>Hiệu chỉnh thông tin chung</Text>}
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
                  placeholder="VD: Spacer kháng sinh tạm thời với Gentamicin + Vancomycin"
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="Thời gian (ngày)" style={{ marginBottom: 8 }}>
                <InputNumber
                  min={0}
                  value={plan.durationDays}
                  onChange={handleDurationDaysChange}
                  addonAfter="ngày"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="Chẩn đoán / Chỉ định" style={{ marginBottom: 8 }}>
                <Input.TextArea
                  rows={2}
                  value={plan.indication}
                  onChange={(e) => handlePlanFieldChange('indication', e.target.value)}
                  placeholder="Nhập chẩn đoán hoặc chỉ định..."
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="Ghi chú thời gian sử dụng" style={{ marginBottom: 0 }}>
                <Input
                  value={plan.durationNote}
                  onChange={(e) => handlePlanFieldChange('durationNote', e.target.value)}
                  placeholder="VD: 6-8 tuần trước khi thay khớp lần hai"
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
          <Text
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              fontWeight: 700,
              color: '#ef4444',
              letterSpacing: '0.05em',
            }}
          >
            CHẨN ĐOÁN / CHỈ ĐỊNH
          </Text>
          <Paragraph style={{ margin: '4px 0 0', color: '#1e293b', fontSize: 13 }}>
            {plan.indication || 'Chưa có thông tin chỉ định.'}
          </Paragraph>
          {plan.durationNote ? (
            <Paragraph
              type="secondary"
              style={{ margin: '6px 0 0', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <InfoCircleOutlined style={{ color: '#0891b2' }} />
              {plan.durationNote}
            </Paragraph>
          ) : null}
        </div>
      )}

      {/* Antibiotics list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {antibiotics.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có kháng sinh tại chỗ nào."
            style={{ margin: '16px 0' }}
          />
        ) : (
          antibiotics.map((abx, index) => {
            const isEditing = editingIndex === index;

            if (isEditing) {
              return (
                <Card
                  key={index}
                  size="small"
                  style={{
                    background: '#f0fdf4',
                    borderColor: '#86efac',
                    borderRadius: 8,
                  }}
                  styles={{ body: { padding: 12 } }}
                  title={
                    <Text strong style={{ fontSize: 12, color: '#166534' }}>
                      Chỉnh sửa kháng sinh tại chỗ #{index + 1}
                    </Text>
                  }
                  extra={
                    <Space size={4}>
                      <Button
                        size="small"
                        type="primary"
                        icon={<CheckOutlined />}
                        onClick={() => setEditingIndex(null)}
                      >
                        Xong
                      </Button>
                      <Popconfirm
                        title="Xóa kháng sinh này?"
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDelete(index)}
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
                          placeholder="VD: Gentamicin"
                          value={abx.antibioticName}
                          onChange={(e) => handleFieldChange(index, 'antibioticName', e.target.value)}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item label="Đường dùng" style={{ marginBottom: 0 }}>
                        <Select
                          size="small"
                          placeholder="Chọn"
                          value={abx.route || undefined}
                          onChange={(val) => handleFieldChange(index, 'route', val)}
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
                          onChange={(val) => handleFieldChange(index, 'role', val)}
                          options={ROLE_OPTIONS}
                          allowClear
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item label="Liều lượng" style={{ marginBottom: 0 }}>
                        <Input
                          size="small"
                          placeholder="VD: 1g/40g xi măng"
                          value={abx.dosage}
                          onChange={(e) => handleFieldChange(index, 'dosage', e.target.value)}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item label="Tần suất" style={{ marginBottom: 0 }}>
                        <Input
                          size="small"
                          placeholder="VD: Đặt cố định"
                          value={abx.frequency}
                          onChange={(e) => handleFieldChange(index, 'frequency', e.target.value)}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item label="Ghi chú thêm" style={{ marginBottom: 0 }}>
                        <Input
                          size="small"
                          placeholder="VD: Phối hợp cùng Vancomycin..."
                          value={abx.notes}
                          onChange={(e) => handleFieldChange(index, 'notes', e.target.value)}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              );
            }

            return (
              <Card
                key={index}
                size="small"
                style={{
                  background: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: 8,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}
                styles={{ body: { padding: '10px 14px' } }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Space size={6} wrap>
                    <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
                      {abx.antibioticName || 'Chưa đặt tên'}
                    </Text>
                    {abx.route && <Tag color="cyan" style={{ margin: 0 }}>{abx.route}</Tag>}
                    {abx.role && <Tag color="purple" style={{ margin: 0 }}>{abx.role}</Tag>}
                  </Space>
                  {!readOnly && (
                    <Space size={2}>
                      <Tooltip title="Sửa kháng sinh">
                        <Button
                          size="small"
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => toggleEdit(index)}
                        />
                      </Tooltip>
                      <Popconfirm
                        title="Xóa kháng sinh này?"
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDelete(index)}
                      >
                        <Tooltip title="Xóa kháng sinh">
                          <Button size="small" danger type="text" icon={<DeleteOutlined />} />
                        </Tooltip>
                      </Popconfirm>
                    </Space>
                  )}
                </div>
                <div style={{ marginTop: 4, fontSize: 13, color: '#475569' }}>
                  <span>Liều: </span>
                  <Text strong style={{ fontSize: 13 }}>{abx.dosage || '—'}</Text>
                  <span style={{ margin: '0 6px' }}>|</span>
                  <span>Tần suất: </span>
                  <Text strong style={{ fontSize: 13 }}>{abx.frequency || '—'}</Text>
                </div>
                {abx.notes ? (
                  <div style={{ marginTop: 4, fontSize: 12, color: '#0891b2' }}>
                    <Text type="secondary">Note: {abx.notes}</Text>
                  </div>
                ) : null}
              </Card>
            );
          })
        )}

        {/* Add Antibiotic Button */}
        {!readOnly && (
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            style={{ borderRadius: 8, height: 38, marginTop: 4 }}
            block
          >
            Thêm kháng sinh mới
          </Button>
        )}
      </div>


    </Card>
  );
});

export default LocalAntibioticTreatment;
