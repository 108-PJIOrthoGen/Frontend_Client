import React, { useState } from 'react';
import {
  AimOutlined,
  DownOutlined,
  ExperimentOutlined,
  InfoCircleOutlined,
  ScissorOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type {
  LocalPlanData,
  SurgeryPlanData,
  SystemicPlanData,
  TemplateAntibiotic,
} from '@/types/treatmentType';
import './TreatmentDraftPanel.css';

interface Props {
  surgeryPlan: SurgeryPlanData | null;
  systemicPlan: SystemicPlanData | null;
  localPlan: LocalPlanData | null;
}

type ModuleTone = 'teal' | 'slate';

const formatDuration = (weeks: number) => `${weeks} tuần`;

const titleForSurgery = (plan: SurgeryPlanData) =>
  plan.surgeryStrategyType?.replaceAll('_', ' ') || 'Phương án phẫu thuật';

const countSafetyItems = (monitoring?: string[], contraindications?: string[]) =>
  (monitoring?.length ?? 0) + (contraindications?.length ?? 0);

const durationClass = (duration: number) => `tdp-span-${Math.max(1, Math.min(24, Math.round(duration)))}`;

const markerClass = (value: number, total: number) => {
  const positions = [0, 8, 17, 25, 33, 42, 50, 58, 67, 75, 83, 92, 100];
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const nearest = positions.reduce((best, position) =>
    Math.abs(position - percentage) < Math.abs(best - percentage) ? position : best
  );
  return `tdp-marker-${nearest}`;
};

const TreatmentModule: React.FC<{
  eyebrow: string;
  title: string;
  icon: React.ReactNode;
  tone?: ModuleTone;
  duration?: string;
  priority?: string;
  children: React.ReactNode;
}> = ({ eyebrow, title, icon, tone = 'teal', duration, priority, children }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className={`tdp-module tdp-module--${tone}`}>
      <button type="button" aria-expanded={isOpen} onClick={() => setIsOpen((current) => !current)} className="tdp-module__head">
        <span className="tdp-module__icon">{icon}</span>
        <span className="tdp-module__titles">
          <span className="tdp-module__eyebrow">{eyebrow}</span>
          <span className="tdp-module__title">{title}</span>
        </span>
        {priority && <span className="tdp-pill tdp-pill--priority">Ưu tiên {priority}</span>}
        {duration && <span className="tdp-pill tdp-pill--duration">{duration}</span>}
        <DownOutlined className={isOpen ? 'tdp-module__chevron' : 'tdp-module__chevron tdp-module__chevron--closed'} />
      </button>
      {isOpen && <div className="tdp-module__body">{children}</div>}
    </section>
  );
};

const MedicationRow: React.FC<{ antibiotic: TemplateAntibiotic }> = ({ antibiotic }) => (
  <div className="tdp-medication">
    <div className="tdp-medication__dose">
      <strong>{antibiotic.dosage || '—'}</strong>
      <span>{antibiotic.frequency || 'Theo chỉ định'}</span>
    </div>
    <div className="tdp-medication__details">
      <div className="tdp-medication__name-row">
        <strong>{antibiotic.antibioticName || 'Kháng sinh'}</strong>
        {antibiotic.route && <span className="tdp-tag tdp-tag--route">{antibiotic.route}</span>}
        {antibiotic.role && <span className="tdp-tag tdp-tag--primary">{antibiotic.role}</span>}
      </div>
      {antibiotic.notes && <p>{antibiotic.notes}</p>}
    </div>
  </div>
);

const SafetyDisclosure: React.FC<{
  monitoring?: string[];
  contraindications?: string[];
  notes?: string;
}> = ({ monitoring = [], contraindications = [], notes }) => {
  const [isOpen, setIsOpen] = useState(false);
  const count = countSafetyItems(monitoring, contraindications);

  if (count === 0 && !notes) return null;

  return (
    <div className="tdp-disclosure">
      <button type="button" aria-expanded={isOpen} onClick={() => setIsOpen((current) => !current)} className="tdp-disclosure__trigger">
        <WarningOutlined />
        Theo dõi và thận trọng
        {count > 0 && <span className="tdp-disclosure__count">{count}</span>}
        <DownOutlined className={isOpen ? 'tdp-disclosure__chevron tdp-disclosure__chevron--open' : 'tdp-disclosure__chevron'} />
      </button>
      {isOpen && (
        <div className="tdp-disclosure__content">
          {monitoring.map((item) => <p key={item} className="tdp-disclosure__item tdp-disclosure__item--warn">{item}</p>)}
          {contraindications.map((item) => <p key={item} className="tdp-disclosure__item tdp-disclosure__item--danger">{item}</p>)}
          {notes && <p className="tdp-disclosure__item">{notes}</p>}
        </div>
      )}
    </div>
  );
};

const TimelineRow: React.FC<{ label: string; sublabel: string; children: React.ReactNode }> = ({ label, sublabel, children }) => (
  <div className="tdp-gantt__row">
    <div className="tdp-gantt__label">{label}<span>{sublabel}</span></div>
    <div className="tdp-gantt__track">{children}</div>
  </div>
);

const TimelineLegend: React.FC<{ className: string; children: React.ReactNode }> = ({ className, children }) => (
  <span className="tdp-gantt__legend-item"><i className={className} />{children}</span>
);

const TreatmentTimeline: React.FC<Props> = ({ surgeryPlan, systemicPlan, localPlan }) => {
  const systemicWeeks = systemicPlan?.totalDurationWeeks ?? 0;
  const localWeeks = localPlan ? Math.max(1, Math.ceil(localPlan.durationDays / 7)) : 0;
  const totalWeeks = Math.max(systemicWeeks, localWeeks, 1);
  const phases = systemicPlan?.phases ?? [];
  const phaseEnds = phases.reduce<number[]>((ends, phase) => [...ends, (ends.at(-1) ?? 0) + phase.durationWeeks], []);

  return (
    <section className="tdp-overview">
      <div className="tdp-overview__head">
        <h2>Dòng thời gian điều trị tổng quan</h2>
        <span>{systemicWeeks > 0 ? `${systemicWeeks} tuần · tính từ ngày phẫu thuật` : 'Đang chờ dữ liệu'}</span>
      </div>
      <div className="tdp-gantt">
        <div className="tdp-gantt__grid" aria-hidden="true">{Array.from({ length: 13 }, (_, index) => <i key={index} />)}</div>
        {surgeryPlan && (
          <TimelineRow label="Phẫu thuật" sublabel="Ngày 0">
            <span className="tdp-gantt__bar tdp-gantt__bar--surgery">
              <span className="tdp-gantt__tip"><b>Ngày 0</b>{titleForSurgery(surgeryPlan)}</span>
            </span>
            <span className={`tdp-gantt__marker ${markerClass(Math.min(2, totalWeeks), totalWeeks)}`}>
              <span className="tdp-gantt__tip"><b>Đánh giá đáp ứng</b>Rà soát đáp ứng điều trị và kế hoạch tiếp theo.</span>
            </span>
          </TimelineRow>
        )}
        {systemicPlan && (
          <TimelineRow label="Kháng sinh toàn thân" sublabel={formatDuration(systemicWeeks)}>
            <span className="tdp-gantt__segments">
              {phases.length > 0 ? phases.map((phase, index) => (
                <span key={phase.phaseOrder} className={`tdp-gantt__bar ${index === 0 ? 'tdp-gantt__bar--iv' : 'tdp-gantt__bar--oral'} ${durationClass(phase.durationWeeks)}`}>
                  <span className="tdp-gantt__bar-label">{phase.phaseName || `Giai đoạn ${phase.phaseOrder}`}</span>
                  <span className="tdp-gantt__tip"><b>{formatDuration(phase.durationWeeks)}</b>{phase.durationNote || phase.phaseName}</span>
                </span>
              )) : <span className={`tdp-gantt__bar tdp-gantt__bar--iv ${durationClass(systemicWeeks)}`} />}
            </span>
            {phaseEnds.map((week, index) => (
              <span key={week} className={`tdp-gantt__marker tdp-gantt__marker--end ${markerClass(week, totalWeeks)}`}>
                <span className="tdp-gantt__tip"><b>Tuần {week}</b>{index === phaseEnds.length - 1 ? 'Kết thúc kháng sinh toàn thân.' : 'Mốc chuyển giai đoạn điều trị.'}</span>
              </span>
            ))}
          </TimelineRow>
        )}
        {localPlan && (
          <TimelineRow label="Kháng sinh tại chỗ" sublabel={`${localPlan.durationDays} ngày`}>
            <span className="tdp-gantt__segments">
              <span className={`tdp-gantt__bar tdp-gantt__bar--cement ${durationClass(localWeeks)}`}>
                <span className="tdp-gantt__bar-label">{localPlan.regimenName || 'Điều trị tại chỗ'}</span>
                <span className="tdp-gantt__tip"><b>{formatDuration(localWeeks)}</b>{localPlan.durationNote || localPlan.indication}</span>
              </span>
            </span>
            <span className={`tdp-gantt__marker tdp-gantt__marker--end ${markerClass(localWeeks, totalWeeks)}`}>
              <span className="tdp-gantt__tip"><b>Tuần {localWeeks}</b>Kết thúc điều trị kháng sinh tại chỗ.</span>
            </span>
          </TimelineRow>
        )}
        <div className="tdp-gantt__axis">
          <span>Tuần 0</span>
          {phaseEnds.slice(0, -1).map((week) => <span key={week} className={markerClass(week, totalWeeks)}>Tuần {week}</span>)}
          <span className="tdp-gantt__axis-end">Tuần {totalWeeks}</span>
        </div>
      </div>
      <div className="tdp-gantt__legend">
        {systemicPlan && <TimelineLegend className="tdp-gantt__legend-iv">Kháng sinh toàn thân</TimelineLegend>}
        {localPlan && <TimelineLegend className="tdp-gantt__legend-cement">Kháng sinh tại chỗ</TimelineLegend>}
        {surgeryPlan && <TimelineLegend className="tdp-gantt__legend-marker">Mốc đánh giá điều trị</TimelineLegend>}
      </div>
    </section>
  );
};

/** Read-only viewer of the AI treatment plan, styled after the approved clinical drafts. */
const TreatmentDraftPanel: React.FC<Props> = ({ surgeryPlan, systemicPlan, localPlan }) => {
  const hasPlan = Boolean(surgeryPlan || systemicPlan || localPlan);

  return (
    <div className="tdp-panel">
      <div className="tdp-panel__content">
        <div className="tdp-notice">
          <InfoCircleOutlined />
          <p><strong>Phác đồ AI chỉ để tham khảo.</strong> Bác sĩ nhập chẩn đoán và phác đồ chính thức ở bước tiếp theo.</p>
        </div>
        {hasPlan ? (
          <>
            <TreatmentTimeline surgeryPlan={surgeryPlan} systemicPlan={systemicPlan} localPlan={localPlan} />
            {surgeryPlan && (
              <TreatmentModule eyebrow="Phác đồ phẫu thuật" title={titleForSurgery(surgeryPlan)} icon={<ScissorOutlined />} priority={surgeryPlan.priorityLevel} duration={surgeryPlan.estimatedTotalTreatmentTime}>
                {surgeryPlan.strategyRationale && <p className="tdp-rationale">{surgeryPlan.strategyRationale}</p>}
                {surgeryPlan.priorityNote && <div className="tdp-callout"><WarningOutlined /><span>{surgeryPlan.priorityNote}</span></div>}
                {(surgeryPlan.stages ?? []).map((stage) => (
                  <div key={stage.stageOrder} className="tdp-phase">
                    <div className="tdp-phase__head"><span>Bước {stage.stageOrder}</span><strong>{stage.stageName || 'Giai đoạn phẫu thuật'}</strong><em>~{stage.estimatedDurationMinutes} phút</em></div>
                  </div>
                ))}
                {surgeryPlan.notes && <div className="tdp-note"><strong>Lưu ý: </strong>{surgeryPlan.notes}</div>}
                {surgeryPlan.risksAndComplications?.length ? <SafetyDisclosure contraindications={surgeryPlan.risksAndComplications} /> : null}
              </TreatmentModule>
            )}
            {systemicPlan && (
              <TreatmentModule eyebrow="Điều trị kháng sinh toàn thân" title={systemicPlan.regimenName || systemicPlan.title || 'Kháng sinh toàn thân'} icon={<ExperimentOutlined />} duration={formatDuration(systemicPlan.totalDurationWeeks)}>
                {systemicPlan.indication && <p className="tdp-rationale">{systemicPlan.indication}</p>}
                {(systemicPlan.phases ?? []).map((phase) => (
                  <div key={phase.phaseOrder} className="tdp-phase">
                    <div className="tdp-phase__head"><span>Giai đoạn {phase.phaseOrder}</span><strong>{phase.phaseName || 'Điều trị kháng sinh'}</strong><em>{formatDuration(phase.durationWeeks)}</em></div>
                    {phase.durationNote && <p className="tdp-phase__description">{phase.durationNote}</p>}
                    <div>{(phase.antibiotics ?? []).map((antibiotic, index) => <MedicationRow key={`${phase.phaseOrder}-${index}`} antibiotic={antibiotic} />)}</div>
                  </div>
                ))}
                <SafetyDisclosure monitoring={systemicPlan.monitoring} contraindications={systemicPlan.contraindications} notes={systemicPlan.notes} />
              </TreatmentModule>
            )}
            {localPlan && (
              <TreatmentModule eyebrow="Phác đồ kháng sinh tại chỗ" title={localPlan.regimenName || localPlan.title || 'Kháng sinh tại chỗ'} icon={<AimOutlined />} tone="slate" duration={`${localPlan.durationDays} ngày`}>
                {localPlan.indication && <p className="tdp-rationale">{localPlan.indication}</p>}
                {localPlan.durationNote && <p className="tdp-phase__description">{localPlan.durationNote}</p>}
                <div className="tdp-phase">{(localPlan.antibiotics ?? []).map((antibiotic, index) => <MedicationRow key={index} antibiotic={antibiotic} />)}</div>
                {localPlan.deliveryInfo && (
                  <div className="tdp-note"><strong>Gợi ý cung cấp thuốc tại chỗ</strong><div className="tdp-delivery">
                    {localPlan.deliveryInfo.deliveryMethod && <span><b>Phương thức:</b> {localPlan.deliveryInfo.deliveryMethod}</span>}
                    {localPlan.deliveryInfo.spacerType && <span><b>Spacer:</b> {localPlan.deliveryInfo.spacerType}</span>}
                    {localPlan.deliveryInfo.cementBrandSuggestion && <span><b>Xi măng:</b> {localPlan.deliveryInfo.cementBrandSuggestion}</span>}
                    {localPlan.deliveryInfo.mixingRatio && <span><b>Tỉ lệ trộn:</b> {localPlan.deliveryInfo.mixingRatio}</span>}
                  </div></div>
                )}
                <SafetyDisclosure monitoring={localPlan.monitoring} contraindications={localPlan.contraindications} notes={localPlan.notes} />
              </TreatmentModule>
            )}
          </>
        ) : (
          <div className="tdp-empty"><ExperimentOutlined /><h3>Chưa có dữ liệu phác đồ</h3><p>Không tìm thấy gợi ý điều trị cho ca bệnh này trong hệ thống RAG.</p></div>
        )}
      </div>
    </div>
  );
};

export default TreatmentDraftPanel;
