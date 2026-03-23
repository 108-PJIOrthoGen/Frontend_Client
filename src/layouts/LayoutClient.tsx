import { NavLink, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Dropdown, MenuProps, Avatar, Image, message } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import { LogoutAPI } from '@/apis/api';
import { runLogoutAction } from '@/redux/slice/accountSlice';
import { RootState } from '@/redux/store';

export const LayoutClient = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.account?.user);
  const currentCase = useSelector((state: RootState) => state.patient.currentCase);

  const handleLogout = async () => {
    // You can dispatch existing logout action here if you want
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

  const menuItems = [
    { path: '/', label: 'Chẩn đoán và đề xuất điều trị', icon: 'person', step: 'Tích hợp AI' },
    { path: '/table-patients', label: 'Quản lý bệnh án', icon: 'clinical_notes', step: "Thông tin" },
    { path: '/chart-testing', label: 'Biểu đồ chỉ số viêm', icon: 'history', step: "Giám sát kết quả" },
    { path: '/compare-result', label: 'So sánh kết quả', icon: 'compare', step: "Kết quả của AI và bác sĩ" },
  ];

  // Helper to check if a route is active (or if it's the root path)
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
          <div className="flex items-center gap-3 px-6 py-6">
            <div style={{ width: "5rem", height: "4rem" }} className="flex items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Image src={"/unnamed.gif"} alt="Logo" preview={false} />
            </div>
            <div>
              <h1 className="text-slate-900 text-lg font-bold leading-tight">108 MC Hospital</h1>
              <p className="text-slate-500 text-xs font-medium">Bộ chẩn đoán PJI</p>
            </div>
          </div>

          {/* Current Case */}
          <div className={`mx-4 mb-6 mt-2 rounded-xl p-4 ${
            currentCase
              ? 'bg-green-50 border border-green-200'
              : 'bg-slate-50 border border-slate-100'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                currentCase
                  ? 'bg-green-200 text-green-700'
                  : 'bg-slate-200 text-slate-500'
              }`}>
                {currentCase
                  ? currentCase.patient.fullName?.split(' ').map(n => n[0]).join('') || '?'
                  : <span className="material-symbols-outlined text-lg">person_off</span>
                }
              </div>
              <div className="flex flex-col">
                <span className={`text-xs uppercase tracking-wider font-semibold ${
                  currentCase ? 'text-green-600' : 'text-slate-500'
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
            <p className="px-2 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Chức năng</p>
            {menuItems.map((item) => (
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
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-200">
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Outlet />
      </main>
    </div>
  );
};