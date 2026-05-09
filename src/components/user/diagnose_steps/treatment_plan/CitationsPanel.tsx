import React from 'react';
import type { CitationData } from '@/types/treatmentType';

interface Props {
  citations: CitationData[];
}

const CitationsPanel: React.FC<Props> = ({ citations }) => {
  return (
    <div className="flex-[1] min-w-[380px] max-w-[450px] flex flex-col h-full">
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-700 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative h-full">
        {/* Decorative dark bg */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none"></div>

        <div className="p-5 border-b border-white/10 flex items-center justify-between relative z-10 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <span className="material-symbols-outlined text-[18px]">library_books</span>
            </div>
            <h3 className="font-bold text-indigo-50 text-sm tracking-wide">Cơ Sở Bằng Chứng</h3>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(99,102,241,0.2)]">
            AI RAG
          </span>
        </div>

        <div className="flex-1 p-5 space-y-4 overflow-y-auto custom-scrollbar relative z-10">
          {citations.length > 0 ? (
            citations.map((citation, idx) => (
              <article
                key={citation.sourceUri || idx}
                className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md hover:bg-white/10 transition-colors group"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300">
                    {citation.sourceType}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px] text-emerald-400">radar</span>
                    <span className="text-[10px] text-emerald-400/80 font-mono">
                      {(citation.relevanceScore * 100).toFixed(0)}% Match
                    </span>
                  </div>
                </div>
                <h4 className="text-sm font-bold text-slate-200 mb-2 leading-tight group-hover:text-white transition-colors">
                  {citation.sourceTitle}
                </h4>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500/50 rounded-full"></div>
                  <p className="text-xs text-slate-400 italic pl-3 leading-relaxed mb-3">
                    "{citation.snippet}"
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
                  <p className="text-[11px] text-slate-300">
                    <span className="text-slate-500 font-semibold mr-1 uppercase text-[10px] tracking-wider">
                      Trích dẫn cho:
                    </span>{' '}
                    {citation.citedFor}
                  </p>
                  <a
                    href={citation.sourceUri}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 hover:underline w-max"
                  >
                    Xem tài liệu gốc <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                  </a>
                </div>
              </article>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full opacity-50">
              <span className="material-symbols-outlined text-4xl mb-2 text-slate-500">search_off</span>
              <p className="text-sm text-slate-500 font-medium">Không tìm thấy tài liệu dẫn chứng</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CitationsPanel;
