import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Card, Col, Empty, Row, Select, Spin, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { RobotOutlined } from '@ant-design/icons';
import { callFetchAiRecommendationRunDetail, callFetchAiRecommendationRuns } from '@/apis/api';
import type {
  IAiRecommendationRun,
  IAiRecommendationRunDetail,
  ICultureResult,
  ISensitivityResult,
} from '@/types/backend';
import type { LocalPlanData, SystemicPlanData, TemplateAntibiotic } from '@/types/treatmentType';
import { parseItemJson } from '../../diagnose_steps/treatment_plan/utils/itemJson';
import { Antibiogram, AntibioticRow } from './Antibiogram';

const { Text } = Typography;

interface AntibiogramAiVersionTabProps {
  episodeId?: string | number;
  loadAi: boolean;
  preferredRunId?: string | number;
  cultureResults: ICultureResult[];
  sensitivityMap: Record<string, ISensitivityResult[]>;
  onAntibioticsChange: (data: Record<string, AntibioticRow[]>) => void;
}

interface AiAntibioticRow {
  key: string;
  treatmentType: 'SYSTEMIC' | 'LOCAL';
  regimen: string;
  phase: string;
  antibiotic: TemplateAntibiotic;
  duration: string;
}

const statusLabel: Record<string, string> = {
  SUCCESS: 'Hoàn tất',
  PARTIAL: 'Một phần',
  PROCESSING: 'Đang xử lý',
  FAILED: 'Thất bại',
  CANCELLED: 'Đã hủy',
  TIMEOUT: 'Quá thời gian',
};

const parsePlan = <T,>(detail: IAiRecommendationRunDetail | null, category: string): T | null => {
  const item = detail?.items?.find((candidate) => candidate.category === category);
  if (!item) return null;
  try {
    return parseItemJson(item) as T;
  } catch {
    return null;
  }
};

const buildRows = (detail: IAiRecommendationRunDetail | null): AiAntibioticRow[] => {
  const systemic = parsePlan<SystemicPlanData>(detail, 'SYSTEMIC_ANTIBIOTIC');
  const local = parsePlan<LocalPlanData>(detail, 'LOCAL_ANTIBIOTIC');
  const rows: AiAntibioticRow[] = [];

  systemic?.phases?.forEach((phase, phaseIndex) => {
    phase.antibiotics?.forEach((antibiotic, antibioticIndex) => {
      rows.push({
        key: `systemic-${phaseIndex}-${antibioticIndex}`,
        treatmentType: 'SYSTEMIC',
        regimen: systemic.regimenName || 'Phác đồ toàn thân',
        phase: phase.phaseName || `Giai đoạn ${phase.phaseOrder || phaseIndex + 1}`,
        antibiotic,
        duration: phase.durationWeeks ? `${phase.durationWeeks} tuần` : phase.durationNote || '—',
      });
    });
  });

  local?.antibiotics?.forEach((antibiotic, antibioticIndex) => {
    rows.push({
      key: `local-${antibioticIndex}`,
      treatmentType: 'LOCAL',
      regimen: local.regimenName || 'Phác đồ tại chỗ',
      phase: 'Tại chỗ',
      antibiotic,
      duration: local.durationDays ? `${local.durationDays} ngày` : local.durationNote || '—',
    });
  });

  return rows;
};

const columns: ColumnsType<AiAntibioticRow> = [
  {
    title: 'Nhóm',
    dataIndex: 'treatmentType',
    width: 105,
    render: (value: AiAntibioticRow['treatmentType']) => (
      <Tag color={value === 'SYSTEMIC' ? 'blue' : 'cyan'}>
        {value === 'SYSTEMIC' ? 'Toàn thân' : 'Tại chỗ'}
      </Tag>
    ),
  },
  { title: 'Phác đồ', dataIndex: 'regimen', width: 180 },
  { title: 'Giai đoạn', dataIndex: 'phase', width: 140 },
  {
    title: 'Kháng sinh',
    width: 160,
    render: (_, row) => <Text strong>{row.antibiotic.antibioticName || '—'}</Text>,
  },
  { title: 'Liều', width: 130, render: (_, row) => row.antibiotic.dosage || '—' },
  { title: 'Tần suất', width: 120, render: (_, row) => row.antibiotic.frequency || '—' },
  { title: 'Đường dùng', width: 120, render: (_, row) => row.antibiotic.route || '—' },
  { title: 'Thời lượng', dataIndex: 'duration', width: 120 },
];

const AntibiogramAiVersionTab: React.FC<AntibiogramAiVersionTabProps> = ({
  episodeId,
  loadAi,
  preferredRunId,
  cultureResults,
  sensitivityMap,
  onAntibioticsChange,
}) => {
  const [runs, setRuns] = useState<IAiRecommendationRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>();
  const [detail, setDetail] = useState<IAiRecommendationRunDetail | null>(null);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const detailCacheRef = useRef(new Map<string, IAiRecommendationRunDetail>());

  useEffect(() => {
    detailCacheRef.current.clear();
    setRuns([]);
    setSelectedRunId(undefined);
    setDetail(null);
    setLoadingRuns(false);
    setLoadingDetail(false);
  }, [episodeId]);

  useEffect(() => {
    let active = true;
    if (!episodeId || !loadAi || runs.length) return () => { active = false; };

    setLoadingRuns(true);
    void callFetchAiRecommendationRuns(
      String(episodeId),
      'page=0&size=50&sort=createdAt,desc',
    ).then((response) => {
      if (!active) return;
      const nextRuns = (response?.data?.result ?? []).filter((run) => run.id != null);
      const preferred = preferredRunId != null
        ? nextRuns.find((run) => String(run.id) === String(preferredRunId))
        : undefined;
      const latestCompleted = nextRuns.find((run) => run.status === 'SUCCESS' || run.status === 'PARTIAL');
      const initialRun = preferred ?? latestCompleted ?? nextRuns[0];
      setRuns(nextRuns);
      setSelectedRunId(initialRun?.id != null ? String(initialRun.id) : undefined);
    }).catch(() => {
      if (active) setRuns([]);
    }).finally(() => {
      if (active) setLoadingRuns(false);
    });

    return () => { active = false; };
  }, [episodeId, loadAi, preferredRunId, runs.length]);

  useEffect(() => {
    if (preferredRunId == null) return;
    const preferredExists = runs.some((run) => String(run.id) === String(preferredRunId));
    if (preferredExists) setSelectedRunId(String(preferredRunId));
  }, [preferredRunId, runs]);

  useEffect(() => {
    let active = true;
    if (!selectedRunId) {
      setDetail(null);
      setLoadingDetail(false);
      return () => { active = false; };
    }
    const cached = detailCacheRef.current.get(selectedRunId);
    if (cached) {
      setDetail(cached);
      return () => { active = false; };
    }

    setLoadingDetail(true);
    setDetail(null);
    void callFetchAiRecommendationRunDetail(selectedRunId)
      .then((response) => {
        if (!active || !response?.data) return;
        detailCacheRef.current.set(selectedRunId, response.data);
        setDetail(response.data);
      })
      .catch(() => {
        if (active) setDetail(null);
      })
      .finally(() => {
        if (active) setLoadingDetail(false);
      });

    return () => { active = false; };
  }, [selectedRunId]);

  const rows = useMemo(() => buildRows(detail), [detail]);

  return (
    <Row gutter={[16, 16]} align="stretch">
      <Col xs={24} lg={12} style={{ minWidth: 0 }}>
        <Card title="Kháng sinh đồ" size="small" styles={{ body: { padding: 0 } }}>
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <div style={{ minWidth: 720 }}>
              <Antibiogram
                cultureResults={cultureResults.map((culture) => ({
                  ...culture,
                  _tempId: String(culture.id),
                }))}
                sensitivityMap={sensitivityMap}
                onAntibioticsChange={onAntibioticsChange}
              />
            </div>
          </div>
        </Card>
      </Col>

      <Col xs={24} lg={12} style={{ minWidth: 0 }}>
        <Card
          title={<span><RobotOutlined /> Kháng sinh AI đề xuất theo phiên bản</span>}
          size="small"
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Text strong>Phiên bản AI</Text>
            <Select
              loading={loadingRuns}
              value={selectedRunId}
              placeholder="Chọn version AI"
              style={{ flex: '1 1 220px', minWidth: 0, maxWidth: 360 }}
              onChange={setSelectedRunId}
              options={runs.map((run) => ({
                value: String(run.id),
                label: `Phiên bản ${run.runNo ?? run.id} · ${statusLabel[run.status ?? ''] ?? run.status ?? '—'}`,
              }))}
            />
          </div>
          <Alert
            type="info"
            showIcon
            message="Dữ liệu tham khảo từ AI"
            description="Bảng này chỉ đọc; thay đổi kháng sinh đồ được lưu qua nút Lưu bệnh án."
            style={{ marginBottom: 16 }}
          />
          <Spin spinning={loadingDetail}>
            {selectedRunId && rows.length ? (
              <Table<AiAntibioticRow>
                rowKey="key"
                size="small"
                pagination={false}
                columns={columns}
                dataSource={rows}
                scroll={{ x: 1075 }}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={selectedRunId
                  ? 'Phiên bản này chưa có kháng sinh AI đề xuất.'
                  : 'Bệnh án chưa có phiên bản recommendation AI.'}
              />
            )}
          </Spin>
        </Card>
      </Col>
    </Row>
  );
};

export default AntibiogramAiVersionTab;
