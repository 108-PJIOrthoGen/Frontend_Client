import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Dropdown,
  Empty,
  List,
  Segmented,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  ReloadOutlined,
  RobotOutlined,
  AlertOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RightOutlined,
} from '@ant-design/icons';
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
  /** Compact icon-only trigger for application headers. */
  compact?: boolean;
}

const getNotificationIcon = (n: INotification) => {
  if (n.type === 'AI_RECOMMENDATION_DONE') {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
        <RobotOutlined className="text-base" />
      </div>
    );
  }
  if (n.type === 'AI_RECOMMENDATION_FAILED') {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
        <CloseCircleOutlined className="text-base" />
      </div>
    );
  }
  if (n.type?.includes('LAB') || n.type?.includes('TASK')) {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
        <AlertOutlined className="text-base" />
      </div>
    );
  }
  if (n.severity === 'SUCCESS') {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
        <CheckCircleOutlined className="text-base" />
      </div>
    );
  }
  if (n.severity === 'ERROR') {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
        <CloseCircleOutlined className="text-base" />
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
      <InfoCircleOutlined className="text-base" />
    </div>
  );
};

const getTypeTag = (n: INotification) => {
  if (n.type === 'AI_RECOMMENDATION_DONE') {
    return <Tag color="green" className="m-0 text-[11px]">AI Phác đồ</Tag>;
  }
  if (n.type === 'AI_RECOMMENDATION_FAILED') {
    return <Tag color="red" className="m-0 text-[11px]">AI Lỗi</Tag>;
  }
  if (n.type?.includes('LAB') || n.type?.includes('TASK')) {
    return <Tag color="orange" className="m-0 text-[11px]">Xét nghiệm</Tag>;
  }
  return null;
};

const NotificationBell = ({ inline = false, compact = false }: Props) => {
  const { notifications, unreadCount, loading, markRead, markAllRead, refresh } = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const filteredNotifications = useMemo(() => {
    if (filter === 'UNREAD') {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [notifications, filter]);

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
        <div className="flex h-40 items-center justify-center">
          <Spin tip="Đang tải thông báo..." />
        </div>
      );
    }
    if (filteredNotifications.length === 0) {
      return (
        <Empty
          description={filter === 'UNREAD' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          className="py-8"
        />
      );
    }
    return (
      <List<INotification>
        dataSource={filteredNotifications}
        renderItem={(n) => (
          <List.Item
            key={n.id}
            onClick={() => handleItemClick(n)}
            className={`cursor-pointer border-b border-slate-100 p-3 transition-all hover:bg-slate-50 ${
              n.isRead ? 'bg-white' : 'bg-sky-50/40'
            }`}
          >
            <div className="flex w-full items-start gap-3">
              {getNotificationIcon(n)}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {getTypeTag(n)}
                    <span className="truncate text-xs font-semibold text-slate-800">
                      {n.title}
                    </span>
                  </div>
                  {!n.isRead ? (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  ) : null}
                </div>

                {n.message ? (
                  <Typography.Paragraph
                    className="mb-0 text-xs leading-relaxed text-slate-600"
                    ellipsis={{ rows: 2, tooltip: n.message }}
                  >
                    {n.message}
                  </Typography.Paragraph>
                ) : null}

                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{dayjs(n.createdAt).fromNow()}</span>
                  {n.linkUrl ? (
                    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 hover:text-emerald-700">
                      Xem ngay <RightOutlined className="text-[10px]" />
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </List.Item>
        )}
      />
    );
  };

  const panel = (
    <div className="w-[380px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <Typography.Text strong className="text-sm text-slate-800">
            Thông báo
          </Typography.Text>
          {unreadCount > 0 && (
            <Badge
              count={unreadCount}
              className="bg-emerald-500"
              style={{ backgroundColor: '#10b981' }}
            />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Tooltip title="Làm mới">
            <Button
              size="small"
              type="text"
              icon={<ReloadOutlined />}
              onClick={() => void refresh()}
              loading={loading}
              className="text-slate-500 hover:text-slate-700"
            />
          </Tooltip>
          <Button
            size="small"
            type="text"
            icon={<CheckOutlined />}
            disabled={unreadCount === 0}
            onClick={() => void markAllRead()}
            className="text-xs text-slate-600 hover:text-slate-800"
          >
            Đọc tất cả
          </Button>
        </div>
      </div>

      <div className="border-b border-slate-100 bg-white px-3 py-1.5">
        <Segmented
          size="small"
          block
          value={filter}
          onChange={(val) => setFilter(val as 'ALL' | 'UNREAD')}
          options={[
            { label: `Tất cả (${notifications.length})`, value: 'ALL' },
            { label: `Chưa đọc (${unreadCount})`, value: 'UNREAD' },
          ]}
        />
      </div>

      <div className="max-h-[440px] overflow-y-auto overscroll-contain">
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
      placement={compact ? 'bottomRight' : 'topRight'}
      dropdownRender={() => panel}
    >
      <Tooltip title="Thông báo hệ thống" placement={compact ? 'bottom' : 'right'}>
        <button
          type="button"
          aria-label="Thông báo"
          className={
            compact
              ? 'app-header-icon-button'
              : 'flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors hover:border-sky-200 hover:bg-sky-50'
          }
          onClick={() => setOpen((v) => !v)}
        >
          <Badge count={unreadCount} size="small" offset={[-2, 2]}>
            <BellOutlined
              className={
                compact
                  ? 'text-[18px]'
                  : 'text-xl text-sky-600 group-hover:text-sky-700'
              }
            />
          </Badge>
          {compact ? null : (
            <span className="font-medium text-slate-600 group-hover:text-sky-700">
              Thông báo
            </span>
          )}
        </button>
      </Tooltip>
    </Dropdown>
  );
};

export default NotificationBell;
