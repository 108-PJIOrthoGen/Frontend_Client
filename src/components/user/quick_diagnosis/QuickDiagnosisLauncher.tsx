import { lazy, Suspense, useState } from 'react';
import { Button, Modal, Skeleton, Tabs, Tag, Typography } from 'antd';
import {
  ArrowRightOutlined,
  CalculatorOutlined,
  ExperimentOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

const { Paragraph, Text, Title } = Typography;

type QuickTool = 'diagnosis' | 'risk';

const PjiDiagnosisCalculator = lazy(() => (
  import('./PjiDiagnosisCalculator').then(module => ({
    default: module.PjiDiagnosisCalculator,
  }))
));
const PjiRiskCalculator = lazy(() => (
  import('./PjiRiskCalculator').then(module => ({
    default: module.PjiRiskCalculator,
  }))
));

const loadingFallback = (
  <div className="py-4">
    <Skeleton active paragraph={{ rows: 8 }} />
  </div>
);

export const QuickDiagnosisLauncher = () => {
  const [open, setOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<QuickTool>('diagnosis');

  const launch = (tool: QuickTool) => {
    setActiveTool(tool);
    setOpen(true);
  };

  return (
    <>
      <main className="flex h-full min-h-0 flex-col overflow-y-auto bg-slate-50">
        <section
          data-testid="quick-diagnosis-launcher"
          className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 px-5 py-6 md:px-8"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-xl text-white shadow-sm">
              <ThunderboltOutlined />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Title level={4} className="!mb-0 !mt-0">
                  Chẩn đoán nhanh theo ICM
                </Title>
                <Tag color="green">Không cần tạo bệnh án</Tag>
              </div>
              <Paragraph type="secondary" className="!mb-0 !mt-1 max-w-2xl">
                Nhập trực tiếp tiêu chí lâm sàng để chẩn đoán PJI hoặc ước tính nguy cơ trước mổ.
                Kết quả không được lưu vào hồ sơ bệnh nhân.
              </Paragraph>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              size="large"
              icon={<ExperimentOutlined />}
              onClick={() => launch('diagnosis')}
            >
              Chẩn đoán PJI (PJIDx)
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<CalculatorOutlined />}
              onClick={() => launch('risk')}
            >
              Ước tính PJI Risk
              <ArrowRightOutlined />
            </Button>
          </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8">
          <div className="max-w-2xl">
            <Title level={3} className="!mb-2 !mt-0 !text-slate-900">Bộ công cụ lâm sàng tức thời</Title>
            <Paragraph className="!mb-0 text-slate-600">
              Chọn một công cụ phía trên để đánh giá nhanh mà không thay đổi hồ sơ hay tiến trình điều trị đang làm việc.
            </Paragraph>
          </div>
        </section>
      </main>

      <Modal
        centered
        destroyOnHidden
        footer={null}
        open={open}
        onCancel={() => setOpen(false)}
        title={(
          <div>
            <Text strong className="text-base">Bộ công cụ PJI nhanh</Text>
            <Text type="secondary" className="ml-2 text-xs">
              Không tạo bệnh nhân · Không lưu bệnh án
            </Text>
          </div>
        )}
        width="min(1180px, calc(100vw - 24px))"
        styles={{
          body: {
            maxHeight: 'calc(100vh - 150px)',
            overflowY: 'auto',
            paddingTop: 4,
          },
        }}
      >
        <Tabs
          activeKey={activeTool}
          onChange={key => setActiveTool(key as QuickTool)}
          items={[
            {
              key: 'diagnosis',
              label: (
                <span>
                  <ExperimentOutlined />
                  PJIDx — Chẩn đoán
                </span>
              ),
              children: (
                <Suspense fallback={loadingFallback}>
                  <PjiDiagnosisCalculator />
                </Suspense>
              ),
            },
            {
              key: 'risk',
              label: (
                <span>
                  <CalculatorOutlined />
                  PJI Risk — Nguy cơ
                </span>
              ),
              children: (
                <Suspense fallback={loadingFallback}>
                  <PjiRiskCalculator />
                </Suspense>
              ),
            },
          ]}
        />
      </Modal>
    </>
  );
};
