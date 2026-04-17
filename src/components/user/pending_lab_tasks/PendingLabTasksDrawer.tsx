import { useState } from 'react';
import { Drawer, List, Tag, Button, Empty, Popconfirm, Spin } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
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

const PendingLabTasksDrawer: React.FC<Props> = ({ open, onClose, onRefresh }) => {
  const { tasks, isLoading } = useAppSelector(state => state.pendingLabTask);
  const [selectedTask, setSelectedTask] = useState<IPendingLabTask | null>(null);
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);

  const grouped = tasks.reduce<Record<string, IPendingLabTask[]>>((acc, task) => {
    const key = task.patient?.fullName ?? `Bệnh nhân #${task.patient?.id ?? '?'}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {});

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
          Object.entries(grouped).map(([patientName, patientTasks]) => (
            <div key={patientName} className="mb-4">
              <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">person</span>
                {patientName}
              </h4>
              <List
                size="small"
                dataSource={patientTasks}
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
          ))
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
