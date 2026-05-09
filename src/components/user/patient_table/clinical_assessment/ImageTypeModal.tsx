import React from 'react';
import { Modal, Select } from 'antd';

interface Props {
  open: boolean;
  selectedType: string;
  onSelectType: (type: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const IMAGE_TYPE_OPTIONS = [
  { value: 'X-ray', label: 'X-Quang' },
  { value: 'CT', label: 'Chụp cắt lớp vi tính (CT-scan)' },
  { value: 'Ultrasound', label: 'Siêu âm' },
  { value: 'MRI', label: 'Chụp cộng hưởng từ (MRI)' },
];

const ImageTypeModal: React.FC<Props> = ({ open, selectedType, onSelectType, onConfirm, onCancel }) => {
  return (
    <Modal
      title="Chọn loại ảnh"
      open={open}
      onOk={onConfirm}
      onCancel={onCancel}
      okText="Xác nhận"
      cancelText="Hủy"
      destroyOnHidden
    >
      <Select
        value={selectedType}
        onChange={onSelectType}
        style={{ width: '100%' }}
        options={IMAGE_TYPE_OPTIONS}
      />
    </Modal>
  );
};

export default ImageTypeModal;
