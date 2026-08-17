import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Progress, Tag, Tooltip } from 'antd';
import {
  RobotOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  RightOutlined,
  CloseOutlined,
  WarningOutlined,
  DeleteOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { RootState } from '@/redux/store';
import {
  IAiRegimenTask,
  removeTask,
  clearFinishedTasks,
  cancelTask,
} from '@/redux/slice/aiRegimenTaskSlice';
import { setCurrentCase } from '@/redux/features/patients/patientSlice';
import { callCancelAiRun, callFetchEpisodeById } from '@/apis/api';

export const CurrentCaseAndAiMonitor: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentCase = useSelector((state: RootState) => state.patient.currentCase);
  const tasks = useSelector((state: RootState) => state.aiRegimenTask?.tasks ?? []);
  const [cancellingIds, setCancellingIds] = useState<Record<string, boolean>>({});
  const [now, setNow] = useState(Date.now());

  // Tick for live elapsed seconds counter
  useEffect(() => {
    const hasRunning = tasks.some(
      (t) => t.status === 'PROCESSING' || t.status === 'QUEUED'
    );
    if (!hasRunning) return;

    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [tasks]);

  const activeTasks = tasks.filter(
    (t) => t.status === 'PROCESSING' || t.status === 'QUEUED'
  );
  const finishedTasks = tasks.filter(
    (t) => t.status === 'SUCCESS' || t.status === 'FAILED' || t.status === 'CANCELLED'
  );

  const isOverloaded = activeTasks.length >= 3;
  const isHardLimit = activeTasks.length >= 5;

  const handleOpenTask = async (task: IAiRegimenTask) => {
    // If the currentCase is different, fetch and switch currentCase
    if (!currentCase || Number(currentCase.episode?.id) !== Number(task.episodeId)) {
      try {
        const response: any = await callFetchEpisodeById(String(task.episodeId));
        const episode = response?.data?.data ?? response?.data;
        const patient = episode?.patient;
        if (episode && patient) {
          dispatch(setCurrentCase({ patient, episode }));
        }
      } catch (err) {
        console.warn('Failed to load episode when clicking task', err);
      }
    }
    navigate(`/?episodeId=${task.episodeId}&runId=${task.id}`);
  };

  const handleCancelTask = async (e: React.MouseEvent, task: IAiRegimenTask) => {
    e.stopPropagation();
    if (!task.id || cancellingIds[task.id]) return;

    setCancellingIds((prev) => ({ ...prev, [task.id]: true }));
    try {
      await callCancelAiRun(task.id);
    } catch (err) {
      console.warn('Failed to cancel AI run', err);
    } finally {
      dispatch(cancelTask(task.id));
      setCancellingIds((prev) => {
        const next = { ...prev };
        delete next[task.id];
        return next;
      });
    }
  };

  const handleDismissTask = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dispatch(removeTask(id));
  };

  const formatElapsed = (startedAt: number) => {
    const sec = Math.max(0, Math.floor((now - startedAt) / 1000));
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    const remSec = sec % 60;
    return `${min}m${remSec}s`;
  };

  return (
    <div
      data-tour="sidebar-current-case"
      className="mx-3 mb-3 mt-4 shrink-0 rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm transition-all"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${activeTasks.length > 0
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-500'
              }`}
          >
            <RobotOutlined
              className={`text-sm ${activeTasks.length > 0 ? 'animate-pulse text-emerald-600' : ''
                }`}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-800 leading-tight">
              Giám sát luồng sinh phác đồ
            </span>

          </div>
        </div>

        <div className="flex items-center gap-1">
          {activeTasks.length > 0 ? (
            <Badge
              count={`${activeTasks.length} đang chạy`}
              className="bg-emerald-500 text-[10px]"
              style={{ backgroundColor: '#10b981', fontSize: '10px' }}
            />
          ) : (
            <Tag color="default" className="m-0 border-0 bg-slate-100 text-[10px] text-slate-500">
              Sẵn sàng
            </Tag>
          )}

          {finishedTasks.length > 0 && activeTasks.length === 0 && (
            <Tooltip title="Xoá lịch sử hoàn tất">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined className="text-[11px]" />}
                onClick={() => dispatch(clearFinishedTasks())}
                className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
              />
            </Tooltip>
          )}
        </div>
      </div>

      {/* Overload / Throttling Warning Banner */}
      {isHardLimit ? (
        <div className="mb-2.5 flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 p-2 text-[11px] text-red-800">
          <WarningOutlined className="mt-0.5 text-xs text-red-600 shrink-0" />
          <div>
            <span className="font-semibold">Đạt giới hạn đồng thời (5 tác vụ):</span>{' '}
            Hệ thống đang tải cao. Vui lòng chờ các luồng xử lý hoàn tất trước khi tạo thêm.
          </div>
        </div>
      ) : isOverloaded ? (
        <div className="mb-2.5 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50/90 p-2 text-[11px] text-amber-800">
          <ThunderboltOutlined className="mt-0.5 text-xs text-amber-600 shrink-0" />
          <div>
            <span className="font-semibold">Đang tải {activeTasks.length} luồng:</span>{' '}
            Hàng đợi RabbitMQ đang điều phối xử lý lần lượt theo thứ tự.
          </div>
        </div>
      ) : null}

      {/* IDLE STATE: No running or finished tasks */}
      {activeTasks.length === 0 && finishedTasks.length === 0 && (
        <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-2.5 text-slate-500 mt-1">
          <SyncOutlined className="text-xs text-slate-400" />
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-600">Chưa có luồng AI nào đang chạy</span>
            <span className="text-[10px] text-slate-400">Khi bạn nhấn "Sinh phác đồ", tiến trình sẽ hiển thị tại đây</span>
          </div>
        </div>
      )}

      {/* ACTIVE AND FINISHED TASKS LIST */}
      {(activeTasks.length > 0 || finishedTasks.length > 0) && (
        <div className="mt-1 flex max-h-56 flex-col gap-1.5 overflow-y-auto overscroll-contain pr-0.5">
          {/* Active Tasks */}
          {activeTasks.map((task) => {
            const isCancelling = Boolean(cancellingIds[task.id]);
            return (
              <div
                key={task.id}
                onClick={() => handleOpenTask(task)}
                className="group relative flex cursor-pointer flex-col gap-1 rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5 transition-all hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <LoadingOutlined className="text-xs text-emerald-600" />
                    <span className="truncate text-xs font-bold text-slate-800">
                      {task.patientName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-semibold text-emerald-700">
                      {formatElapsed(task.startedAt)}
                    </span>
                    <Tooltip title="Huỷ sinh phác đồ">
                      <button
                        type="button"
                        onClick={(e) => handleCancelTask(e, task)}
                        disabled={isCancelling}
                        className="flex h-4 w-4 items-center justify-center rounded text-slate-400 opacity-60 hover:bg-slate-200 hover:text-red-600 hover:opacity-100"
                      >
                        <CloseOutlined className="text-[9px]" />
                      </button>
                    </Tooltip>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="truncate font-medium text-emerald-800">
                    Bệnh án {task.medicalRecordCode || `#${task.episodeId}`}
                  </span>
                  <span className="truncate text-[10px] font-semibold text-emerald-600">
                    {task.stage ? `[${task.stage}]` : 'Đang phân tích RAG'}
                  </span>
                </div>

                {task.progressMessage && (
                  <div className="truncate text-[10px] italic text-slate-500">
                    {task.progressMessage}
                  </div>
                )}

                <div className="mt-0.5">
                  <Progress
                    percent={task.status === 'PROCESSING' ? 75 : 30}
                    status="active"
                    showInfo={false}
                    size="small"
                    strokeColor={{ from: '#10b981', to: '#06b6d4' }}
                  />
                </div>
              </div>
            );
          })}

          {/* Finished Tasks (Recent) */}
          {finishedTasks.slice(0, 3).map((task) => (
            <div
              key={task.id}
              onClick={() => handleOpenTask(task)}
              className={`group flex cursor-pointer items-center justify-between rounded-lg border p-2 text-xs transition-all hover:shadow-sm ${task.status === 'SUCCESS'
                ? 'border-slate-200 bg-slate-50/80 hover:border-emerald-300 hover:bg-emerald-50/40'
                : 'border-red-100 bg-red-50/50 hover:border-red-300'
                }`}
            >
              <div className="flex min-w-0 items-center gap-2">
                {task.status === 'SUCCESS' ? (
                  <CheckCircleOutlined className="text-xs text-emerald-600 shrink-0" />
                ) : (
                  <CloseCircleOutlined className="text-xs text-red-500 shrink-0" />
                )}
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-xs font-semibold text-slate-700">
                    {task.patientName}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    BA {task.medicalRecordCode || `#${task.episodeId}`} ·{' '}
                    {task.status === 'SUCCESS' ? 'Hoàn tất' : 'Lỗi/Đã huỷ'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] font-medium text-emerald-600 opacity-0 group-hover:opacity-100">
                  Mở <RightOutlined className="text-[9px]" />
                </span>
                <button
                  type="button"
                  onClick={(e) => handleDismissTask(e, task.id)}
                  className="h-4 w-4 text-slate-400 opacity-40 hover:text-slate-600 hover:opacity-100"
                >
                  <CloseOutlined className="text-[9px]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CurrentCaseAndAiMonitor;
