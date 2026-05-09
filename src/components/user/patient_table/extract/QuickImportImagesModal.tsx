import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Upload, Button, message } from 'antd';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';
import { ExtractImageJobStatus } from '@/types/extractImages';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILES = 10;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

interface QuickImportImagesModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (files: File[]) => void;
  status: ExtractImageJobStatus | 'idle' | 'uploading';
  errorMessage?: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  uploading: 'Đang tải ảnh...',
  queued: 'Đã xếp hàng, đang chờ xử lý...',
  processing: 'Đang trích xuất dữ liệu...',
  failed: 'Trích xuất thất bại',
};

export const QuickImportImagesModal: React.FC<QuickImportImagesModalProps> = ({
  open,
  onClose,
  onSubmit,
  status,
  errorMessage,
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  useEffect(() => {
    if (!open) {
      setFileList([]);
    }
  }, [open]);

  const isBusy = status === 'uploading' || status === 'queued' || status === 'processing';

  const beforeUpload = (file: RcFile, list: RcFile[]) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      message.error(`${file.name}: định dạng không được hỗ trợ`);
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      message.error(`${file.name}: vượt quá 5MB`);
      return Upload.LIST_IGNORE;
    }
    if (fileList.length + list.length > MAX_FILES) {
      message.error(`Tối đa ${MAX_FILES} ảnh mỗi lần`);
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const onChange = ({ fileList: next }: { fileList: UploadFile[] }) => {
    setFileList(next.slice(0, MAX_FILES));
  };

  const onRemove = (file: UploadFile) => {
    setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
  };

  const realFiles = useMemo(
    () => fileList.map((f) => f.originFileObj as File).filter(Boolean) as File[],
    [fileList],
  );

  const handleSubmit = () => {
    if (realFiles.length === 0) {
      message.warning('Vui lòng chọn ít nhất 1 ảnh');
      return;
    }
    onSubmit(realFiles);
  };

  const statusText = STATUS_LABEL[status] || '';

  return (
    <Modal
      title="Import nhanh từ ảnh"
      open={open}
      onCancel={isBusy ? undefined : onClose}
      maskClosable={!isBusy}
      closable={!isBusy}
      destroyOnClose
      width={640}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={isBusy}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={isBusy}
          onClick={handleSubmit}
          disabled={isBusy || realFiles.length === 0}
        >
          Trích xuất dữ liệu
        </Button>,
      ]}
    >
      <div className="flex flex-col gap-3">
        <div className="text-sm text-slate-600">
          Tải lên phiếu xét nghiệm hoặc hồ sơ y tế (JPG/PNG/WEBP, tối đa 5MB mỗi ảnh, {MAX_FILES} ảnh).
        </div>
        <Upload.Dragger
          multiple
          accept="image/jpeg,image/png,image/webp"
          beforeUpload={beforeUpload}
          fileList={fileList}
          onChange={onChange}
          onRemove={onRemove}
          listType="picture"
          disabled={isBusy}
        >
          <p className="ant-upload-text">Kéo thả ảnh hoặc click để chọn</p>
          <p className="ant-upload-hint">Hỗ trợ nhiều file cùng lúc</p>
        </Upload.Dragger>
        {statusText && (
          <div className={`text-sm ${status === 'failed' ? 'text-red-600' : 'text-slate-700'}`}>
            {statusText}
            {errorMessage ? <div className="text-red-600 mt-1">{errorMessage}</div> : null}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default QuickImportImagesModal;
