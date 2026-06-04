import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

/** 403 fullpage — chiếm toàn viewport, dùng thay cho cả layout khi thiếu quyền. */
const Error403 = () => {
    const navigate = useNavigate();
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
        }}>
            <Result
                status="403"
                title="403 Error"
                subTitle="Xin lỗi, Bạn không có quyền truy cập vào địa chỉ này!"
                extra={<Button type="primary" onClick={() => navigate("/")}>Quay Lại</Button>}
            />
        </div>
    )
}
export default Error403;
