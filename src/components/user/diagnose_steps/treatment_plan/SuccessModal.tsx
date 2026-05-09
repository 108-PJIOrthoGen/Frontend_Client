import React from 'react';
import { Button, Modal } from 'antd';

interface Props {
  open: boolean;
  onClose: () => void;
}

const SuccessModal: React.FC<Props> = ({ open, onClose }) => {
  return (
    <Modal
      title={null}
      footer={null}
      closable
      open={open}
      onCancel={onClose}
      width={450}
      centered
      bodyStyle={{ padding: '40px 24px' }}
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-[40px] text-emerald-500">check_circle</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Xác nhận thành công!</h2>
        <p className="text-slate-500 text-sm mb-8">
          Phác đồ điều trị đã được phê duyệt và lưu vào hồ sơ bệnh nhân.
        </p>
        <Button
          type="primary"
          size="large"
          onClick={onClose}
          className="w-full bg-emerald-600 hover:bg-emerald-700 border-none rounded-xl font-bold"
        >
          Trở về Trang chủ Bệnh nhân
        </Button>
      </div>
    </Modal>
  );
};

export default SuccessModal;
