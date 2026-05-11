import React, { useState } from 'react';
import { message } from 'antd';
import { ILabResult, IClinicalRecord, ICultureResult, IImageResult, IPatient } from '@/types/backend';
import { callUploadImage } from '@/apis/api';
import { useClinicForm } from '@/redux/hook';
import QuickImportImagesModal from './extract/QuickImportImagesModal';
import QuickImportReviewModal from './extract/QuickImportReviewModal';
import { useQuickImportFlow } from './clinical_assessment/hooks/useQuickImportFlow';
import { useClinicFormSync } from './clinical_assessment/hooks/useClinicFormSync';
import SymptomsChecklist from './clinical_assessment/SymptomsChecklist';
import ClinicalExamForm from './clinical_assessment/ClinicalExamForm';
import HematologyTestsTable from './clinical_assessment/HematologyTestsTable';
import BiochemistryTestsTable from './clinical_assessment/BiochemistryTestsTable';
import MicrobiologyTestsTable from './clinical_assessment/MicrobiologyTestsTable';
import DiagnosticImagingSection from './clinical_assessment/DiagnosticImagingSection';
import ImageTypeModal from './clinical_assessment/ImageTypeModal';

interface ClinicalAssessmentProps {
  mode?: 'wizard' | 'standalone';
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
    extractCandidates,
    openQuickImport,
    handleQuickImportClose,
    handleQuickImportSubmit,
    handleApplyCandidates,
    handleReviewCancel,
  } = useQuickImportFlow(episodeId);

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
      <button
        type="button"
        onClick={openQuickImport}
        className="text-slate-900 bg-green-400 mt-1 flex items-center gap-2 rounded font-mono px-2 py-1 font-bold hover:bg-cyan-400"
      >
        <span className="material-symbols-outlined text-md">accessibility_new</span>
        Import nhanh
      </button>

      <QuickImportImagesModal
        open={quickImportOpen}
        onClose={handleQuickImportClose}
        onSubmit={handleQuickImportSubmit}
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
        <div className="max-w-7xl mx-auto h-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6 pb-20">
              <SymptomsChecklist />
              <ClinicalExamForm />

              <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                  <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2">
                    Xét nghiệm chẩn đoán PJI
                  </h3>
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
