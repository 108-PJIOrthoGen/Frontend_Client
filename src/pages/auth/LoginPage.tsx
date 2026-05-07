import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Button, Form, Input, Switch, message, Modal, notification,
  Typography, Card, Space, Flex,
  Image,
} from 'antd';
import {
  UserOutlined, LockOutlined, MedicineBoxOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { fetchAccount, runLoginAction, runLogoutAction } from '../../redux/slice/accountSlice';
import { loginAPI, LogoutAPI } from '@/apis/api';
import { useAppDispatch, useAppSelector } from '@/redux/hook';

const { Title, Text, Paragraph } = Typography;

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (!isAuthenticated && localStorage.getItem('access_token')) {
      dispatch(fetchAccount());
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated]);

  const onFinish = async (values: { username: string; password: string }) => {
    const { username, password } = values;
    setIsLoading(true);
    const res = await loginAPI(username, password);
    setIsLoading(false);
    if (res?.data) {
      localStorage.setItem('access_token', res.data.access_token);
      dispatch(runLoginAction(res.data.user));
      message.success('Dang nhap thanh cong');
      navigate(from, { replace: true });
    } else {
      notification.error({
        message: 'Co loi xay ra',
        description: 'Thong tin dang nhap chua chinh xac!',
      });
    }
  };

  return (
    <Flex
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #5fd4d4 0%, #61c55d 100%)',
      }}
      align="center"
      justify="center"
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          margin: 16,
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
        }}
        styles={{ body: { padding: '40px 32px' } }}
      >
        <Flex vertical align="center" gap={4} style={{ marginBottom: 32 }}>
          <Image src={"/108POG-logo.png"} alt="Logo" preview={false} />
          <Title level={3} style={{ margin: '12px 0 0', textAlign: 'center' }}>
            Hệ thống quản lý bệnh án & hỗ trợ chẩn đoán PJI 108
          </Title>

        </Flex>

        <Form
          onFinish={onFinish}
          layout="vertical"
          initialValues={{ remember: true }}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Không để trống!' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Email "
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Không để trống!' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Mật khẩu"
            />
          </Form.Item>

          <Form.Item
            name="remember"
            valuePropName="checked"
            style={{ marginBottom: 16 }}
          >
            <Flex justify="space-between" align="center">
              <Space>
                <Switch defaultChecked size="small" />
                <Text type="secondary">Ghi nhớ đăng nhập</Text>
              </Space>
              <Link to="/forgot-password">Quên mật khẩu?</Link>
            </Flex>
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              block
              style={{
                height: 44,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #66ea92 0%, #233c81 100%)',
                border: 'none',
                fontWeight: 600,
              }}
            >
              Đăng nhập
            </Button>
          </Form.Item>

          <Paragraph
            type="secondary"
            style={{ textAlign: 'center', fontSize: 13, marginBottom: 0 }}
          >
            Tài khoản chỉ được cấp cho các Bác Sĩ. Nếu có vấn đề liên quan tài khoản liên hệ với QTV hệ thống!
          </Paragraph>
        </Form>
      </Card>

      <Modal
        title="Ban da dang nhap"
        open={isModalOpen}
        okText="Dang xuat"
        cancelText="Quay lai"
        onOk={async () => {
          const res = await LogoutAPI();
          if (res) {
            dispatch(runLogoutAction({}));
            message.success('Dang xuat thanh cong');
            setIsModalOpen(false);
          }
        }}
        onCancel={() => {
          setIsModalOpen(false);
          navigate(-1);
        }}
      >
        <p>Ban se dang xuat khoi tai khoan hien tai, neu tiep tuc truy cap duong dan nay!</p>
      </Modal>
    </Flex>
  );
};

export default LoginPage;
