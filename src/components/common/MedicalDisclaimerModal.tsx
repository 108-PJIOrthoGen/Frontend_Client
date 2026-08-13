import { Alert, Modal } from 'antd';
import { SafetyCertificateOutlined } from '@ant-design/icons';

interface MedicalDisclaimerModalProps {
  open: boolean;
  onClose: () => void;
}

const MedicalDisclaimerModal = ({ open, onClose }: MedicalDisclaimerModalProps) => (
  <Modal
    open={open}
    onCancel={onClose}
    footer={null}
    centered
    width={720}
    title={(
      <div className="flex items-center gap-2.5 pr-8 text-slate-900">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <SafetyCertificateOutlined />
        </span>
        <span>Tuyên bố miễn trừ trách nhiệm y khoa</span>
      </div>
    )}
    styles={{ body: { maxHeight: 'min(70vh, 680px)', overflowY: 'auto' } }}
  >
    <div className="space-y-5 pt-2 text-[14px] leading-6 text-slate-600">
      <Alert
        type="warning"
        showIcon
        message="PJI OrthGen là công cụ hỗ trợ quyết định lâm sàng, không thay thế đánh giá và chỉ định của bác sĩ."
        className="border-amber-200 bg-amber-50/70"
      />

      <section>
        <h3 className="mb-1.5 text-[15px] font-bold text-slate-800">Cơ sở và mục đích sử dụng</h3>
        <p>
          Hệ thống tham khảo tiêu chuẩn và thuật toán chẩn đoán nhiễm trùng quanh khớp nhân tạo
          (PJI) từ Hội nghị Đồng thuận Quốc tế năm 2018, cùng tri thức chuyên môn liên quan. Mục
          đích của hệ thống là giúp nhân viên y tế tiếp cận thông tin và tổng hợp dữ liệu thuận tiện
          hơn trong quá trình chăm sóc người bệnh.
        </p>
      </section>

      <section>
        <h3 className="mb-1.5 text-[15px] font-bold text-slate-800">Giới hạn của khuyến nghị</h3>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Kết quả do hệ thống cung cấp không phải là chẩn đoán cuối cùng hoặc tiêu chuẩn chăm sóc bắt buộc.</li>
          <li>Khuyến nghị phụ thuộc vào độ chính xác, đầy đủ và tính cập nhật của dữ liệu được nhập vào.</li>
          <li>Khuyến nghị trong ứng dụng không áp dụng cho các trường hợp tái cấy ghép khớp nhân tạo (reimplantation).</li>
          <li>Các tính năng AI có thể tạo ra nội dung chưa đầy đủ, chưa phù hợp hoặc cần được kiểm chứng thêm.</li>
        </ul>
      </section>

      <section>
        <h3 className="mb-1.5 text-[15px] font-bold text-slate-800">Trách nhiệm chuyên môn</h3>
        <p>
          Bác sĩ phải sử dụng kiến thức chuyên môn, kinh nghiệm lâm sàng và các nguồn thông tin độc
          lập để đánh giá từng trường hợp. Quyết định chẩn đoán và điều trị cuối cùng cần xem xét toàn
          bộ tình trạng người bệnh, chống chỉ định, nguồn lực sẵn có, cũng như quy định của cơ sở và
          địa phương. Trong một số tình huống, phương án phù hợp có thể khác với gợi ý của hệ thống.
        </p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-1.5 text-[15px] font-bold text-slate-800">Xác nhận khi tiếp tục sử dụng</h3>
        <p>
          Khi sử dụng PJI OrthGen, bạn hiểu rằng hệ thống chỉ đóng vai trò hỗ trợ. Đơn vị phát triển
          không chịu trách nhiệm thay cho người hành nghề đối với quyết định chuyên môn hoặc những
          tình huống phát sinh từ việc áp dụng máy móc các gợi ý của ứng dụng.
        </p>
      </section>
    </div>
  </Modal>
);

export default MedicalDisclaimerModal;
