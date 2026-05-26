import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Dropdown, Empty, List, Spin, Tooltip, Typography } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useNotifications } from '@/contexts/NotificationContext';
import type { INotification } from '@/types/notification';

dayjs.extend(relativeTime);
dayjs.locale('vi');

interface Props {
  /** When true, render without dropdown so it can be embedded e.g. in a drawer. */
  inline?: boolean;
}

const severityDot = (n: INotification) => {
  const color = n.severity === 'ERROR'
    ? 'bg-red-500'
    : n.severity === 'SUCCESS'
      ? 'bg-emerald-500'
      : 'bg-sky-500';
  return (
    <span className={`mt-2 inline-block h-2 w-2 flex-shrink-0 rounded-full ${color}`} />
  );
};

const NotificationBell = ({ inline = false }: Props) => {
  const { notifications, unreadCount, loading, markRead, markAllRead, refresh } = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleItemClick = async (n: INotification) => {
    if (!n.isRead) {
      void markRead(n.id);
    }
    setOpen(false);
    if (n.linkUrl) {
      navigate(n.linkUrl);
    }
  };

  const renderList = () => {
    if (loading && notifications.length === 0) {
      return (
        <div className="flex h-32 items-center justify-center">
          <Spin />
        </div>
      );
    }
    if (notifications.length === 0) {
      return (
        <Empty
          description="Chưa có thông báo"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          className="py-6"
        />
      );
    }
    return (
      <List<INotification>
        dataSource={notifications}
        renderItem={(n) => (
          <List.Item
            key={n.id}
            onClick={() => handleItemClick(n)}
            className={`cursor-pointer transition-colors hover:bg-slate-50 ${n.isRead ? '' : 'bg-blue-50/50'}`}
          >
            <div className="flex w-full items-start gap-3">
              {severityDot(n)}
              <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                <Typography.Text>
                  {n.title}
                </Typography.Text>
                {n.message ? (
                  <Typography.Text className="text-xs text-slate-600" ellipsis={{ tooltip: n.message }}>
                    {n.message}
                  </Typography.Text>
                ) : null}
                <Typography.Text className="text-[11px] text-slate-400">
                  {dayjs(n.createdAt).fromNow()}
                </Typography.Text>
              </div>
              {!n.isRead ? (
                <span className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
              ) : null}
            </div>
          </List.Item>
        )}
      />
    );
  };

  const panel = (
    <div className="w-[360px] rounded-lg border border-slate-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
        <Typography.Text strong>Thông báo</Typography.Text>
        <div className="flex items-center gap-2">
          <Tooltip title="Làm mới">
            <Button
              size="small"
              type="text"
              onClick={() => void refresh()}
              loading={loading}
            >
              ↻
            </Button>
          </Tooltip>
          <Button
            size="small"
            type="text"
            icon={<CheckOutlined />}
            disabled={unreadCount === 0}
            onClick={() => void markAllRead()}
          >
            Đánh dấu đã đọc
          </Button>
        </div>
      </div>
      <div className="max-h-[420px] overflow-y-auto">
        {renderList()}
      </div>
    </div>
  );

  if (inline) {
    return panel;
  }

  return (
    <Dropdown
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) void refresh();
      }}
      trigger={['click']}
      placement="topRight"
      dropdownRender={() => panel}
    >
      <Tooltip title="Thông báo" placement="right">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors hover:border-sky-200 hover:bg-sky-50"
          onClick={() => setOpen((v) => !v)}
        >
          <Badge count={unreadCount} size="small" offset={[-2, 2]}>
            <BellOutlined className="text-xl text-sky-600 group-hover:text-sky-700" />
          </Badge>
          <span className="font-medium text-slate-600 group-hover:text-sky-700">
            Thông báo
          </span>
        </button>
      </Tooltip>
    </Dropdown>
  );
};

export default NotificationBell;
