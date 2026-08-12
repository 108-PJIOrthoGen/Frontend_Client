import { useState, useEffect, useMemo } from 'react';
import { useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Dropdown, Menu, MenuProps, Avatar, message, Badge, Tooltip, Popover, Progress, Empty } from 'antd';
import {
  AlertOutlined,
  AppstoreOutlined,
  ExperimentOutlined,
  ForkOutlined,
  ThunderboltOutlined,
  LogoutOutlined,
  MenuOutlined,
  CloseOutlined,
  SettingOutlined,
  UserOutlined,
  WechatOutlined,
} from '@ant-design/icons';
import { LogoutAPI } from '@/apis/api';
import { runLogoutAction } from '@/redux/slice/accountSlice';
import { fetchMyPendingTasks, fetchMyPendingCount } from '@/redux/slice/pendingLabTaskSlice';
import { RootState } from '@/redux/store';
import type { IPendingLabTask } from '@/types/backend';
import ProfileSettingsModal from '@/components/user/profile/ProfileSettingsModal';
import NotificationBell from '@/components/common/NotificationBell';
import pogLogoUrl from '@/assets/pog-logo.png';

export const LayoutClient = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.account?.user);
  const currentCase = useSelector((state: RootState) => state.patient.currentCase);
  const pendingCount = useSelector((state: RootState) => state.pendingLabTask.count);
  const pendingTasks = useSelector((state: RootState) => state.pendingLabTask.tasks);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [pendingPopoverOpen, setPendingPopoverOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    dispatch(fetchMyPendingCount() as any);
    dispatch(fetchMyPendingTasks() as any);
  }, [dispatch]);

  // Group this user's tasks by episode and keep only those still carrying
  // outstanding (pending) work — the notification shows per-episode progress.
  const episodeProgress = useMemo(() => {
    const map = new Map<string, {
      episodeId: number;
      patientId?: number;
      patientName: string;
      total: number;
      done: number;
    }>();
    (pendingTasks as IPendingLabTask[]).forEach((t) => {
      const episodeId = t.episode?.id;
      if (episodeId == null) return;
      const key = String(episodeId);
      if (!map.has(key)) {
        map.set(key, {
          episodeId,
          patientId: t.patient?.id,
          patientName: t.patient?.fullName ?? `Bệnh nhân #${t.patient?.id ?? '?'}`,
          total: 0,
          done: 0,
        });
      }
      const g = map.get(key)!;
      g.total += 1;
      if ((t.status ?? 'PENDING') !== 'PENDING') g.done += 1;
    });
    // Only episodes that still have at least one pending field.
    return Array.from(map.values()).filter((g) => g.done < g.total);
  }, [pendingTasks]);

  const goToEpisode = (patientId?: number, episodeId?: number) => {
    setPendingPopoverOpen(false);
    const params = new URLSearchParams();
    if (patientId != null) params.set('patientId', String(patientId));
    if (episodeId != null) params.set('episodeId', String(episodeId));
    params.set('tab', 'pending');
    navigate(`/table-patients?${params.toString()}`);
  };

  const pendingPopoverContent = (
    <div className="w-80 max-h-96 overflow-y-auto">
      {episodeProgress.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có xét nghiệm chờ bổ sung" />
      ) : (
        <div className="flex flex-col gap-2">
          {episodeProgress.map((g) => {
            const percent = g.total === 0 ? 0 : Math.round((g.done / g.total) * 100);
            return (
              <button
                key={g.episodeId}
                onClick={() => goToEpisode(g.patientId, g.episodeId)}
                className="text-left p-3 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">{g.patientName}</span>
                  <span className="text-xs text-slate-500">BA #{g.episodeId}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Progress percent={percent} size="small" className="flex-1" />
                  <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                    {g.done}/{g.total}
                  </span>
                </div>
                <span className="text-[11px] text-amber-700">Bấm để mở bệnh án và bổ sung</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const handleLogout = async () => {
    await LogoutAPI();
    dispatch(runLogoutAction(null));
    message.success("Đăng xuất thành công");
    navigate('/login');
  };

  const userMenu: MenuProps['items'] = [
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt tài khoản',
      onClick: () => setProfileModalOpen(true),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: handleLogout,
    },
  ];

  const recordMenuItems = [
    { path: '/table-patients', label: 'Quản lý hồ sơ', icon: 'clinical_notes', step: "Thông tin" },
  ];


  const aiPredictionMenuItems = [
    { path: '/', label: 'Chẩn đoán và đề xuất điều trị', icon: <WechatOutlined />, step: 'Tích hợp AI' },
    { path: '/scenario-simulator', label: 'Bộ mô phỏng kịch bản kết quả điều trị', icon: <ExperimentOutlined />, step: 'Mô phỏng & so sánh kịch bản', comingSoon: true },
    { path: '/antibiotic-planner', label: 'Hoạch định Kháng sinh toàn diện', icon: <ForkOutlined />, step: 'Quản lý bệnh học dài kỳ', comingSoon: true },
  ];

  const applicationMenuItems = [
    {
      path: '/quick-diagnosis',
      label: 'Chẩn đoán nhanh',
      icon: <ThunderboltOutlined />,
      step: 'ICM 2018 · PJIDx & Risk',
    },
  ];

  const selectedNavigationKey = [...recordMenuItems, ...aiPredictionMenuItems, ...applicationMenuItems]
    .find((item) => (
      item.path === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(item.path)
    ))?.path;

  const renderNavigationLabel = (label: string, step: string) => (
    <div className="flex min-w-0 flex-col py-1 leading-tight">
      <span className="truncate text-[15px] font-semibold">{label}</span>
      <span className="mt-1 truncate text-[13px] opacity-70">{step}</span>
    </div>
  );

  const navigationItems: MenuProps['items'] = [
    {
      key: 'medical-records',
      label: <span className="text-[15px] font-bold">Bệnh Án</span>,
      children: recordMenuItems.map((item) => ({
        key: item.path,
        icon: <span className="material-symbols-outlined text-[23px]">{item.icon}</span>,
        label: renderNavigationLabel(item.label, item.step),
        style: { height: 'auto', lineHeight: 'normal', paddingBlock: 6 },
      })),
    },
    {
      key: 'ai-recommendations',
      label: <span className="text-[15px] font-bold">Tính Năng</span>,
      children: aiPredictionMenuItems.map((item) => ({
        key: item.path,
        disabled: item.comingSoon,
        icon: <span className="flex items-center text-[21px]">{item.icon}</span>,
        label: item.comingSoon ? (
          <Tooltip title="Sắp ra mắt" placement="right">
            <div className="flex min-w-0 flex-col py-1 leading-tight">
              <span className="truncate text-[15px] font-semibold">{item.label}</span>
              <span className="mt-1 truncate text-[12px] text-green-500">
                Sắp ra mắt · {item.step}
              </span>
            </div>
          </Tooltip>
        ) : renderNavigationLabel(item.label, item.step),
        style: { height: 'auto', lineHeight: 'normal', paddingBlock: 6 },
      })),
    },
    {
      key: 'applications',
      label: <span className="text-[15px] font-bold">Ứng dụng</span>,
      children: applicationMenuItems.map((item) => ({
        key: item.path,
        icon: <span className="flex items-center text-[21px] text-emerald-600">{item.icon}</span>,
        label: renderNavigationLabel(item.label, item.step),
        style: { height: 'auto', lineHeight: 'normal', paddingBlock: 6 },
      })),
    },
  ];

  const handleNavigationClick: MenuProps['onClick'] = ({ key }) => {
    if (key.startsWith('/') && key !== location.pathname) {
      navigate(key);
    }
    setSidebarOpen(false);
  };

  return (
    <div
      className="app-shell flex h-screen min-h-0 w-full flex-col overflow-hidden"
      style={{ height: '100dvh' }}
    >
      <header className="app-header">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            className="app-header-icon-button"
            aria-label={sidebarOpen ? 'Đóng thanh điều hướng' : 'Mở thanh điều hướng'}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((isOpen) => !isOpen)}
          >
            {sidebarOpen ? <CloseOutlined /> : <MenuOutlined />}
          </button>
          <div className="hidden h-8 w-8 items-center justify-center rounded-md text-slate-500 sm:flex">
            <AppstoreOutlined className="text-[18px]" />
          </div>
          <span className="hidden h-6 w-px bg-slate-200 sm:block" />
          <a href="/" className="flex min-w-0 items-center gap-3" aria-label="PJI OrthGen - Trang chủ">
            <span className="app-brand-mark" aria-hidden="true">
              <img src={pogLogoUrl} alt="" />
            </span>
            <span className="sr-only">PJI OrthGen</span>
            <span className="app-brand-name">
              <span>PJI</span>
              <span>OrthGen</span>
            </span>
          </a>
        </div>

        <div className="flex items-center gap-1.5">
          <NotificationBell compact />
          <Popover
            open={pendingPopoverOpen}
            onOpenChange={setPendingPopoverOpen}
            trigger="click"
            placement="bottomRight"
            title="Tiến độ xét nghiệm chờ bổ sung"
            content={pendingPopoverContent}
          >
            <Tooltip title="Xét nghiệm chờ bổ sung" placement="bottom">
              <button type="button" className="app-header-icon-button" aria-label="Xét nghiệm chờ bổ sung">
                <Badge count={pendingCount} size="small" offset={[-2, 2]}>
                  <AlertOutlined className="text-[18px]" />
                </Badge>
              </button>
            </Tooltip>
          </Popover>
          <Tooltip title="Cài đặt tài khoản" placement="bottom">
            <button
              type="button"
              className="app-header-icon-button"
              aria-label="Cài đặt tài khoản"
              onClick={() => setProfileModalOpen(true)}
            >
              <SettingOutlined className="text-[18px]" />
            </button>
          </Tooltip>
          <Dropdown menu={{ items: userMenu }} trigger={['click']} placement="bottomRight">
            <button type="button" className="ml-1 flex items-center gap-2 rounded-lg p-1 pr-2 text-left transition-colors hover:bg-slate-100">
              <Avatar size={30} icon={<UserOutlined />} className="bg-emerald-50 text-emerald-700" />
              <span className="hidden max-w-36 truncate text-sm font-semibold text-slate-700 md:block">
                {user?.name || 'Bác sĩ'}
              </span>
            </button>
          </Dropdown>
        </div>
      </header>

      <div className={`app-shell-body relative flex min-h-0 flex-1 overflow-hidden ${sidebarOpen ? 'app-sidebar-is-open' : 'app-sidebar-is-closed'}`}>
        {sidebarOpen ? (
          <button
            type="button"
            className="absolute inset-0 z-20 bg-slate-950/25 backdrop-blur-[1px] lg:hidden"
            aria-label="Đóng thanh điều hướng"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        {/* Sidebar */}
        <aside className="app-sidebar">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Current Case */}
            <div data-tour="sidebar-current-case" className={`mx-3 mb-3 mt-4 shrink-0 rounded-lg border p-3 ${currentCase
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-slate-200 bg-slate-50'
              }`}>
              <div className="flex items-start gap-2">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xs font-bold ${currentCase
                  ? 'bg-emerald-200 text-emerald-800'
                  : 'bg-slate-200 text-slate-500'
                  }`}>
                  {currentCase
                    ? currentCase.patient.fullName?.split(' ').map((n: string) => n[0]).join('') || '?'
                    : <span className="material-symbols-outlined text-lg">person_off</span>
                  }
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className={`text-[11px] font-bold uppercase tracking-[0.08em] ${currentCase ? 'text-emerald-700' : 'text-slate-500'
                    }`}>Ca bệnh hiện tại</span>
                  {currentCase ? (
                    <>
                      <h2 className="truncate text-sm font-bold text-emerald-950">{currentCase.patient.fullName}</h2>
                      <p className="mt-0.5 truncate text-xs font-medium text-emerald-700">
                        Bệnh án #{currentCase.episode.id} — Đang chẩn đoán
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-sm font-bold text-slate-800">Chưa chọn ca bệnh</h2>
                      <p className="mt-0.5 text-xs font-medium text-slate-500">Vui lòng chọn bệnh nhân</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav
              data-tour="sidebar-navigation"
              aria-label="Điều hướng chính"
              className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 pb-4"
            >
              <Menu
                mode="inline"
                items={navigationItems}
                selectedKeys={selectedNavigationKey ? [selectedNavigationKey] : []}
              openKeys={['medical-records', 'ai-recommendations', 'applications']}
                onClick={handleNavigationClick}
                className="client-sidebar-menu border-0 bg-transparent"
                inlineIndent={16}
              />
            </nav>
          </div>

          <div data-tour="sidebar-account" className="shrink-0 border-t border-slate-200 bg-white p-3 lg:hidden">
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
              <Avatar size={34} icon={<UserOutlined />} className="bg-emerald-50 text-emerald-700" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-slate-800">{user?.name || 'Bác sĩ'}</div>
                <div className="truncate text-xs text-slate-500">Bác sĩ chuyên khoa</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="app-workspace relative flex min-w-0 flex-1 overflow-hidden">
          <section className="app-content-surface">
            <Outlet />
          </section>
        </main>
      </div>

      {/* Profile / Account Settings Modal */}
      <ProfileSettingsModal
        open={profileModalOpen}
        setOpen={setProfileModalOpen}
      />
    </div>
  );
};
