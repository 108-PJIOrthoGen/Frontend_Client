import { LockOutlined, MailOutlined, NumberOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Form, Input, Result, Space, Typography, message, notification } from 'antd';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPasswordAPI, resetPasswordAPI } from '@/apis/api';

const { Title, Text, Paragraph } = Typography;

type RequestOtpValues = {
  email: string;
};

type ResetPasswordValues = {
  otp: string;
  newPassword: string;
  confirmPassword: string;
};

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'request' | 'reset' | 'done'>('request');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const navigate = useNavigate();

  const handleRequestOtp = async (values: RequestOtpValues) => {
    setIsRequesting(true);
    const normalizedEmail = values.email.trim();
    const res = await forgotPasswordAPI(normalizedEmail);
    setIsRequesting(false);

    if (+res?.status === 200) {
      setEmail(normalizedEmail);
      setStep('reset');
      message.success('Nếu email tồn tại, mã OTP đã được gửi.');
      return;
    }

    notification.error({
      message: 'Không thể gửi OTP',
      description: res?.message ?? 'Vui lòng thử lại sau.',
    });
  };

  const handleResetPassword = async (values: ResetPasswordValues) => {
    setIsResetting(true);
    const res = await resetPasswordAPI(email, values.otp, values.newPassword);
    setIsResetting(false);

    if (+res?.status === 200) {
      localStorage.removeItem('access_token');
      setStep('done');
      return;
    }

    notification.error({
      message: 'Không thể đặt lại mật khẩu',
      description: res?.message ?? 'OTP không hợp lệ hoặc đã hết hạn.',
    });
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
          maxWidth: 440,
          margin: 16,
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
        }}
        styles={{ body: { padding: '40px 32px' } }}
      >
        {step === 'request' && (
          <>
            <Flex vertical align="center" gap={4} style={{ marginBottom: 28 }}>
              <Title level={3} style={{ margin: 0, textAlign: 'center' }}>
                Quên mật khẩu
              </Title>
              <Text type="secondary" style={{ textAlign: 'center' }}>
                Nhập email tài khoản để nhận mã OTP xác thực.
              </Text>
            </Flex>

            <Form layout="vertical" size="large" onFinish={handleRequestOtp}>
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Không để trống email!' },
                  { type: 'email', message: 'Email không hợp lệ!' },
                ]}
              >
                <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="Email" />
              </Form.Item>

              <Form.Item style={{ marginBottom: 16 }}>
                <Button type="primary" htmlType="submit" loading={isRequesting} block style={{ height: 44 }}>
                  Gửi mã OTP
                </Button>
              </Form.Item>
            </Form>

            <Paragraph style={{ textAlign: 'center', marginBottom: 0 }}>
              <Link to="/login">Quay lại đăng nhập</Link>
            </Paragraph>
          </>
        )}

        {step === 'reset' && (
          <>
            <Flex vertical align="center" gap={4} style={{ marginBottom: 28 }}>
              <Title level={3} style={{ margin: 0, textAlign: 'center' }}>
                Xác thực OTP
              </Title>
              <Text type="secondary" style={{ textAlign: 'center' }}>
                Mã OTP đã được gửi tới {email}.
              </Text>
            </Flex>

            <Form layout="vertical" size="large" onFinish={handleResetPassword}>
              <Form.Item
                name="otp"
                rules={[
                  { required: true, message: 'Không để trống OTP!' },
                  { pattern: /^\d{6}$/, message: 'OTP gồm 6 chữ số!' },
                ]}
              >
                <Input prefix={<NumberOutlined style={{ color: '#bfbfbf' }} />} placeholder="Mã OTP" maxLength={6} />
              </Form.Item>

              <Form.Item
                name="newPassword"
                rules={[
                  { required: true, message: 'Không để trống mật khẩu mới!' },
                  { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' },
                ]}
              >
                <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Mật khẩu mới" />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Vui lòng nhập lại mật khẩu!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu nhập lại không khớp!'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Nhập lại mật khẩu" />
              </Form.Item>

              <Form.Item style={{ marginBottom: 12 }}>
                <Button type="primary" htmlType="submit" loading={isResetting} block style={{ height: 44 }}>
                  Đặt lại mật khẩu
                </Button>
              </Form.Item>
            </Form>

            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button type="link" onClick={() => setStep('request')} style={{ padding: 0 }}>
                Đổi email
              </Button>
              <Button type="link" onClick={() => handleRequestOtp({ email })} loading={isRequesting} style={{ padding: 0 }}>
                Gửi lại OTP
              </Button>
            </Space>
          </>
        )}

        {step === 'done' && (
          <Result
            status="success"
            title="Đặt lại mật khẩu thành công"
            subTitle="Bạn có thể đăng nhập bằng mật khẩu mới."
            extra={(
              <Button type="primary" onClick={() => navigate('/login')} block>
                Đăng nhập
              </Button>
            )}
          />
        )}
      </Card>
    </Flex>
  );
};

export default ForgotPasswordPage;
