import { LockOutlined, NumberOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Form, Input, Typography, message, notification } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { callVerifyDeviceAPI, loginAPI } from '@/apis/api';
import { runLoginAction } from '@/redux/slice/accountSlice';
import { useAppDispatch } from '@/redux/hook';

const { Title, Text, Paragraph } = Typography;

type LocationState = {
    email?: string;
    challengeId?: string;
    maskedEmail?: string;
    // Password is held only to allow "resend OTP" without sending the user back
    // to the login form. It never leaves the browser tab.
    password?: string;
};

type VerifyValues = { otp: string };

const VerifyDevicePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useAppDispatch();
    const state = (location.state ?? {}) as LocationState;

    const [email] = useState(state.email ?? '');
    const [challengeId, setChallengeId] = useState(state.challengeId ?? '');
    const [maskedEmail, setMaskedEmail] = useState(state.maskedEmail ?? email);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        // If the user reloaded /verify-device directly there is no challenge in
        // hand — bounce them back to the login screen rather than show a stuck form.
        if (!email || !challengeId) {
            navigate('/login', { replace: true });
        }
    }, [email, challengeId, navigate]);

    const handleVerify = async (values: VerifyValues) => {
        setIsVerifying(true);
        const res = await callVerifyDeviceAPI(email, challengeId, values.otp);
        setIsVerifying(false);

        if (+res?.status === 200 && res.data?.access_token) {
            localStorage.setItem('access_token', res.data.access_token);
            dispatch(runLoginAction(res.data.user));
            message.success('Xác thực thiết bị thành công');
            navigate('/', { replace: true });
            return;
        }

        notification.error({
            message: 'Xác thực thiết bị thất bại',
            description: res?.message ?? 'OTP không hợp lệ hoặc đã hết hạn.',
        });
    };

    const handleResend = async () => {
        // Re-sending the OTP requires re-authenticating because /auth/login is
        // the only endpoint that issues a fresh device-verification challenge.
        if (!state.password) {
            notification.warning({
                message: 'Không thể gửi lại OTP',
                description: 'Vui lòng quay lại trang đăng nhập và thử lại.',
            });
            return;
        }
        setIsResending(true);
        const res = await loginAPI(email, state.password);
        setIsResending(false);
        if (res?.data?.requiresDeviceVerification && res.data.challengeId) {
            setChallengeId(res.data.challengeId);
            if (res.data.maskedEmail) setMaskedEmail(res.data.maskedEmail);
            message.success('Đã gửi lại mã OTP.');
        } else {
            notification.error({
                message: 'Không thể gửi lại OTP',
                description: res?.message ?? 'Vui lòng thử lại sau.',
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
                    maxWidth: 440,
                    margin: 16,
                    borderRadius: 12,
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                }}
                styles={{ body: { padding: '40px 32px' } }}
            >
                <Flex vertical align="center" gap={4} style={{ marginBottom: 28 }}>
                    <LockOutlined style={{ fontSize: 36, color: '#1677ff' }} />
                    <Title level={3} style={{ margin: '12px 0 0', textAlign: 'center' }}>
                        Xác thực thiết bị mới
                    </Title>
                    <Text type="secondary" style={{ textAlign: 'center' }}>
                        Một mã OTP đã được gửi tới <strong>{maskedEmail}</strong>. Nhập mã để hoàn tất đăng nhập trên thiết bị này.
                        Thiết bị đã đăng nhập trước đó sẽ tự động bị đăng xuất.
                    </Text>
                </Flex>

                <Form layout="vertical" size="large" onFinish={handleVerify}>
                    <Form.Item
                        name="otp"
                        rules={[
                            { required: true, message: 'Không để trống OTP!' },
                            { pattern: /^\d{6}$/, message: 'OTP gồm 6 chữ số!' },
                        ]}
                    >
                        <Input
                            prefix={<NumberOutlined style={{ color: '#bfbfbf' }} />}
                            placeholder="Mã OTP"
                            maxLength={6}
                            inputMode="numeric"
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 12 }}>
                        <Button type="primary" htmlType="submit" loading={isVerifying} block style={{ height: 44 }}>
                            Xác thực
                        </Button>
                    </Form.Item>
                </Form>

                <Flex justify="space-between" align="center">
                    <Link to="/login">Quay lại đăng nhập</Link>
                    <Button type="link" onClick={handleResend} loading={isResending} style={{ padding: 0 }}>
                        Gửi lại OTP
                    </Button>
                </Flex>

                <Paragraph
                    type="secondary"
                    style={{ textAlign: 'center', fontSize: 12, marginTop: 16, marginBottom: 0 }}
                >
                    Vì lý do bảo mật, mã OTP chỉ có hiệu lực trong 5 phút.
                </Paragraph>
            </Card>
        </Flex>
    );
};

export default VerifyDevicePage;
