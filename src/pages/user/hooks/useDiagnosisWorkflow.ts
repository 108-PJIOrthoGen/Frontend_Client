import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { useLocation } from 'react-router-dom';
import { callFetchEpisodeById } from '@/apis/api';
import { useAppDispatch, useAppSelector } from '@/redux/hook';
import { clearCurrentCase, setCurrentCase } from '@/redux/features/patients/patientSlice';

const FIRST_STEP = 0;
const TREATMENT_PLAN_STEP = 2;
const CURRENT_STEP_STORAGE_KEY = 'pji_currentStep';

const initialStepFromLocation = (search: string): number => {
  if (new URLSearchParams(search).get('runId')) {
    return TREATMENT_PLAN_STEP;
  }

  const savedStep = localStorage.getItem(CURRENT_STEP_STORAGE_KEY);
  return savedStep ? parseInt(savedStep, 10) : FIRST_STEP;
};

export const useDiagnosisWorkflow = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const currentCase = useAppSelector(state => state.patient.currentCase);
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const [currentStep, setCurrentStep] = useState(
    () => initialStepFromLocation(window.location.search),
  );
  const [autoOpenSearch, setAutoOpenSearch] = useState(false);

  useEffect(() => {
    if (searchParams.get('runId')) {
      setCurrentStep(TREATMENT_PLAN_STEP);
    }
  }, [searchParams]);

  useEffect(() => {
    const episodeIdParam = searchParams.get('episodeId');
    if (!episodeIdParam) return;

    const episodeId = Number(episodeIdParam);
    if (!Number.isFinite(episodeId)) return;
    if (
      currentCase?.episode?.id != null
      && Number(currentCase.episode.id) === episodeId
    ) {
      return;
    }

    let cancelled = false;

    const loadEpisodeCase = async () => {
      try {
        const response: any = await callFetchEpisodeById(String(episodeId));
        if (cancelled) return;

        const episode = response?.data?.data ?? response?.data;
        const patient = episode?.patient;
        if (episode && patient) {
          dispatch(setCurrentCase({ patient, episode }));
          return;
        }

        console.warn(
          'Notification deep-link: episode response missing nested patient',
          episode,
        );
      } catch (error) {
        console.warn('Failed to load episode for notification deep-link', error);
      }
    };

    void loadEpisodeCase();
    return () => {
      cancelled = true;
    };
  }, [currentCase?.episode?.id, dispatch, searchParams]);

  useEffect(() => {
    localStorage.setItem(CURRENT_STEP_STORAGE_KEY, currentStep.toString());
  }, [currentStep]);

  const next = useCallback(() => {
    setCurrentStep(previousStep => previousStep + 1);
  }, []);

  const prev = useCallback(() => {
    setCurrentStep(previousStep => {
      if (previousStep <= FIRST_STEP) return previousStep;
      const nextStep = previousStep - 1;
      if (nextStep === FIRST_STEP) {
        dispatch(clearCurrentCase());
      }
      return nextStep;
    });
  }, [dispatch]);

  const backToFirstStep = useCallback(() => {
    dispatch(clearCurrentCase());
    setCurrentStep(FIRST_STEP);
  }, [dispatch]);

  const exitCurrentCase = useCallback(() => {
    backToFirstStep();
    message.success('Đã thoát ca bệnh. Bạn có thể chọn bệnh nhân khác.');
  }, [backToFirstStep]);

  const changePatient = useCallback(() => {
    backToFirstStep();
    setAutoOpenSearch(true);
  }, [backToFirstStep]);

  const selectStep = useCallback((targetStep: number) => {
    if (targetStep === currentStep) return;
    if (targetStep === FIRST_STEP) {
      backToFirstStep();
      return;
    }
    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
    }
  }, [backToFirstStep, currentStep]);

  const consumeAutoOpenSearch = useCallback(() => {
    setAutoOpenSearch(false);
  }, []);

  return {
    autoOpenSearch,
    backToFirstStep,
    changePatient,
    consumeAutoOpenSearch,
    currentCase,
    currentStep,
    exitCurrentCase,
    next,
    prev,
    selectStep,
  };
};
