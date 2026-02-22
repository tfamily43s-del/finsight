
import React, { useState, useMemo, useContext } from 'react';
import { Info, PieChart, TrendingUp, Gauge, ShieldAlert, Activity, ArrowUpRight, Share2, Building2, Factory, User2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../App';
import { useTranslation } from '../translations';
import { CyclePhase, DetailedImpact, BusinessSource, RelatedCompany, BacktestResult } from '../types';

export const IndicatorTooltip = ({ text }: { text: string }) => {
// ... (existing code)
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <button 
        onMouseEnter={() => setShow(true)} 
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="p-1 text-slate-500 hover:text-blue-400 transition-colors focus:outline-none"
      >
        <Info size={14} />
      </button>
      <div className={`absolute z-[110] bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] text-[11px] text-slate-200 font-bold leading-relaxed transition-all duration-300 origin-bottom ${show ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-4 pointer-events-none'}`}>
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
      </div>
    </div>
  );
};

export const CycleIndicator: React.FC<{ phase?: CyclePhase }> = ({ phase }) => {
  const { lang } = useContext(LanguageContext);
  const t = useTranslation(lang);
  
  const phases = useMemo(() => [
    { id: 'Trough', label: t('cycle_trough'), color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/30' },
    { id: 'Expansion', label: t('cycle_expansion'), color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-500/30' },
    { id: 'Peak', label: t('cycle_peak'), color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-500/30' },
    { id: 'Contraction', label: t('cycle_contraction'), color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-500/30' }
  ], [t]);

  const active = phases.find(p => p.id === phase) || phases[0];

  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border ${active.border} ${active.bg} transition-all`}>
      <div className="relative w-12 h-12 flex items-center justify-center will-change-transform">
        <PieChart size={32} className={`${active.color} animate-pulse`} />
        <div className="absolute inset-0 border-2 border-dashed border-white/10 rounded-full animate-[spin_15s_linear_infinite]" />
      </div>
      <div>
        <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-0.5">{t('volatility_cycle')}</p>
        <p className={`text-xs font-black uppercase ${active.color}`}>{active.label}</p>
      </div>
    </div>
  );
};

export const ImpactMatrix: React.FC<{ impact: DetailedImpact }> = ({ impact }) => {
  const categories = [
    { id: 'priceVolatility', label: 'Price', icon: <TrendingUp size={12} />, color: 'text-emerald-400' },
    { id: 'demandChange', label: 'Demand', icon: <Gauge size={12} />, color: 'text-blue-400' },
    { id: 'policyRisk', label: 'Policy', icon: <ShieldAlert size={12} />, color: 'text-amber-400' }
  ];

  return (
    <div className="mt-4 flex overflow-x-auto pb-2 gap-3 no-scrollbar snap-x">
      {categories.map((cat) => (
        <div key={cat.id} className="min-w-[260px] md:min-w-0 md:flex-1 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 snap-center">
          <div className={`flex items-center gap-2 mb-3 ${cat.color} text-[10px] font-black uppercase tracking-widest`}>
            {cat.icon} {cat.label}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['short', 'medium', 'long'].map((time) => (
              <div key={time} className="text-center space-y-1">
                <span className="text-[8px] text-slate-600 font-black uppercase">{time[0]}T</span>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/50 min-h-[36px] flex items-center justify-center">
                  <p className="text-[9px] text-slate-300 font-bold leading-tight line-clamp-2">
                    {(impact as any)[cat.id][time]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export const RegionPills = ({ sources, title, icon, color }: { sources: BusinessSource[], title: string, icon: any, color: string }) => {
  const navigate = useNavigate();
  const { lang } = useContext(LanguageContext);
  const t = useTranslation(lang);

  return (
    <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-xl space-y-4 relative">
      <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none opacity-5">
         <div className={`absolute top-0 right-0 p-4 ${color}`}>{icon}</div>
      </div>
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">{icon} {title}</p>
      <div className="flex flex-wrap gap-1.5">
        {sources?.flatMap(s => s.countries || []).map((c, ci) => (
          <button 
            key={ci} onClick={() => navigate(`/?country=${c.toLowerCase().replace(/[^a-z0-9]/g, '_')}`)}
            className="inline-flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-[9px] font-black text-slate-400 hover:text-blue-400 hover:border-blue-500/50 transition-all active:scale-95"
          >
            {c} <ArrowUpRight size={10} />
          </button>
        ))}
      </div>
      <div className="space-y-1.5 pt-2 relative z-10">
        {sources?.map((s, i) => (
          <div key={i} className="flex justify-between items-center text-[9px] uppercase font-black">
            <span className="text-slate-500 truncate mr-4">{s.name}</span>
            <span className="text-slate-300 font-mono">{s.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const EcosystemCard = ({ companies, onTickerSelect }: { companies: RelatedCompany[], onTickerSelect: (ticker: string) => void }) => {
  const { lang } = useContext(LanguageContext);
  const t = useTranslation(lang);

  return (
    <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-blue-500/20 shadow-2xl space-y-6">
       <div className="flex items-center gap-3">
          <Share2 className="text-blue-400" size={20} />
          <h3 className="text-[11px] font-black uppercase tracking-widest text-white">{t('related_ecosystem')}</h3>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {companies?.map((rel, i) => (
           <button 
             key={i}
             onClick={() => onTickerSelect(rel.ticker)}
             className="bg-slate-950/60 p-5 rounded-3xl border border-slate-800/80 hover:border-blue-500/40 transition-all text-left group"
           >
              <div className="flex justify-between items-start mb-4">
                <div>
                   <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                     rel.relationType === 'Competitor' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                     rel.relationType === 'Supplier' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                     'bg-blue-500/10 text-blue-400 border-blue-500/20'
                   }`}>
                      {t(`relation_${rel.relationType.toLowerCase()}` as any)}
                   </span>
                   <p className="text-lg font-black text-white mt-2 group-hover:text-blue-400 transition-colors">{rel.ticker}</p>
                   <p className="text-[9px] text-slate-500 font-bold uppercase truncate">{rel.name}</p>
                </div>
                {rel.relationType === 'Competitor' ? <Building2 size={16} className="text-slate-700" /> : 
                 rel.relationType === 'Supplier' ? <Factory size={16} className="text-slate-700" /> : <User2 size={16} className="text-slate-700" />}
              </div>
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed border-t border-slate-800/50 pt-3 italic line-clamp-2">
                {rel.relationship}
              </p>
           </button>
         ))}
       </div>
    </div>
  );
};

export const BacktestBlock = ({ title, data, label }: { title: string, data: BacktestResult, label: string }) => {
  const alpha = data.strategyReturn - data.benchmarkReturn;
  return (
    <div className="flex-1 bg-slate-950/40 p-6 rounded-3xl border border-slate-800/50 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Clock size={12} className="text-blue-400" /> {label}
        </p>
        <span className="text-[8px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-black uppercase">{title}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[8px] text-slate-500 font-black uppercase mb-1">Strategy Yield</p>
          <p className={`text-2xl font-black font-mono tracking-tighter ${data.strategyReturn > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {data.strategyReturn?.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-[8px] text-slate-500 font-black uppercase mb-1">Alpha (vs S&P)</p>
          <p className={`text-2xl font-black font-mono tracking-tighter ${alpha > 0 ? 'text-blue-400' : 'text-slate-500'}`}>
            {alpha > 0 ? `+${alpha.toFixed(1)}` : alpha.toFixed(1)}%
          </p>
        </div>
      </div>
      <div className="pt-2 flex items-center justify-between border-t border-slate-800/50">
        <div className="flex items-baseline gap-1">
          <span className="text-[10px] font-black text-slate-300">{data.winRate}%</span>
          <span className="text-[8px] font-bold text-slate-600 uppercase">Win Rate</span>
        </div>
        <span className="text-[8px] font-bold text-slate-600 uppercase">Trades: {data.tradesCount}</span>
      </div>
    </div>
  );
};
