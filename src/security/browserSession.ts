const LEGACY_SENSITIVE_STORAGE_KEYS = [
  'access_token',
  'pending_pji_aiRunId',
  'pending_pji_thoughtLogs',
  'pji_aiRunDetail',
  'pji_aiRunId',
  'pji_clinicForm',
  'pji_currentCase',
  'pji_currentStep',
  'pji_diagnosticResult',
  'pji_selectedExamId',
  'pji_selectedPatientId',
] as const;

export const clearLegacySensitiveBrowserStorage = (): void => {
  if (typeof window === 'undefined') return;

  for (const key of LEGACY_SENSITIVE_STORAGE_KEYS) {
    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch {
      // Storage may be unavailable in hardened/private browser contexts.
    }
  }
};
