import { useState, useEffect, useMemo } from 'react';
import { useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Dropdown, Menu, MenuProps, Avatar, Image, message, Badge, Tooltip, Popover, Progress, Empty } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined, AlertOutlined, WechatOutlined, ExperimentOutlined, ForkOutlined } from '@ant-design/icons';
import { LogoutAPI } from '@/apis/api';
import { runLogoutAction } from '@/redux/slice/accountSlice';
import { fetchMyPendingTasks, fetchMyPendingCount } from '@/redux/slice/pendingLabTaskSlice';
import { RootState } from '@/redux/store';
import type { IPendingLabTask } from '@/types/backend';
import ProfileSettingsModal from '@/components/user/profile/ProfileSettingsModal';
import NotificationBell from '@/components/common/NotificationBell';

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

  const selectedNavigationKey = [...recordMenuItems, ...aiPredictionMenuItems]
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
      label: <span className="text-[15px] font-bold">Sinh Khuyến Nghị</span>,
      children: aiPredictionMenuItems.map((item) => ({
        key: item.path,
        disabled: item.comingSoon,
        icon: <span className="flex items-center text-[21px]">{item.icon}</span>,
        label: item.comingSoon ? (
          <Tooltip title="Tính năng sắp ra mắt" placement="right">
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
      key: 'utilities',
      label: <span className="text-[15px] font-bold">Chức năng</span>,
      children: [
        {
          key: 'notifications',
          label: (
            <div className="-mx-3 [&_button]:text-[15px] [&_svg]:text-[22px]">
              <NotificationBell />
            </div>
          ),
          style: { height: 'auto', lineHeight: 'normal', paddingBlock: 0 },
        },
        {
          key: 'pending-lab-tasks',
          label: (
            <Popover
              open={pendingPopoverOpen}
              onOpenChange={setPendingPopoverOpen}
              trigger="click"
              placement="rightTop"
              title="Tiến độ xét nghiệm chờ bổ sung"
              content={pendingPopoverContent}
            >
              <Tooltip title="Xét nghiệm chờ bổ sung" placement="right">
                <button
                  type="button"
                  className="-mx-3 flex w-[calc(100%+24px)] items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors hover:border-amber-200 hover:bg-amber-50"
                >
                  <Badge count={pendingCount} size="small" offset={[-1, 3]}>
                    <AlertOutlined className="text-[21px]" />
                  </Badge>
                  <span className="truncate text-[15px] font-semibold text-slate-600">
                    Xét nghiệm chờ bổ sung
                  </span>
                </button>
              </Tooltip>
            </Popover>
          ),
          style: { height: 'auto', lineHeight: 'normal', paddingBlock: 0 },
        },
      ],
    },
  ];

  const handleNavigationClick: MenuProps['onClick'] = ({ key }) => {
    if (key.startsWith('/') && key !== location.pathname) {
      navigate(key);
    }
  };

  return (
    <div
      className="flex h-screen min-h-0 w-full overflow-hidden bg-slate-50"
      style={{ height: '100dvh' }}
    >
      {/* Sidebar */}
      <aside className="z-20 flex h-full min-h-0 w-[19rem] max-w-[85vw] flex-shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Header */}
          <div className="flex shrink-0 flex-col items-center gap-1 px-6 pt-3">
            <Image src={"/108POG-logo.png"} alt="Logo" preview={false} />
          </div>

          {/* Current Case */}
          <div data-tour="sidebar-current-case" className={`mx-4 mb-6 mt-0 shrink-0 rounded-xl p-4 ${currentCase
            ? 'bg-green-50 border border-green-200'
            : 'bg-slate-50 border border-slate-100'
            }`}>
            <div className="flex items-start gap-2">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${currentCase
                ? 'bg-green-200 text-green-700'
                : 'bg-slate-200 text-slate-500'
                }`}>
                {currentCase
                  ? currentCase.patient.fullName?.split(' ').map((n: string) => n[0]).join('') || '?'
                  : <span className="material-symbols-outlined text-lg">person_off</span>
                }
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className={`text-[13px] uppercase tracking-wider font-semibold ${currentCase ? 'text-green-600' : 'text-slate-500'
                  }`}>Ca bệnh hiện tại</span>
                {currentCase ? (
                  <>
                    <h2 className="truncate text-base font-bold text-green-900">{currentCase.patient.fullName}</h2>
                    <p className="mt-1 truncate text-sm font-medium text-green-600">
                      Bệnh án #{currentCase.episode.id} — Đang chẩn đoán
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-base font-bold text-slate-900">Chưa chọn ca bệnh</h2>
                    <p className="mt-1 text-[13px] font-medium text-slate-400">Vui lòng chọn bệnh nhân</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav
            data-tour="sidebar-navigation"
            aria-label="Điều hướng chính"
            className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 pb-4"
          >
            <Menu
              mode="inline"
              items={navigationItems}
              selectedKeys={selectedNavigationKey ? [selectedNavigationKey] : []}
              openKeys={['medical-records', 'ai-recommendations', 'utilities']}
              onClick={handleNavigationClick}
              className="client-sidebar-menu border-0 bg-transparent"
              inlineIndent={16}
            />
          </nav>
        </div>

        {/* Footer: Pending tasks + User profile */}
        <div className="shrink-0 border-t border-slate-200 bg-white">

          {/* User Profile */}
          <div data-tour="sidebar-account" className="p-4 pt-1">
            <Dropdown menu={{ items: userMenu }} trigger={['click']} placement="topLeft">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                <Avatar size="large" icon={<UserOutlined />} className="bg-primary/10 text-primary flex-shrink-0 border border-primary/20 aspect-square" />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-lg font-bold text-slate-900 truncate">
                    {user?.name}
                  </span>
                  <span className="text-xs font-medium text-slate-500 truncate">
                    {'Bác sĩ chuyên khoa'}
                  </span>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-[20px]">expand_more</span>
              </div>
            </Dropdown>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>

      {/* Profile / Account Settings Modal */}
      <ProfileSettingsModal
        open={profileModalOpen}
        setOpen={setProfileModalOpen}
      />
    </div>
  );
};
