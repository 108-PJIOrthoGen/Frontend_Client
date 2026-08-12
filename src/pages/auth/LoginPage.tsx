import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Button, Form, Input, Switch, message, Modal, notification,
} from 'antd';
import {
  LockOutlined, MenuOutlined, UserOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import {
  fetchAccount,
  runLoginAction,
  runLogoutAction,
  setRefreshTokenAction,
} from '../../redux/slice/accountSlice';
import { loginAPI, LogoutAPI } from '@/apis/auth';
import { useAppDispatch, useAppSelector } from '@/redux/hook';
import synoeticTeamImage from '@/assets/teams/synoetic.png';
import ibmeTeamImage from '@/assets/teams/no-slg.png';
import { setAccessToken } from '@/security/accessToken';
import pogLogoUrl from '@/assets/pog-logo.png';

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const from = location.state?.from?.pathname || '/';

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
    if (res?.data?.requiresDeviceVerification) {
      // New / unrecognized browser. The backend held off issuing tokens and
      // emailed an OTP; route the user to the verification screen, passing
      // the password so they can re-trigger the OTP without retyping creds.
      navigate('/verify-device', {
        state: {
          email: username,
          challengeId: res.data.challengeId,
          maskedEmail: res.data.maskedEmail,
          password,
        },
        replace: true,
      });
      return;
    }
    if (res?.data?.access_token) {
      setAccessToken(res.data.access_token);
      dispatch(setRefreshTokenAction({ status: false, message: '' }));

      // Use /auth/account as the canonical source for role + permissions before
      // entering protected routes. Fall back to the login payload only when it
      // already contains a complete role and the profile refresh is unavailable.
      const accountResult = await dispatch(fetchAccount());
      const hasHydratedRole = fetchAccount.fulfilled.match(accountResult)
        && Boolean(accountResult.payload?.user?.role?.name);
      if (!hasHydratedRole) {
        if (!res.data.user?.role?.name) {
          notification.error({
            message: 'Không thể tải quyền truy cập',
            description: 'Vui lòng kiểm tra kết nối và thử đăng nhập lại.',
          });
          return;
        }
        dispatch(runLoginAction(res.data.user));
      }

      message.success('Đăng nhập thành công');
      navigate(from, { replace: true });
    } else {
      notification.error({
        message: 'Đăng nhập thất bại',
        description: res?.message ?? 'Thông tin đăng nhập chưa chính xác!',
      });
    }
  };

  return (
    <main
      className="min-h-screen overflow-y-auto"
      style={{ minHeight: '100dvh' }}
    >
      <section
        className="grid min-h-screen w-full overflow-hidden bg-white lg:grid-cols-[minmax(360px,0.36fr)_minmax(0,0.64fr)]"
        style={{ minHeight: '100dvh' }}
      >
        <div id="login-panel" className="relative flex flex-col bg-white px-7 py-5 sm:px-12 sm:py-10">
          <img
            src={pogLogoUrl}
            alt="POG"
            className="h-40 w-40 rounded-2xl object-contain"
          />

          <div className="my-auto py-10">
            <div className="mx-auto mb-7 flex h-[92px] w-[92px] items-center justify-center rounded-full bg-[#213872] text-[44px] text-white shadow-[0_12px_30px_rgba(33,56,114,0.24)]">
              <UserOutlined />
            </div>


            <Form
              onFinish={onFinish}
              layout="vertical"
              initialValues={{ remember: true }}
              size="large"
              className="mx-auto max-w-[390px]"
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: 'Không để trống!' }]}
              >
                <Input
                  prefix={<UserOutlined className="text-slate-400" />}
                  placeholder="Email"
                  autoComplete="username"
                  className="h-12 rounded-full border-2 border-slate-300 px-5 hover:border-[#29488e] focus:border-[#29488e]"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: 'Không để trống!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-slate-400" />}
                  placeholder="Mật khẩu"
                  autoComplete="current-password"
                  className="h-12 rounded-full border-2 border-slate-300 px-5 hover:border-[#29488e] focus:border-[#29488e]"
                />
              </Form.Item>

              <div className="mb-5 flex items-center justify-between gap-3 text-[13px]">
                <label className="flex cursor-pointer items-center gap-2 text-slate-600">
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Switch size="small" />
                  </Form.Item>
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <Link className="font-medium text-[#29488e] hover:text-[#1b3168]" to="/forgot-password">
                  Quên mật khẩu?
                </Link>
              </div>

              <Form.Item className="mb-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isLoading}
                  block
                  className="h-12 rounded-full border-0 bg-[#263e7d] text-[15px] font-bold tracking-wide shadow-[0_8px_20px_rgba(38,62,125,0.24)] hover:!bg-[#1d3167]"
                >
                  Đăng nhập
                </Button>
              </Form.Item>

              <p className="mb-0 text-center text-[12px] leading-relaxed text-slate-500">
                Tài khoản chỉ được cấp cho các Bác Sĩ. Nếu có vấn đề liên quan tài khoản, vui lòng liên hệ QTV hệ thống.
              </p>
            </Form>
          </div>

          <div className="flex justify-center gap-2" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[#263e7d]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#263e7d]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#263e7d]" />
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Sản phẩm được phát triển bởi
            </p>
            <div className="flex items-center justify-center gap-4 sm:gap-8">
              <img
                src={synoeticTeamImage}
                alt="Nhóm phát triển Synoetic"
                className="h-14 w-46 rounded-md object-cover object-center"
              />
              <span className="h-8 w-px bg-slate-200" aria-hidden="true" />
              <img
                src={ibmeTeamImage}
                alt="Nhóm phát triển iBME"
                className="h-11 w-28 object-contain"
              />
            </div>
          </div>

        </div>

        <div
          className="relative flex min-h-[460px] flex-col overflow-hidden px-6 py-7 text-white sm:px-10 lg:min-h-0 lg:px-12"
          style={{
            background: [
              'radial-gradient(circle at 12% 12%, rgba(98, 164, 205, 0.88) 0%, rgba(30, 150, 205, 0.38) 22%, transparent 38%)',
              'radial-gradient(circle at 86% 70%, rgba(163, 230, 53, 0.20) 0%, transparent 34%)',
              'linear-gradient(135deg, #0f2d68 0%, #17aa65 48%, #11285f 100%)',
            ].join(', '),
          }}
        >


          <nav aria-label="Điều hướng trang đăng nhập" className="relative z-10 flex items-center justify-end gap-5 text-[11px] font-semibold tracking-wider sm:gap-7">
            <a href="https://www.facebook.com/synoeticorg" className="text-white/80 transition-colors hover:text-white">VỀ CHÚNG TÔI</a>
            <Link to="/forgot-password" className="text-white/80 transition-colors hover:text-white">QUÊN MẬT KHẨU</Link>
            <a href="#login-panel" className="rounded-full border border-white/40 bg-[#213872]/70 px-5 py-2 text-white transition-colors hover:bg-[#213872]">
              ĐĂNG NHẬP
            </a>
            <button
              type="button"
              aria-label="Đi tới biểu mẫu đăng nhập"
              onClick={() => document.getElementById('login-panel')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-white/85 transition-colors hover:bg-white/10 hover:text-white"
            >
              <MenuOutlined />
            </button>
          </nav>

          <div id="development-teams" className="relative z-10 my-auto flex flex-col items-center py-12 text-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Chào mừng!</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-50/85 sm:text-base">
              Đồng hành cùng đội ngũ y tế trong chuyển đổi số, ứng dụng công nghệ vào thực tiễn lâm sàng.
            </p>

          </div>
        </div>
      </section>

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
    </main>
  );
};

export default LoginPage;
