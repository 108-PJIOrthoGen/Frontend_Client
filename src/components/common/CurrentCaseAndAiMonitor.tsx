import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Badge, Progress, Tag, Tooltip } from 'antd';
import {
  RobotOutlined,
  LoadingOutlined,
  ThunderboltOutlined,
  CloseOutlined,
  WarningOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { RootState } from '@/redux/store';
import {
  IAiRegimenTask,
  cancelTask,
  completeTask,
} from '@/redux/slice/aiRegimenTaskSlice';
import { callCancelAiRun, callFetchAiRecommendationRunDetail } from '@/apis/api';

const TERMINAL_RUN_STATUSES = new Set(['SUCCESS', 'PARTIAL', 'FAILED', 'TIMEOUT', 'CANCELLED']);
const STATUS_POLL_INTERVAL_MS = 5_000;

export const CurrentCaseAndAiMonitor: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const tasks = useSelector((state: RootState) => state.aiRegimenTask?.tasks ?? []);
  const [cancellingIds, setCancellingIds] = useState<Record<string, boolean>>({});
  const [now, setNow] = useState(Date.now());

  const activeTasks = useMemo(
    () => tasks.filter((t) => t.status === 'PROCESSING' || t.status === 'QUEUED'),
    [tasks],
  );

  useEffect(() => {
    if (activeTasks.length === 0) return;
    let disposed = false;

    const reconcileTerminalRuns = async () => {
      const results = await Promise.allSettled(
        activeTasks.map((task) => callFetchAiRecommendationRunDetail(task.id)),
      );
      if (disposed) return;

      results.forEach((result, index) => {
        if (result.status !== 'fulfilled') return;
        const runStatus = result.value?.data?.run?.status;
        if (!runStatus || !TERMINAL_RUN_STATUSES.has(runStatus)) return;

        const task = activeTasks[index];
        dispatch(completeTask({
          id: task.id,
          episodeId: task.episodeId,
          status: runStatus === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
          errorMessage: result.value?.data?.run?.errorMessage,
        }));
      });
    };

    void reconcileTerminalRuns();
    const timer = window.setInterval(reconcileTerminalRuns, STATUS_POLL_INTERVAL_MS);
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [activeTasks, dispatch]);

  // Tick for live elapsed seconds counter
  useEffect(() => {
    if (activeTasks.length === 0) return;

    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [activeTasks.length]);

  const isOverloaded = activeTasks.length >= 3;
  const isHardLimit = activeTasks.length >= 5;

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

  const handleOpenTask = (task: IAiRegimenTask) => {
    const pathname = task.recommendationScope === 'ANTIBIOTIC'
      ? '/antibiotic-planner'
      : '/';
    const search = new URLSearchParams({
      episodeId: String(task.episodeId),
      runId: task.id,
    });
    navigate(`${pathname}?${search.toString()}`);
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
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${
              activeTasks.length > 0
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            <RobotOutlined
              className={`text-sm ${
                activeTasks.length > 0 ? 'animate-pulse text-emerald-600' : ''
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
            Hàng đợi đang điều phối xử lý lần lượt theo thứ tự.
          </div>
        </div>
      ) : null}

      {/* IDLE STATE: No running tasks */}
      {activeTasks.length === 0 && (
        <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-2.5 text-slate-500 mt-1">
          <SyncOutlined className="text-xs text-slate-400" />
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-600">Chưa có luồng nào đang chạy</span>
            <span className="text-[10px] text-slate-400">Khi bạn nhấn "Sinh phác đồ", tiến trình sẽ hiển thị tại đây</span>
          </div>
        </div>
      )}

      {/* ACTIVE TASKS LIST */}
      {activeTasks.length > 0 && (
        <div className="mt-1 flex max-h-56 flex-col gap-1.5 overflow-y-auto overscroll-contain pr-0.5">
          {activeTasks.map((task) => {
            const isCancelling = Boolean(cancellingIds[task.id]);
            return (
              <div
                key={task.id}
                role="button"
                tabIndex={0}
                onClick={() => handleOpenTask(task)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleOpenTask(task);
                  }
                }}
                aria-label={`Mở tiến trình sinh phác đồ của ${task.patientName}`}
                className="relative flex cursor-pointer flex-col gap-1 rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5 shadow-xs transition-all hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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
                    <Tooltip title="Huỷ">
                      <button
                        type="button"
                        onClick={(e) => handleCancelTask(e, task)}
                        disabled={isCancelling}
                        className="flex h-4 w-4 items-center justify-center rounded text-slate-400 opacity-60 hover:bg-slate-200 hover:text-red-600 hover:opacity-100 transition-colors"
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
                    {task.stage ? `[${task.stage}]` : 'Đang phân tích'}
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
        </div>
      )}
    </div>
  );
};

export default CurrentCaseAndAiMonitor;
