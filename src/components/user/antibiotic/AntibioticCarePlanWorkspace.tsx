import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Empty,
  Input,
  Skeleton,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ExperimentOutlined,
  FileSearchOutlined,
  MedicineBoxOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { sfLike, sfOr } from 'spring-filter-query-builder';
import {
  callFetchClinicalDecisionWorkspace,
  callFetchEpisodesByPatient,
  callFetchPatient,
  callGenerateAntibioticCarePlan,
} from '@/apis/api';
import type {
  IAntibioticCarePlanGeneration,
  IClinicalDecisionWorkspace,
  IEpisode,
  IPatient,
} from '@/types/backend';
import type { AntibioticCarePlanData } from '@/types/treatmentType';
import { parseItemJson } from '@/components/user/diagnose_steps/treatment_plan/utils/itemJson';
import AntibioticCarePlanPanel from './AntibioticCarePlanPanel';

const { Text, Title } = Typography;

interface Props {
  onBack: () => void;
}

const isAntibioticRun = (scope?: string) => (
  scope === 'ANTIBIOTIC' || scope === 'LEGACY_COMBINED'
);

const signedSourceRun = (workspace?: IClinicalDecisionWorkspace) => {
  const antibioticRuns = (workspace?.runs ?? []).filter((item) => isAntibioticRun(item.run.recommendationScope));
  return antibioticRuns.find((item) => item.finalSelection && item.pharmacistDecision?.status === 'SIGNED')
    ?? antibioticRuns.find((item) => item.pharmacistDecision?.status === 'SIGNED');
};

const episodeLabel = (episode: IEpisode) => episode.reason || episode.department || 'Bệnh án PJI';

const AntibioticCarePlanWorkspace: React.FC<Props> = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<IPatient[]>([]);
  const [patientLoading, setPatientLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<IPatient>();
  const [episodes, setEpisodes] = useState<IEpisode[]>([]);
  const [episodeLoading, setEpisodeLoading] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<IEpisode>();
  const [workspace, setWorkspace] = useState<IClinicalDecisionWorkspace>();
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [generation, setGeneration] = useState<IAntibioticCarePlanGeneration>();
  const [generating, setGenerating] = useState(false);
  const [generationSeconds, setGenerationSeconds] = useState(0);
  const requestSequence = useRef(0);
  const episodeSequence = useRef(0);
  const workspaceSequence = useRef(0);
  const generationSequence = useRef(0);

  useEffect(() => {
    const term = query.trim();
    const sequence = ++requestSequence.current;
    if (term.length < 2) {
      setPatients([]);
      setPatientLoading(false);
      return undefined;
    }

    setPatientLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const filter = sfOr([
          sfLike('patientCode', term),
          sfLike('fullName', term, true),
          sfLike('identityCard', term),
        ]);
        const response = await callFetchPatient(`page=0&size=20&filter=${filter}`);
        if (sequence === requestSequence.current) setPatients(response.data?.result ?? []);
      } catch {
        if (sequence === requestSequence.current) setPatients([]);
      } finally {
        if (sequence === requestSequence.current) setPatientLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!generating) return undefined;
    setGenerationSeconds(0);
    const timer = window.setInterval(() => setGenerationSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [generating]);

  const selectPatient = async (patient: IPatient) => {
    if (!patient.id) return;
    const sequence = ++episodeSequence.current;
    workspaceSequence.current += 1;
    generationSequence.current += 1;
    setGenerating(false);
    setSelectedPatient(patient);
    setSelectedEpisode(undefined);
    setWorkspace(undefined);
    setGeneration(undefined);
    setEpisodeLoading(true);
    try {
      const response = await callFetchEpisodesByPatient(
        String(patient.id),
        'page=0&size=30&sort=createdAt,desc',
      );
      if (sequence === episodeSequence.current) setEpisodes(response.data?.result ?? []);
    } catch {
      if (sequence === episodeSequence.current) {
        setEpisodes([]);
        message.error('Không thể tải danh sách bệnh án.');
      }
    } finally {
      if (sequence === episodeSequence.current) setEpisodeLoading(false);
    }
  };

  const selectEpisode = async (episode: IEpisode) => {
    if (!episode.id) return;
    const sequence = ++workspaceSequence.current;
    generationSequence.current += 1;
    setGenerating(false);
    setSelectedEpisode(episode);
    setGeneration(undefined);
    setWorkspace(undefined);
    setWorkspaceLoading(true);
    try {
      const response = await callFetchClinicalDecisionWorkspace(String(episode.id));
      if (sequence === workspaceSequence.current) setWorkspace(response.data);
    } catch {
      if (sequence === workspaceSequence.current) {
        message.error('Không thể kiểm tra phác đồ dược sĩ của bệnh án.');
      }
    } finally {
      if (sequence === workspaceSequence.current) setWorkspaceLoading(false);
    }
  };

  const sourceRun = useMemo(() => signedSourceRun(workspace), [workspace]);
  const plan = useMemo(() => (
    generation?.carePlan
      ? parseItemJson({ itemJson: generation.carePlan }) as AntibioticCarePlanData
      : undefined
  ), [generation]);

  const generate = async () => {
    if (!selectedEpisode?.id || !sourceRun) return;
    const sequence = ++generationSequence.current;
    setGenerating(true);
    setGeneration(undefined);
    try {
      const response = await callGenerateAntibioticCarePlan(String(selectedEpisode.id));
      if (!response.data?.carePlan) throw new Error('AI không trả về kế hoạch chăm sóc.');
      if (sequence === generationSequence.current) {
        setGeneration(response.data);
        message.success('Đã sinh kế hoạch chăm sóc kháng sinh.');
      }
    } catch (error: any) {
      if (sequence === generationSequence.current) {
        message.error(error?.message || error?.error || 'Không thể sinh kế hoạch chăm sóc kháng sinh.');
      }
    } finally {
      if (sequence === generationSequence.current) setGenerating(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 bg-white">
      <aside className="flex w-[292px] shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-4">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} className="mb-3 px-0">
            Workspace dược sĩ
          </Button>
          <Title level={5} style={{ margin: 0 }}>Danh sách bệnh án</Title>
          <Input
            allowClear
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            prefix={<SearchOutlined className="text-slate-400" />}
            placeholder="Tên, mã BN hoặc CCCD"
            className="mt-3"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="border-b border-slate-100 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
            Bệnh nhân
          </div>
          {patientLoading ? <div className="p-4"><Skeleton active paragraph={{ rows: 3 }} title={false} /></div> : null}
          {!patientLoading && query.trim().length < 2 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">Nhập ít nhất 2 ký tự để tìm bệnh nhân</div>
          ) : null}
          {!patientLoading && query.trim().length >= 2 && patients.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không tìm thấy bệnh nhân" className="py-6" />
          ) : null}
          {patients.map((patient) => (
            <button
              type="button"
              key={patient.id}
              onClick={() => void selectPatient(patient)}
              className={`w-full border-b border-slate-100 px-4 py-3 text-left transition-colors ${
                selectedPatient?.id === patient.id ? 'bg-blue-50' : 'hover:bg-slate-50'
              }`}
            >
              <div className="font-semibold text-slate-800">{patient.fullName || 'Chưa có tên'}</div>
              <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500">
                <span>{patient.patientCode || 'Chưa có mã'}</span>
                {selectedPatient?.id === patient.id ? <Tag color="blue" className="m-0">Đã chọn</Tag> : null}
              </div>
            </button>
          ))}

          {selectedPatient ? (
            <>
              <div className="border-y border-slate-100 bg-slate-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                Bệnh án của {selectedPatient.fullName}
              </div>
              {episodeLoading ? <div className="grid place-items-center p-5"><Spin size="small" /></div> : null}
              {!episodeLoading && episodes.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-400">Bệnh nhân chưa có bệnh án</div>
              ) : null}
              {episodes.map((episode) => (
                <button
                  type="button"
                  key={episode.id}
                  onClick={() => void selectEpisode(episode)}
                  className={`w-full border-b border-slate-100 px-4 py-3 text-left transition-colors ${
                    selectedEpisode?.id === episode.id ? 'bg-emerald-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-slate-800">Bệnh án #{episode.id}</span>
                    <Tag color={episode.status === 'completed' ? 'green' : 'gold'} className="m-0 text-[10px]">
                      {episode.status === 'completed' ? 'Hoàn tất' : 'Đang điều trị'}
                    </Tag>
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs text-slate-500">{episodeLabel(episode)}</div>
                  {episode.admissionDate ? (
                    <div className="mt-1 text-[11px] text-slate-400">{dayjs(episode.admissionDate).format('DD/MM/YYYY')}</div>
                  ) : null}
                </button>
              ))}
            </>
          ) : null}
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto bg-slate-50">
        <header className="sticky top-0 z-10 flex min-h-[64px] items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3">
          <div className="min-w-0">
            <Text type="secondary">{selectedEpisode ? 'Kế hoạch chăm sóc kháng sinh' : 'Chọn bệnh án để bắt đầu'}</Text>
            {selectedEpisode ? (
              <div className="truncate text-base font-semibold text-slate-900">
                {selectedPatient?.fullName} · Bệnh án #{selectedEpisode.id}
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {sourceRun ? <Tag color="blue">Phác đồ nguồn #{sourceRun.run.runNo ?? sourceRun.run.id}</Tag> : null}
            {generation ? <Tag color="gold">Kế hoạch AI chưa lưu</Tag> : null}
            <Button
              type="primary"
              icon={<ExperimentOutlined />}
              disabled={!selectedEpisode || workspaceLoading || !sourceRun}
              loading={generating}
              onClick={() => void generate()}
            >
              {generation ? 'Chạy lại AI' : 'Chạy AI tạo kế hoạch'}
            </Button>
          </div>
        </header>

        <div className="mx-auto max-w-[1540px] p-5 lg:p-6">
          {!selectedEpisode ? (
            <div className="grid min-h-[560px] place-items-center">
              <Empty
                image={<FileSearchOutlined style={{ fontSize: 68, color: '#94a3b8' }} />}
                description="Tìm bệnh nhân và chọn bệnh án ở cột bên trái"
              />
            </div>
          ) : workspaceLoading ? (
            <div className="space-y-4"><Skeleton active /><Skeleton active /></div>
          ) : !sourceRun ? (
            <Alert
              showIcon
              type="warning"
              message="Chưa có phác đồ dược sĩ đã ký"
              description="Hãy hoàn tất và ký quyết định kháng sinh trước khi sinh kế hoạch chăm sóc."
            />
          ) : generating ? (
            <div className="grid min-h-[560px] place-items-center rounded-xl border border-slate-200 bg-white">
              <div className="max-w-md text-center">
                <Spin size="large" />
                <Title level={4} style={{ marginTop: 20 }}>AI đang xây dựng lộ trình chăm sóc</Title>
                <Text type="secondary">
                  Đang đối chiếu phác đồ phiên bản #{sourceRun.run.runNo ?? sourceRun.run.id}, dữ liệu thận,
                  TDM, tương tác và lịch xét nghiệm · {generationSeconds}s
                </Text>
              </div>
            </div>
          ) : plan ? (
            <AntibioticCarePlanPanel
              plan={plan}
              patientName={selectedPatient?.fullName}
              patientCode={selectedPatient?.patientCode}
              episodeId={selectedEpisode.id}
            />
          ) : (
            <div className="space-y-4">
              <Alert
                showIcon
                type="info"
                icon={<MedicineBoxOutlined />}
                message="Sẵn sàng sinh kế hoạch chăm sóc"
                description={`AI sẽ dùng phác đồ dược sĩ đã ký phiên bản #${sourceRun.run.runNo ?? sourceRun.run.id}. Kết quả chỉ hiển thị trong workspace này và không được lưu vào bệnh án.`}
              />
              <div className="grid min-h-[460px] place-items-center rounded-xl border border-dashed border-slate-300 bg-white">
                <div className="text-center">
                  <CalendarOutlined className="text-5xl text-sky-500" />
                  <Title level={4} style={{ margin: '16px 0 6px' }}>Tạo timeline điều trị ba giai đoạn</Title>
                  <Text type="secondary">Nội trú · OPAT/chuyển uống · Giám sát dài hạn</Text>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AntibioticCarePlanWorkspace;
