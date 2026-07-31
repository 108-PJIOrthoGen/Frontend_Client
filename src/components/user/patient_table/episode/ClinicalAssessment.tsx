import React, { useState } from 'react';
import { message } from 'antd';
import { ILabResult, IClinicalRecord, ICultureResult, IImageResult, IPatient } from '@/types/backend';
import { callUploadImage } from '@/apis/api';
import { useClinicForm } from '@/redux/hook';
import QuickImportImagesModal from '../extract/QuickImportImagesModal';
import QuickImportReviewModal from '../extract/QuickImportReviewModal';
import { useClinicFormSync } from '../clinical_assessment/hooks/useClinicFormSync';
import { useQuickImportFlow } from '../clinical_assessment/hooks/useQuickImportFlow';
import SymptomsChecklist from '../clinical_assessment/SymptomsChecklist';
import ClinicalExamForm from '../clinical_assessment/ClinicalExamForm';
import HematologyTestsTable from '../clinical_assessment/HematologyTestsTable';
import BiochemistryTestsTable from '../clinical_assessment/BiochemistryTestsTable';
import MicrobiologyTestsTable from '../clinical_assessment/MicrobiologyTestsTable';
import DiagnosticImagingSection from '../clinical_assessment/DiagnosticImagingSection';
import ImageTypeModal from '../clinical_assessment/ImageTypeModal';


interface ClinicalAssessmentProps {
  labResults?: ILabResult[];
  clinicalRecord?: IClinicalRecord | null;
  cultureResults?: ICultureResult[];
  imageResults?: IImageResult[];
  patient?: IPatient | null;
  episodeId?: string | number;
}

export const ClinicalAssessmentPage: React.FC<ClinicalAssessmentProps> = ({
  labResults,
  clinicalRecord,
  cultureResults,
  imageResults,
  patient,
  episodeId,
}) => {
  const { setForm } = useClinicForm();

  useClinicFormSync({ clinicalRecord, labResults, cultureResults, imageResults });

  const {
    quickImportOpen,
    reviewOpen,
    quickImportStatus,
    quickImportError,
    isCancelling,
    extractCandidates,
    qrSession,
    qrEvent,
    qrError,
    openQuickImport,
    handleQuickImportClose,
    handleQuickImportSubmit,
    handleCancelExtract,
    handleApplyCandidates,
    handleReviewCancel,
    createQrSession,
  } = useQuickImportFlow(episodeId, patient?.id);

  // Image upload modal state (selecting image type after picking a file)
  const [uploading, setUploading] = useState(false);
  const [imageTypeModalOpen, setImageTypeModalOpen] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [selectedImageType, setSelectedImageType] = useState('X-ray');

  const handlePickImageFile = (file: File) => {
    setPendingImageFile(file);
    setSelectedImageType('X-ray');
    setImageTypeModalOpen(true);
  };

  const handleConfirmImageUpload = async () => {
    if (!pendingImageFile) return;
    const previewUrl = URL.createObjectURL(pendingImageFile);
    setUploading(true);
    setImageTypeModalOpen(false);
    try {
      const res = await callUploadImage(pendingImageFile, 'clinical-images');
      const uploadedFileName = (res as any)?.fileName ?? (res as any)?.data?.fileName;
      const bucket = (res as any)?.bucket ?? (res as any)?.data?.bucket;
      const objectKey = (res as any)?.objectKey ?? (res as any)?.data?.objectKey;
      if (uploadedFileName) {
        const newImage = {
          id: Math.random().toString(36).substring(2, 11),
          url: uploadedFileName,
          previewUrl,
          type: selectedImageType,
          name: pendingImageFile.name,
          bucket,
          objectKey,
        };
        setForm((prev) => ({
          ...prev,
          formImages: [...prev.formImages, newImage],
        }));
      }
    } catch {
      message.error('Xảy ra lỗi! Hãy thử lại');
    } finally {
      setUploading(false);
      setPendingImageFile(null);
    }
  };

  const handleCancelImageUpload = () => {
    setImageTypeModalOpen(false);
    setPendingImageFile(null);
  };

  return (
    <>
      <QuickImportImagesModal
        open={quickImportOpen}
        onClose={handleQuickImportClose}
        onSubmit={handleQuickImportSubmit}
        onCreateQr={createQrSession}
        qrSession={qrSession}
        qrEvent={qrEvent}
        qrError={qrError}
        onCancelJob={handleCancelExtract}
        isCancelling={isCancelling}
        status={quickImportStatus}
        errorMessage={quickImportError}
      />
      <QuickImportReviewModal
        open={reviewOpen}
        candidates={extractCandidates}
        onCancel={handleReviewCancel}
        onApply={handleApplyCandidates}
      />

      <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
        <div className="mx-auto h-full max-w-[1600px]">
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-6">
              <SymptomsChecklist />
              <ClinicalExamForm />
            </div>

            <div className="flex min-w-0 flex-col gap-6 pb-20">
              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                      Xét nghiệm chẩn đoán PJI
                    </h3>
                    <p id="quick-import-description" className="mt-1 text-sm text-slate-500">
                      Nhập kết quả thủ công hoặc tải phiếu xét nghiệm để tự động điền.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openQuickImport}
                    aria-describedby="quick-import-description"
                    className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 sm:self-auto"
                  >
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                      upload_file
                    </span>
                    Import nhanh
                  </button>
                </div>
                <HematologyTestsTable />
                <BiochemistryTestsTable patient={patient} />
                <MicrobiologyTestsTable />
              </section>

              <DiagnosticImagingSection uploading={uploading} onPickFile={handlePickImageFile} />
            </div>
          </div>
        </div>
      </div>

      <ImageTypeModal
        open={imageTypeModalOpen}
        selectedType={selectedImageType}
        onSelectType={setSelectedImageType}
        onConfirm={handleConfirmImageUpload}
        onCancel={handleCancelImageUpload}
      />
    </>
  );
};
