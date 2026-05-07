import { useEffect, useMemo, useState } from 'react';
import { Drawer, List, Tag, Button, Empty, Popconfirm, Spin, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { DeleteOutlined, DownOutlined, EditOutlined } from '@ant-design/icons';
import { useAppSelector } from '@/redux/hook';
import { callDismissPendingLabTask } from '@/apis/api';
import QuickLabEntryModal from './QuickLabEntryModal';
import type { IPendingLabTask } from '@/types/backend';

interface Props {
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const importanceColor = (imp?: string) => {
  if (imp === 'CRITICAL') return 'red';
  if (imp === 'HIGH') return 'orange';
  return 'blue';
};

const categoryLabel = (cat?: string) => {
  if (cat === 'ICM_MAJOR') return 'ICM Major';
  if (cat === 'ICM_MINOR') return 'ICM Minor';
  return 'Lâm sàng';
};

interface TaskGroup {
  key: string;
  patientName: string;
  episodeLabel: string;
  tasks: IPendingLabTask[];
}

const PendingLabTasksDrawer: React.FC<Props> = ({ open, onClose, onRefresh }) => {
  const { tasks, isLoading } = useAppSelector(state => state.pendingLabTask);
  const [selectedTask, setSelectedTask] = useState<IPendingLabTask | null>(null);
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);

  const taskGroups = useMemo(() => {
    const groupMap = new Map<string, TaskGroup>();
    tasks.forEach((task) => {
      const episodeId = task.episode?.id;
      const patientId = task.patient?.id;
      const key = episodeId != null
        ? `episode-${episodeId}`
        : `patient-${patientId ?? 'unknown'}`;
      const patientName = task.patient?.fullName ?? `Bệnh nhân #${patientId ?? '?'}`;
      const episodeLabel = episodeId != null ? `BA #${episodeId}` : 'Bệnh án chưa rõ';

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          key,
          patientName,
          episodeLabel,
          tasks: [],
        });
      }
      groupMap.get(key)!.tasks.push(task);
    });
    return Array.from(groupMap.values());
  }, [tasks]);

  const selectedGroup = taskGroups.find((group) => group.key === selectedGroupKey);

  const recordMenuItems: MenuProps['items'] = taskGroups.map((group) => ({
    key: group.key,
    label: (
      <div className="flex flex-col">
        <span className="font-semibold text-slate-700">{group.episodeLabel}</span>
        <span className="text-xs text-slate-500">{group.patientName}</span>
      </div>
    ),
  }));

  useEffect(() => {
    if (!open) {
      setSelectedGroupKey(null);
      return;
    }
    if (selectedGroupKey && !taskGroups.some((group) => group.key === selectedGroupKey)) {
      setSelectedGroupKey(null);
    }
  }, [open, selectedGroupKey, taskGroups]);

  const handleDismiss = async (taskId: number) => {
    await callDismissPendingLabTask(taskId);
    onRefresh();
  };

  const handleQuickEntry = (task: IPendingLabTask) => {
    setSelectedTask(task);
    setQuickEntryOpen(true);
  };

  return (
    <>
      <Drawer
        title="Xét nghiệm chờ bổ sung"
        open={open}
        onClose={onClose}
        width={420}
        styles={{ body: { padding: '12px 16px' } }}
      >
        {isLoading ? (
          <div className="flex justify-center py-12"><Spin /></div>
        ) : tasks.length === 0 ? (
          <Empty description="Không có xét nghiệm nào chờ bổ sung" />
        ) : (
          <div className="flex flex-col gap-4">
            <Dropdown
              trigger={['click']}
              menu={{
                items: recordMenuItems,
                onClick: ({ key }) => setSelectedGroupKey(String(key)),
              }}
            >
              <Button className="w-full h-auto justify-between py-2">
                <span className="flex min-w-0 flex-col items-start text-left">
                  <span className="text-sm font-semibold text-slate-700">
                    {selectedGroup?.episodeLabel ?? 'Chọn bệnh án'}
                  </span>
                  <span className="max-w-full truncate text-xs text-slate-500">
                    {selectedGroup?.patientName ?? 'Chọn tên bệnh nhân và mã bệnh án để xem xét nghiệm'}
                  </span>
                </span>
                <DownOutlined className="text-xs text-slate-400" />
              </Button>
            </Dropdown>

            {!selectedGroup ? (
              <Empty description="Chọn một bệnh án để xem xét nghiệm chờ bổ sung" />
            ) : (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-slate-500">person</span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-700">{selectedGroup.patientName}</div>
                    <div className="text-xs text-slate-500">{selectedGroup.episodeLabel}</div>
                  </div>
                </div>
              <List
                size="small"
                dataSource={selectedGroup.tasks}
                renderItem={(task) => (
                  <List.Item
                    className="!px-3 !py-2 rounded-lg hover:bg-slate-50 transition-colors"
                    actions={[
                      <Button
                        key="entry"
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleQuickEntry(task)}
                      >
                        Nhập
                      </Button>,
                      <Popconfirm
                        key="dismiss"
                        title="Bỏ qua nhắc nhở này?"
                        onConfirm={() => handleDismiss(task.id!)}
                        okText="Bỏ qua"
                        cancelText="Hủy"
                      >
                        <Button
                          type="link"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                        />
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <span className="text-xs">
                          <Tag color={importanceColor(task.importance)} className="mr-1">
                            {task.importance}
                          </Tag>
                          <Tag className="mr-1">{categoryLabel(task.category)}</Tag>
                          BA #{task.episode?.id}
                        </span>
                      }
                      description={
                        <span className="text-xs text-slate-500">{task.message}</span>
                      }
                    />
                  </List.Item>
                )}
              />
              </div>
            )}
          </div>
        )}
      </Drawer>

      <QuickLabEntryModal
        task={selectedTask}
        open={quickEntryOpen}
        onClose={() => { setQuickEntryOpen(false); setSelectedTask(null); }}
        onSuccess={() => {
          setQuickEntryOpen(false);
          setSelectedTask(null);
          onRefresh();
        }}
      />
    </>
  );
};

export default PendingLabTasksDrawer;
