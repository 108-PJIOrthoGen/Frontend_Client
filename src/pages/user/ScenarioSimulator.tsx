import React from 'react';
import { Card, Result, Tag, Typography } from 'antd';
import { ExperimentOutlined } from '@ant-design/icons';

const { Paragraph } = Typography;

/**
 * Placeholder — "Bộ mô phỏng kịch bản kết quả điều trị".
 * Sẽ cho phép bác sĩ thử các kịch bản điều trị (DAIR / 1 thì / 2 thì, phác đồ
 * kháng sinh khác nhau) và xem dự đoán kết quả cho từng kịch bản.
 */
const ScenarioSimulator: React.FC = () => (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f8fb' }}>
        <Card style={{ maxWidth: 560, width: '100%' }}>
            <Result
                icon={<ExperimentOutlined style={{ color: '#7c3aed' }} />}
                title="Bộ mô phỏng kịch bản kết quả điều trị"
                subTitle={
                    <>
                        <Tag color="purple">Đang phát triển</Tag>
                        <Paragraph type="secondary" style={{ marginTop: 12 }}>
                            Trong y học, mỗi quyết định của bác sĩ đều là một sự đánh đổi.
                            Nếu mổ ngay thì giải quyết được nhiễm trùng sớm nhưng bệnh nền chưa tối ưu thì dễ thất bại.
                            Nếu chờ tối ưu bệnh nền thì vi khuẩn lại có thời gian tạo màng sinh học (Biofilm) phá hủy thêm xương.
                            Tính năng này cho phép bác sĩ thử các kịch bản điều trị để xem tỷ lệ thành công của cuộc mổ thay đổi như thế nào trước khi thực sự bước vào phòng mổ.
                        </Paragraph>
                    </>
                }
            />
        </Card>
    </div>
);

export default ScenarioSimulator;
