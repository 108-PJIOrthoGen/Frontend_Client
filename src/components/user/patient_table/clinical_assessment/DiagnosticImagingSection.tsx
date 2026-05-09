import React from 'react';
import { Input, message } from 'antd';
import { useClinicForm } from '@/redux/hook';

interface Props {
  uploading: boolean;
  onPickFile: (file: File) => void;
}

const DiagnosticImagingSection: React.FC<Props> = ({ uploading, onPickFile }) => {
  const { form: clinicForm, setForm } = useClinicForm();

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
        <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
            4
          </span>
          Chuẩn đoán hình ảnh
        </h3>
      </div>
      <div className="p-6 flex flex-col gap-6">
        {/* Description */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">Mô tả hình ảnh</label>
          <Input.TextArea
            rows={4}
            placeholder="Nhập mô tả chi tiết về kết quả chẩn đoán hình ảnh..."
            value={clinicForm.imagingDescription}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                imagingDescription: e.target.value,
              }))
            }
            className="rounded-lg"
          />
        </div>

        {/* Image Upload */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">Ảnh đính kèm</label>
          <div className="grid grid-cols-4 gap-4">
            {clinicForm.formImages?.map((image, index) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.previewUrl || image.url}
                  alt={image.name}
                  className="w-full h-32 object-cover rounded-lg border border-slate-200"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                  <span className="text-white text-xs px-2 py-1 bg-black/60 rounded">{image.type}</span>
                </div>
                <button
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      formImages: prev.formImages.filter((_, i) => i !== index),
                    }));
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            ))}

            <label
              className={`flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors aspect-square ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <span className="material-symbols-outlined text-slate-400 text-3xl mb-1">
                {uploading ? 'hourglass_top' : 'add_photo_alternate'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {uploading ? 'Đang tải...' : 'Thêm ảnh'}
              </span>
              <input
                type="file"
                accept="image/*,.dcm"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];

                    if (file.size > 3 * 1024 * 1024) {
                      message.error('Ảnh không vượt quá 3MB');
                      e.target.value = '';
                      return;
                    }

                    const validImageTypes = [
                      'image/jpeg',
                      'image/png',
                      'image/webp',
                      'image/jpg',
                      'application/dicom',
                    ];
                    if (!validImageTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.dcm')) {
                      message.error('Chưa đúng định dạng hỗ trợ (JPG, PNG, WEBP, DICOM)');
                      e.target.value = '';
                      return;
                    }

                    onPickFile(file);
                    e.target.value = '';
                  }
                }}
              />
            </label>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DiagnosticImagingSection;
