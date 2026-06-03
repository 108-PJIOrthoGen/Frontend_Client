import { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Dropdown, MenuProps, Avatar, Image, message, Badge, Tooltip, Popover, Progress, Empty } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
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
    { path: '/table-patients', label: 'Quản lý bệnh án', icon: 'clinical_notes', step: "Thông tin" },
  ];

  const aiPredictionMenuItems = [
    { path: '/', label: 'Chẩn đoán và đề xuất điều trị', icon: 'person', step: 'Tích hợp AI' },
    { path: '/chart-testing', label: 'Biểu đồ chỉ số viêm', icon: 'history', step: "Giám sát kết quả", requiresCurrentCase: true },
    { path: '/compare-result', label: 'So sánh kết quả', icon: 'compare', step: "Kết quả của AI và bác sĩ", requiresCurrentCase: true },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="flex w-72 flex-col justify-between border-r border-slate-200 bg-white flex-shrink-0 z-20 h-full">
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex flex-col items-center gap-1 px-6 py-6">
            <Image src={"/108POG-logo.png"} alt="Logo" preview={false} />
          </div>

          {/* Current Case */}
          <div className={`mx-4 mb-6 mt-0 rounded-xl p-4 ${currentCase
            ? 'bg-green-50 border border-green-200'
            : 'bg-slate-50 border border-slate-100'
            }`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${currentCase
                ? 'bg-green-200 text-green-700'
                : 'bg-slate-200 text-slate-500'
                }`}>
                {currentCase
                  ? currentCase.patient.fullName?.split(' ').map((n: string) => n[0]).join('') || '?'
                  : <span className="material-symbols-outlined text-lg">person_off</span>
                }
              </div>
              <div className="flex flex-col">
                <span className={`text-xs uppercase tracking-wider font-semibold ${currentCase ? 'text-green-600' : 'text-slate-500'
                  }`}>Ca bệnh hiện tại</span>
                {currentCase ? (
                  <>
                    <h2 className="text-green-900 text-sm font-bold">{currentCase.patient.fullName}</h2>
                    <p className="text-green-600 text-xs font-medium mt-1">
                      Bệnh án #{currentCase.episode.id} — Đang chẩn đoán
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-slate-900 text-sm font-bold">Chưa chọn ca bệnh</h2>
                    <p className="text-slate-400 text-xs font-medium mt-1">Vui lòng chọn bệnh nhân</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1 px-4">
            <p className="px-2 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Bệnh án</p>
            {recordMenuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `group flex items-center gap-3 px-3 py-3 rounded-lg border-l-4 transition-all ${isActive
                  ? 'bg-primary/10 text-primary border-primary'
                  : 'text-slate-600 hover:bg-slate-50 border-transparent'
                  }`}
              >
                <span className={`material-symbols-outlined ${isActive(item.path) ? 'icon-filled' : ''}`}>
                  {item.icon}
                </span>
                <div className="flex flex-col">
                  <span className={` ${isActive(item.path) ? 'font-bold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                  <span className="text-xs opacity-80"> {item.step} </span>
                </div>
              </NavLink>
            ))}

            <div className="my-3 border-t border-slate-100" />
            <p className="px-2 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Dự đoán AI</p>
            {aiPredictionMenuItems.map((item) => {
              const shouldDim = item.requiresCurrentCase && !currentCase;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `group flex items-center gap-3 px-3 py-3 rounded-lg border-l-4 transition-all ${isActive
                    ? 'bg-primary/10 text-primary border-primary'
                    : shouldDim
                      ? 'text-slate-400 hover:bg-slate-50 border-transparent'
                      : 'text-slate-600 hover:bg-slate-50 border-transparent'
                    }`}
                >
                  <span className={`material-symbols-outlined ${isActive(item.path) ? 'icon-filled' : ''}`}>
                    {item.icon}
                  </span>
                  <div className="flex flex-col">
                    <span className={` ${isActive(item.path) ? 'font-bold' : 'font-medium'}`}>
                      {item.label}
                    </span>
                    <span className={`text-xs ${shouldDim ? 'opacity-60' : 'opacity-80'}`}> {item.step} </span>
                  </div>
                </NavLink>
              );
            })}
            <div className="my-3 border-t border-slate-100" />
            <p className="px-2 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Chức năng</p>
            {/* Notifications */}
            <div className="pt-3 pb-1">
              <NotificationBell />
            </div>

            {/* Pending Lab Tasks — progress notification (entry now lives in the
                episode's "Xét nghiệm chờ bổ sung" tab) */}
            <div className="px-3 pt-1 pb-1">
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
                    className="w-full flex items-center gap-3 py-2 rounded-lg
                    hover:bg-amber-50 transition-colors text-left border
                    border-transparent hover:border-amber-200 group"
                  >
                    <Badge count={pendingCount} size="small" offset={[-2, 2]}>
                      <span className="material-symbols-outlined 
                      group-hover:text-amber-700">
                        science
                      </span>
                    </Badge>
                    <span className=" font-medium text-slate-600 group-hover:text-amber-700">
                      Xét nghiệm chờ bổ sung
                    </span>
                  </button>
                </Tooltip>
              </Popover>
            </div>

          </nav>
        </div>

        {/* Footer: Pending tasks + User profile */}
        <div className="border-t border-slate-200">


          {/* User Profile */}
          <div className="p-4 pt-1">
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
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
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
