import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Alert } from 'antd';
import SurgerySection from '../../rag_diagnose/rag_surgery/SurgerySection';
import type { SurgerySectionHandle } from '../../rag_diagnose/rag_surgery/SurgerySection';
import LocalAntibioticTreatment from '../../rag_diagnose/rag_antibiolocal/LocalAntibioticTreatment';
import { SystemicAntibioticTreatment } from '../../rag_diagnose/rag_antibiolocal/SystemicAntibioticTreatment';
import type { SystemicAntibioticTreatmentHandle } from '../../rag_diagnose/rag_antibiolocal/SystemicAntibioticTreatment';
import type { LocalAntibioticTreatmentHandle } from '../../rag_diagnose/rag_antibiolocal/LocalAntibioticTreatment';
import type { LocalPlanData, SurgeryPlanData, SystemicPlanData } from '@/types/treatmentType';

interface Props {
  surgeryPlan: SurgeryPlanData | null;
  systemicPlan: SystemicPlanData | null;
  localPlan: LocalPlanData | null;
  canReviewTreatmentPlan: boolean;
}

export interface TreatmentDraftPanelHandle {
  getSurgery: () => any;
  getSystemic: () => any;
  getLocal: () => any;
}

const TreatmentDraftPanel = forwardRef<TreatmentDraftPanelHandle, Props>(
  ({ surgeryPlan, systemicPlan, localPlan, canReviewTreatmentPlan }, ref) => {
    const surgeryRef = useRef<SurgerySectionHandle>(null);
    const systemicRef = useRef<SystemicAntibioticTreatmentHandle>(null);
    const localRef = useRef<LocalAntibioticTreatmentHandle>(null);

    useImperativeHandle(ref, () => ({
      getSurgery: () => surgeryRef.current?.getData() ?? null,
      getSystemic: () => systemicRef.current?.getData() ?? null,
      getLocal: () => localRef.current?.getData() ?? null,
    }));

    return (
      <div className="flex-[3] bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-xl shadow-slate-200/50">
        <div className="bg-slate-50/80 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-500">receipt_long</span>
            Chi tiết phác đồ
          </h2>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest bg-white px-2 py-1 border border-slate-200 rounded">
            {canReviewTreatmentPlan ? 'DRAFT MODE' : 'READ ONLY'}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-slate-50/30">
          {!canReviewTreatmentPlan && (
            <Alert
              type="info"
              showIcon
              message="Chế độ chỉ xem"
              description="Bạn không phải người tạo hồ sơ này nên không thể chỉnh sửa hoặc khóa phác đồ."
            />
          )}
          {surgeryPlan && (
            <SurgerySection ref={surgeryRef} surgeryPlan={surgeryPlan} readOnly={!canReviewTreatmentPlan} />
          )}
          {systemicPlan && (
            <SystemicAntibioticTreatment
              ref={systemicRef}
              guidelinePlan={systemicPlan}
              readOnly={!canReviewTreatmentPlan}
            />
          )}
          {localPlan && (
            <LocalAntibioticTreatment ref={localRef} localPlan={localPlan} readOnly={!canReviewTreatmentPlan} />
          )}
          {!surgeryPlan && !systemicPlan && !localPlan && (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl text-slate-300">hourglass_empty</span>
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">Chưa có dữ liệu phác đồ</h3>
              <p className="text-slate-500 text-sm">
                Không tìm thấy gợi ý điều trị cho ca bệnh này trong hệ thống RAG.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  },
);

TreatmentDraftPanel.displayName = 'TreatmentDraftPanel';

export default TreatmentDraftPanel;
