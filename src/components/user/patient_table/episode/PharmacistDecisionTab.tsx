import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Empty, Input, Select, Typography } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import type { ICultureResult, IDoctorRecommendationReview, ISensitivityResult } from '@/types/backend';
import type { LocalPlanData, SystemicPlanData } from '@/types/treatmentType';
import { SystemicAntibioticTreatment } from '../../rag_diagnose/rag_antibiolocal/SystemicAntibioticTreatment';
import type { SystemicAntibioticTreatmentHandle } from '../../rag_diagnose/rag_antibiolocal/SystemicAntibioticTreatment';
import LocalAntibioticTreatment from '../../rag_diagnose/rag_antibiolocal/LocalAntibioticTreatment';
import type { LocalAntibioticTreatmentHandle } from '../../rag_diagnose/rag_antibiolocal/LocalAntibioticTreatment';
import { Antibiogram, AntibioticRow } from './Antibiogram';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const EMPTY_SYSTEMIC_PLAN: SystemicPlanData = {
  category: 'SYSTEMIC_ANTIBIOTIC',
  title: 'Phác đồ kháng sinh toàn thân của dược sĩ',
  regimenName: '',
  indication: '',
  totalDurationWeeks: 0,
  phases: [],
  monitoring: [],
  contraindications: [],
  notes: '',
};

const EMPTY_LOCAL_PLAN: LocalPlanData = {
  category: 'LOCAL_ANTIBIOTIC',
  title: 'Phác đồ kháng sinh tại chỗ của dược sĩ',
  regimenName: '',
  indication: '',
  durationDays: 0,
  durationNote: '',
  antibiotics: [],
  monitoring: [],
  contraindications: [],
  notes: '',
};

interface PharmacistDecisionTabProps {
  reviews: IDoctorRecommendationReview[];
  selectedReviewId?: string;
  cultureResults: ICultureResult[];
  sensitivityMap: Record<string, ISensitivityResult[]>;
  saving?: boolean;
  onReviewChange: (reviewId: string) => void;
  onAntibioticsChange: (data: Record<string, AntibioticRow[]>) => void;
  onSave: (systemic: SystemicPlanData, local: LocalPlanData, notes: string) => void;
}

const PharmacistDecisionTab: React.FC<PharmacistDecisionTabProps> = ({
  reviews,
  selectedReviewId,
  cultureResults,
  sensitivityMap,
  saving,
  onReviewChange,
  onAntibioticsChange,
  onSave,
}) => {
  const review = reviews.find((item) => String(item.id) === selectedReviewId) ?? reviews[0];
  const decision = review?.pharmacistFinalDecision;
  const systemicRef = useRef<SystemicAntibioticTreatmentHandle>(null);
  const localRef = useRef<LocalAntibioticTreatmentHandle>(null);
  const [notes, setNotes] = useState(decision?.notes ?? '');

  const snapshotCultures = useMemo<ICultureResult[]>(() => (
    decision?.sensitivityResultsJson?.map((snapshot, index) => ({
      id: snapshot.cultureId || `decision-culture-${index + 1}`,
      name: snapshot.cultureName,
    })) ?? []
  ), [decision?.sensitivityResultsJson]);
  const snapshotSensitivityMap = useMemo<Record<string, ISensitivityResult[]>>(() => (
    Object.fromEntries((decision?.sensitivityResultsJson ?? []).map((snapshot, index) => {
      const cultureId = snapshot.cultureId || `decision-culture-${index + 1}`;
      return [cultureId, (snapshot.sensitivities ?? []).map((sensitivity) => ({
        id: sensitivity.id,
        cultureId: Number(cultureId) || undefined,
        antibioticName: sensitivity.antibioticName,
        micValue: sensitivity.micValue,
        sensitivityCode: sensitivity.sensitivityCode,
      }))];
    }))
  ), [decision?.sensitivityResultsJson]);

  useEffect(() => setNotes(decision?.notes ?? ''), [decision?.notes, review?.id]);

  if (!review) {
    return <Empty description="Cần có DoctorRecommendationReview trước khi dược sĩ lập phác đồ." />;
  }
  const systemic = decision?.systemicAntibioticPlanJson ?? EMPTY_SYSTEMIC_PLAN;
  const local = decision?.localAntibioticPlanJson ?? EMPTY_LOCAL_PLAN;
  const displayedCultures = snapshotCultures.length ? snapshotCultures : cultureResults;
  const displayedSensitivityMap = snapshotCultures.length ? snapshotSensitivityMap : sensitivityMap;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', minWidth: 0, overflow: 'hidden' }}>
      <Card size="small">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flex: '1 1 320px', minWidth: 0, flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <Text strong>Áp dụng cho version</Text>
            <Select
              value={String(review.id)}
              style={{ flex: '1 1 180px', minWidth: 0, maxWidth: 320 }}
              options={reviews.map((item) => ({
                value: String(item.id),
                label: `Version ${item.run?.runNo ?? item.run?.id ?? item.runId ?? '?'}`,
              }))}
              onChange={onReviewChange}
            />
          </div>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={() => onSave(
              systemicRef.current?.getData() ?? systemic,
              localRef.current?.getData() ?? local,
              notes,
            )}
          >
            Lưu quyết định dược sĩ
          </Button>
        </div>
      </Card>

      <Alert
        type="info"
        showIcon
        message="Phác đồ kháng sinh thuộc quyết định của dược sĩ"
        description="Kháng sinh đồ và hai phác đồ được lưu cùng quyết định cuối của dược sĩ ở version đã chọn."
      />
      <Card title="Kháng sinh đồ" size="small" style={{ minWidth: 0, maxWidth: '100%' }} styles={{ body: { padding: 0, minWidth: 0 } }}>
        <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'auto' }}>
          <div style={{ minWidth: 720 }}>
            <Antibiogram
              key={`antibiogram-${review.id}`}
              cultureResults={displayedCultures.map((culture) => ({ ...culture, _tempId: String(culture.id) }))}
              sensitivityMap={displayedSensitivityMap}
              onAntibioticsChange={onAntibioticsChange}
            />
          </div>
        </div>
      </Card>
      <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'auto' }}>
        <div style={{ minWidth: 720 }}>
          <SystemicAntibioticTreatment
            key={`systemic-${review.id}`}
            ref={systemicRef}
            guidelinePlan={systemic}
          />
        </div>
      </div>
      <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'auto' }}>
        <div style={{ minWidth: 720 }}>
          <LocalAntibioticTreatment
            key={`local-${review.id}`}
            ref={localRef}
            localPlan={local}
          />
        </div>
      </div>
      <Card title="Ghi chú dược sĩ" size="small">
        <Paragraph type="secondary">Ghi lại lý do lựa chọn, hiệu chỉnh liều hoặc điểm cần theo dõi.</Paragraph>
        <TextArea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </Card>
    </div>
  );
};

export default PharmacistDecisionTab;
