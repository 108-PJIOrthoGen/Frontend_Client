import {
  CloseCircleFilled,
  FilterOutlined,
  FolderOpenOutlined,
  HistoryOutlined,
  LoadingOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { callFetchEpisodes, callFetchPatient } from '@/apis/api';
import type { IEpisode, IPatient } from '@/types/backend';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  buildGlobalSearchQuery,
  EMPTY_GLOBAL_SEARCH_FILTERS,
  hasActiveGlobalSearchFilters,
  type GlobalSearchFilters,
  type GlobalSearchKind,
  type UpdatedWithin,
} from './globalMedicalSearch';
import './GlobalMedicalSearch.css';

const RECENT_SEARCH_STORAGE_KEY = 'pji_global_medical_search_recent_v1';
const MAX_RECENT_ITEMS = 8;

interface SearchResultItem {
  kind: GlobalSearchKind;
  id: string;
  patientId: string;
  code: string;
  title: string;
  metadata: string;
  updatedAt?: string;
}

const UPDATED_OPTIONS: Array<{ value: UpdatedWithin; label: string }> = [
  { value: 'any', label: 'Mọi lúc' },
  { value: 'today', label: 'Hôm nay' },
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '365d', label: '1 năm' },
];

const EPISODE_STATUSES = [
  { value: 'processing', label: 'Đang điều trị' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const PATIENT_GENDERS = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
];

const readRecentItems = (): SearchResultItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(RECENT_SEARCH_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_ITEMS) : [];
  } catch {
    return [];
  }
};

const episodeToResult = (episode: IEpisode): SearchResultItem | null => {
  if (!episode.id || !episode.patient?.id) return null;
  const admissionDate = episode.admissionDate
    ? dayjs(episode.admissionDate).format('DD/MM/YYYY')
    : 'Chưa có ngày vào viện';
  const details = [
    episode.patient.patientCode ? `Mã BN ${episode.patient.patientCode}` : null,
    admissionDate,
    episode.department || null,
  ].filter(Boolean).join(' · ');

  return {
    kind: 'episode',
    id: String(episode.id),
    patientId: String(episode.patient.id),
    code: episode.medicalRecordCode || `BA #${episode.id}`,
    title: episode.patient.fullName || 'Bệnh nhân chưa có tên',
    metadata: details,
    updatedAt: episode.updatedAt,
  };
};

const patientToResult = (patient: IPatient): SearchResultItem | null => {
  if (!patient.id) return null;
  const details = [
    patient.dateOfBirth ? `Sinh ${dayjs(patient.dateOfBirth).format('DD/MM/YYYY')}` : null,
    patient.phone ? `SĐT ${patient.phone}` : null,
  ].filter(Boolean).join(' · ');

  return {
    kind: 'patient',
    id: String(patient.id),
    patientId: String(patient.id),
    code: patient.patientCode || `BN #${patient.id}`,
    title: patient.fullName || 'Bệnh nhân chưa có tên',
    metadata: details || 'Chưa có thông tin bổ sung',
    updatedAt: patient.updatedAt,
  };
};

const toggleValue = (values: string[], value: string): string[] => (
  values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value]
);

const GlobalMedicalSearch = () => {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const requestSequenceRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<GlobalSearchKind>('episode');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<GlobalSearchFilters>(() => ({
    ...EMPTY_GLOBAL_SEARCH_FILTERS,
  }));
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [recentItems, setRecentItems] = useState<SearchResultItem[]>(readRecentItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const hasContextualFilters = kind === 'episode'
    ? filters.updatedWithin !== 'any' || filters.statuses.length > 0 || !!filters.department.trim()
    : filters.updatedWithin !== 'any' || filters.genders.length > 0;
  const isSearching = !!query.trim() || hasContextualFilters;

  const visibleItems = useMemo(() => (
    isSearching
      ? results
      : recentItems.filter((item) => item.kind === kind)
  ), [isSearching, kind, recentItems, results]);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const openFromShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
        window.requestAnimationFrame(() => inputRef.current?.focus());
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    window.addEventListener('keydown', openFromShortcut);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      window.removeEventListener('keydown', openFromShortcut);
    };
  }, []);

  useEffect(() => {
    if (!open || !isSearching) {
      setLoading(false);
      setError('');
      setResults([]);
      return;
    }

    const sequence = ++requestSequenceRef.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const requestQuery = buildGlobalSearchQuery(kind, query, filters);
        const response = kind === 'episode'
          ? await callFetchEpisodes(requestQuery)
          : await callFetchPatient(requestQuery);
        if (sequence !== requestSequenceRef.current) return;

        const rawItems = response?.data?.result || [];
        const mapped = kind === 'episode'
          ? (rawItems as IEpisode[]).map(episodeToResult)
          : (rawItems as IPatient[]).map(patientToResult);
        setResults(mapped.filter((item): item is SearchResultItem => item !== null));
        setActiveIndex(0);
      } catch {
        if (sequence === requestSequenceRef.current) {
          setResults([]);
          setError('Không thể tải kết quả. Vui lòng thử lại.');
        }
      } finally {
        if (sequence === requestSequenceRef.current) setLoading(false);
      }
    }, 280);

    return () => window.clearTimeout(timer);
  }, [filters, isSearching, kind, open, query]);

  const persistRecent = (item: SearchResultItem) => {
    const next = [
      item,
      ...recentItems.filter((recent) => !(recent.kind === item.kind && recent.id === item.id)),
    ].slice(0, MAX_RECENT_ITEMS);
    setRecentItems(next);
    try {
      window.sessionStorage.setItem(RECENT_SEARCH_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Search remains fully usable when browser storage is unavailable.
    }
  };

  const openResult = (item: SearchResultItem) => {
    persistRecent(item);
    const params = new URLSearchParams({
      patientId: item.patientId,
      view: item.kind,
    });
    if (item.kind === 'episode') params.set('episodeId', item.id);
    navigate(`/table-patients?${params.toString()}`);
    setOpen(false);
  };

  const selectKind = (nextKind: GlobalSearchKind) => {
    setKind(nextKind);
    setFilters({ ...EMPTY_GLOBAL_SEARCH_FILTERS });
    setResults([]);
    setError('');
    setActiveIndex(0);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const resetFilters = () => setFilters({ ...EMPTY_GLOBAL_SEARCH_FILTERS });

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (event.key === 'ArrowDown' && visibleItems.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, visibleItems.length - 1));
    } else if (event.key === 'ArrowUp' && visibleItems.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && visibleItems[activeIndex]) {
      event.preventDefault();
      openResult(visibleItems[activeIndex]);
    }
  };

  return (
    <div className="global-medical-search" ref={rootRef} data-tour="global-medical-search">
      <div
        className={`global-search-input-shell ${open ? 'is-open' : ''}`}
        onClick={() => inputRef.current?.focus()}
      >
        {loading ? <LoadingOutlined spin aria-label="Đang tìm kiếm" /> : <SearchOutlined />}
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleInputKeyDown}
          aria-label="Tìm kiếm bệnh án hoặc bệnh nhân"
          aria-expanded={open}
          aria-controls="global-medical-search-panel"
          placeholder={kind === 'episode'
            ? 'Tìm mã hồ sơ, mã BN, họ tên, CCCD hoặc khoa…'
            : 'Tìm mã BN, họ tên, CCCD hoặc số điện thoại…'}
        />
        {query ? (
          <button
            type="button"
            className="global-search-clear"
            aria-label="Xóa nội dung tìm kiếm"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
          >
            <CloseCircleFilled />
          </button>
        ) : (
          <span className="global-search-shortcut" aria-hidden="true">⌘ K</span>
        )}
      </div>

      {open ? (
        <section id="global-medical-search-panel" className="global-search-panel" aria-label="Kết quả tìm kiếm toàn cục">
          <div className="global-search-tabs" role="tablist" aria-label="Loại hồ sơ">
            <button
              type="button"
              role="tab"
              aria-selected={kind === 'episode'}
              className={kind === 'episode' ? 'is-active' : ''}
              onClick={() => selectKind('episode')}
            >
              Bệnh án
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={kind === 'patient'}
              className={kind === 'patient' ? 'is-active' : ''}
              onClick={() => selectKind('patient')}
            >
              Bệnh nhân
            </button>
          </div>

          <div className="global-search-body">
            <div className="global-search-results" role="listbox" aria-label={isSearching ? 'Kết quả tìm kiếm' : 'Xem gần đây'}>
              <div className="global-search-section-title">
                <span>{isSearching ? 'Kết quả tìm kiếm' : 'Xem gần đây'}</span>
                {isSearching && !loading ? <span>{visibleItems.length} kết quả</span> : null}
              </div>

              {loading ? (
                <div className="global-search-state"><LoadingOutlined spin /><span>Đang tìm hồ sơ phù hợp…</span></div>
              ) : error ? (
                <div className="global-search-state is-error">{error}</div>
              ) : visibleItems.length === 0 ? (
                <div className="global-search-state">
                  {isSearching ? <SearchOutlined /> : <HistoryOutlined />}
                  <span>{isSearching ? 'Không tìm thấy hồ sơ phù hợp.' : 'Chưa có hồ sơ xem gần đây trong phiên này.'}</span>
                </div>
              ) : (
                <div className="global-search-result-list">
                  {visibleItems.map((item, index) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === activeIndex}
                      key={`${item.kind}-${item.id}`}
                      className={`global-search-result ${index === activeIndex ? 'is-active' : ''}`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => openResult(item)}
                    >
                      <span className={`global-search-result-icon is-${item.kind}`}>
                        {item.kind === 'episode' ? <FolderOpenOutlined /> : <UserOutlined />}
                      </span>
                      <span className="global-search-result-copy">
                        <span className="global-search-result-title">
                          <strong>{item.code}</strong>
                          <span>{item.title}</span>
                        </span>
                        <span className="global-search-result-meta">{item.metadata}</span>
                      </span>
                      {item.updatedAt ? (
                        <span className="global-search-result-date">{dayjs(item.updatedAt).format('DD/MM/YY')}</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <aside className="global-search-filters" aria-label="Bộ lọc tìm kiếm">
              <div className="global-search-filter-heading">
                <span><FilterOutlined /> Bộ lọc</span>
                {hasActiveGlobalSearchFilters(filters) ? (
                  <button type="button" onClick={resetFilters}>Xóa lọc</button>
                ) : null}
              </div>

              <fieldset>
                <legend>Cập nhật gần nhất</legend>
                <div className="global-search-time-options">
                  {UPDATED_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={filters.updatedWithin === option.value ? 'is-active' : ''}
                      onClick={() => setFilters((current) => ({ ...current, updatedWithin: option.value }))}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              {kind === 'episode' ? (
                <>
                  <fieldset>
                    <legend>Lọc theo trạng thái</legend>
                    <div className="global-search-checks">
                      {EPISODE_STATUSES.map((status) => (
                        <label key={status.value}>
                          <input
                            type="checkbox"
                            checked={filters.statuses.includes(status.value)}
                            onChange={() => setFilters((current) => ({
                              ...current,
                              statuses: toggleValue(current.statuses, status.value),
                            }))}
                          />
                          <span>{status.label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset>
                    <legend>Lọc theo khoa</legend>
                    <input
                      className="global-search-filter-input"
                      value={filters.department}
                      onChange={(event) => setFilters((current) => ({
                        ...current,
                        department: event.target.value,
                      }))}
                      placeholder="Nhập tên khoa"
                    />
                  </fieldset>
                </>
              ) : (
                <fieldset>
                  <legend>Lọc theo giới tính</legend>
                  <div className="global-search-checks is-two-columns">
                    {PATIENT_GENDERS.map((gender) => (
                      <label key={gender.value}>
                        <input
                          type="checkbox"
                          checked={filters.genders.includes(gender.value)}
                          onChange={() => setFilters((current) => ({
                            ...current,
                            genders: toggleValue(current.genders, gender.value),
                          }))}
                        />
                        <span>{gender.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
            </aside>
          </div>

          <footer className="global-search-footer">
            <span><kbd>↑</kbd><kbd>↓</kbd> chọn</span>
            <span><kbd>Enter</kbd> mở hồ sơ</span>
            <span><kbd>Esc</kbd> đóng</span>
          </footer>
        </section>
      ) : null}
    </div>
  );
};

export default GlobalMedicalSearch;
