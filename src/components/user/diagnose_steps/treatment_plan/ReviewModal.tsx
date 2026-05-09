import React from 'react';
import { Input, Modal } from 'antd';

interface Props {
  open: boolean;
  isSaving: boolean;
  reviewNote: string;
  rejectionReason: string;
  onChangeReviewNote: (val: string) => void;
  onChangeRejectionReason: (val: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const ReviewModal: React.FC<Props> = ({
  open,
  isSaving,
  reviewNote,
  rejectionReason,
  onChangeReviewNote,
  onChangeRejectionReason,
  onCancel,
  onConfirm,
}) => {
  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-500">verified_user</span>
          Phê duyệt Phác đồ & Lưu
        </div>
      }
      open={open}
      onCancel={onCancel}
      onOk={onConfirm}
      okText="Xác Nhận & Lưu"
      cancelText="Hủy bỏ"
      confirmLoading={isSaving}
      okButtonProps={{ className: 'bg-emerald-600 hover:bg-emerald-700 border-none px-6' }}
      destroyOnClose
    >
      <div className="space-y-5 py-4">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 items-start">
          <span className="material-symbols-outlined text-blue-500 mt-0.5">info</span>
          <p className="text-sm text-blue-800 leading-relaxed">
            Bằng việc nhấn "Lưu", phác đồ điều trị này (bao gồm cả các điểm bạn vừa chỉnh sửa so với bản nháp của AI) sẽ
            được lưu vào bệnh án chính thức.
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Ghi chú bổ sung (Tùy chọn)
          </label>
          <Input.TextArea
            rows={3}
            placeholder="Ghi chú thêm về quyết định điều trị này..."
            value={reviewNote}
            onChange={(e) => onChangeReviewNote(e.target.value)}
            className="rounded-xl border-slate-300 text-sm p-3"
          />
        </div>
        <div className="border-t border-slate-100 pt-5">
          <label className="block text-sm font-semibold text-red-600 mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            Lý do từ chối phác đồ AI (Nếu có)
          </label>
          <Input.TextArea
            rows={2}
            placeholder="Điền vào đây nếu bạn hoàn toàn từ chối phác đồ này..."
            value={rejectionReason}
            onChange={(e) => onChangeRejectionReason(e.target.value)}
            className="rounded-xl border-red-200 bg-red-50 focus:bg-white text-sm p-3"
          />
        </div>
      </div>
    </Modal>
  );
};

export default ReviewModal;
