import React from 'react';
import { Card, Result, Tag, Typography } from 'antd';
import { SafetyCertificateOutlined } from '@ant-design/icons';

const { Paragraph } = Typography;

/**
 * Placeholder — "Tiên lượng rủi ro & Tối ưu hóa trước mổ".
 * Sẽ đánh giá nguy cơ biến chứng/tái nhiễm của bệnh nhân và đề xuất các bước
 * tối ưu hóa trước phẫu thuật (dinh dưỡng, đường huyết, ngưng thuốc, ...).
 */
const AntibioticCarePlanner: React.FC = () => (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f8fb' }}>
        <Card style={{ maxWidth: 560, width: '100%' }}>
            <Result
                icon={<SafetyCertificateOutlined style={{ color: '#0ea5e9' }} />}
                title="Trợ lý Hoạch định Kháng sinh Toàn diện"
                subTitle={
                    <>
                        <Tag color="cyan">Đang phát triển</Tag>
                        <Paragraph type="secondary" style={{ marginTop: 12 }}>
                            <p>
                                Giải quyết toàn bộ lộ trình: Bác sĩ không chỉ biết hôm nay cho bệnh nhân dùng thuốc gì, mà họ nhìn thấy trước được tương lai điều trị của ca bệnh này trong vòng 6 tuần tới sẽ diễn ra như thế nào.
                            </p>
                            <p>
                                Cá nhân hóa tối đa: Nếu ca khác có vi khuẩn khác (ví dụ: vi khuẩn Gram âm kháng thuốc Pseudomonas), hệ thống sẽ tự động đổi sang một lịch trình giám sát độc tính hoàn toàn khác (ví dụ: giám sát tiền đình/thính giác do thuốc Amikacin).
                            </p>



                            An toàn pháp lý cho bác sĩ: Bác sĩ ở các viện lớn như 108 rất sợ việc bệnh nhân về nhà dùng thuốc nặng rồi bị biến chứng (suy thận, suy tủy) mà bác sĩ quên không dặn tái khám. Tính năng này đóng vai trò như một "màng lọc bảo hiểm" cho cả bác sĩ lẫn bệnh nhân.
                        </Paragraph>
                    </>
                }
            />
        </Card>
    </div>
);

export default AntibioticCarePlanner;
