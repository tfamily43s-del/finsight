
import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, ChevronRight, Zap, Target, ShieldAlert, ArrowLeft, RefreshCw, Activity, TrendingUp, Gauge, PieChart, ExternalLink, Building, Link2 } from 'lucide-react';
import { SECTORS, COUNTRIES } from '../constants';
import { getSectorStats, getLatestNews, getRelevantTickers } from '../services/geminiService';
import { LanguageContext } from '../App';
import { useTranslation } from '../translations';
import { SectorTechnicalStats, DetailedImpact, CyclePhase, NewsItem, SectorTicker } from '../types';
import { CycleIndicator, IndicatorTooltip, ImpactMatrix } from './Shared';

export const SectorData: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { lang } = useContext(LanguageContext);
  const t = useTranslation(lang);
  
  const countryId = params.get('country') || 'us';
  const paramSector = params.get('sector') || SECTORS[0].id;
  const countryName = useMemo(() => COUNTRIES.find(c => c.id === countryId)?.name ?? 'United States', [countryId]);

  const [selectedSector, setSelectedSector] = useState(paramSector);
  const [stats, setStats] = useState<SectorTechnicalStats | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [tickers, setTickers] = useState<SectorTicker[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (ignore: boolean, force = false) => {
    setLoading(true);
    try {
      const sectorLabel = SECTORS.find(s => s.id === selectedSector)?.name ?? 'Technology';
      const [statsRes, newsRes, tickersRes] = await Promise.all([
        getSectorStats(sectorLabel, countryName, lang),
        getLatestNews(`${countryName} ${sectorLabel} Industry Analysis`, lang, force),
        getRelevantTickers(selectedSector, countryName, lang)
      ]);
      if (ignore) return;
      setStats(statsRes.data);
      setNews(newsRes.data || []);
      setTickers(tickersRes.data || []);
    } catch (e) { console.error(e); } finally { if (!ignore) setLoading(false); }
  }, [selectedSector, countryName, lang]);

  useEffect(() => {
    let ignore = false;
    fetchData(ignore);
    return () => { ignore = true; };
  }, [fetchData]);

  const StatCard = ({ title, value, subValue, label, color, info }: any) => (
    <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-lg relative group">
      <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none opacity-5">
         <Activity size={100} className={`absolute -right-4 -top-4 text-${color}-500 group-hover:scale-110 transition-transform`} />
      </div>
      <div className="flex items-center justify-between mb-3 relative z-10">
        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{title}</p>
        <IndicatorTooltip text={info} />
      </div>
      <div className="flex items-end justify-between relative z-10">
        <p className={`text-3xl font-mono font-black text-${color}-400 tracking-tighter`}>{value ?? '--'}</p>
        <div className="text-right">
          <p className="text-[8px] text-slate-600 font-bold uppercase">{label}</p>
          <p className="text-[10px] text-slate-400 font-mono font-bold">{subValue ?? '--'}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative">
        <div className="flex items-center gap-6 w-full md:w-auto">
           <button onClick={() => navigate('/')} className="p-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl border border-slate-700 transition-all active:scale-90"><ArrowLeft size={20} /></button>
           <div>
             <h2 className="text-xl font-black text-white uppercase tracking-tight">{countryName} {t('nav_sectors')}</h2>
             <p className="text-[9px] text-slate-500 font-mono uppercase tracking-[0.2em]">Deep Industry Engine</p>
           </div>
        </div>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          {stats?.volatilityCycle && <CycleIndicator phase={stats.volatilityCycle} />}
          <button onClick={() => fetchData(false, true)} disabled={loading} className="p-4 bg-slate-800 text-white rounded-2xl border border-slate-700 active:bg-slate-700 transition-all flex items-center justify-center">
             <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-64 flex lg:flex-col overflow-x-auto gap-2 no-scrollbar">
          {SECTORS.map(s => (
            <button key={s.id} onClick={() => setSelectedSector(s.id)} className={`flex-shrink-0 lg:w-full flex items-center justify-between p-4 rounded-xl border transition-all ${selectedSector === s.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'}`}>
              <span className="font-black text-[11px] uppercase">{s.name}</span>
              <ChevronRight size={14} className={selectedSector === s.id ? 'opacity-100' : 'opacity-0'} />
            </button>
          ))}
        </aside>

        <section className="flex-1 space-y-6">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4 bg-slate-900/50 rounded-3xl border border-dashed border-slate-800"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /><p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Syncing Sector Leaders...</p></div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="RSI Indicator" value={stats?.rsi?.toFixed(1)} subValue={stats?.median?.rsi?.toFixed(1)} label="Benchmark" color="blue" info={t('rsi_desc')} />
                <StatCard title="MACD Vector" value={stats?.macd?.toFixed(2)} subValue={stats?.dispersion?.macd?.toFixed(3)} label="Volatility" color="emerald" info={t('macd_desc')} />
                <StatCard title="ADX Trend" value={stats?.adx?.toFixed(1)} subValue={stats?.suggestedSensitivity} label="Strength" color="rose" info={t('adx_desc')} />
              </div>

              {/* Extended Tickers Section - Grid of 10 Cards */}
              <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl relative">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-blue-600/10 rounded-lg">
                    <Building className="text-blue-500" size={20} />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-white">Top 10 Leaders & Ecosystem</h3>
                    <p className="text-[8px] text-slate-500 uppercase font-bold mt-1">Cross-referencing related entities</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {tickers.map((item, i) => (
                    <button 
                      key={`${item.ticker}-${i}`}
                      onClick={() => navigate(`/companies?sector=${selectedSector}&country=${countryId}&ticker=${item.ticker}`)}
                      className="p-5 bg-slate-950/40 rounded-3xl border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition-all text-left group flex flex-col justify-between min-h-[140px] shadow-sm relative overflow-hidden"
                    >
                      <div className="relative z-10">
                         <p className="text-xl font-black text-white group-hover:text-blue-400 transition-colors tracking-tighter">{item.ticker}</p>
                         <p className="text-[9px] text-slate-500 font-black uppercase truncate mt-1 leading-tight">{item.name}</p>
                      </div>
                      
                      {item.relatedTickers && item.relatedTickers.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-800/50 flex flex-wrap gap-1 relative z-10">
                           {item.relatedTickers.slice(0, 2).map((rt, idx) => (
                             <span key={idx} className="inline-flex items-center gap-1 bg-blue-600/10 text-blue-400 text-[7px] font-black px-1.5 py-0.5 rounded border border-blue-500/10 uppercase"><Link2 size={7}/>{rt}</span>
                           ))}
                        </div>
                      )}
                      
                      {/* Background Decoration */}
                      <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                         <Activity size={60} className="text-blue-500" />
                      </div>
                    </button>
                  ))}
                  
                  {tickers.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-slate-950/20 rounded-3xl border border-dashed border-slate-800">
                      <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest">Scanning for deep sector leaders...</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 rounded-[2rem] border border-slate-800 overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-800 flex items-center gap-3"><Target className="text-blue-500" size={18} /><h3 className="text-[11px] font-black uppercase tracking-widest text-white">Latest News Matrix Analysis</h3></div>
                <div className="divide-y divide-slate-800">
                  {news.map((n, i) => (
                    <div key={i} className="p-6 hover:bg-slate-800/10 transition-all group/news">
                       <div className="flex justify-between items-start gap-4 mb-3">
                         <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                               <span className="text-[8px] font-black text-blue-400 bg-blue-400/5 px-2 py-0.5 rounded border border-blue-400/10 uppercase">{n.source || 'GLOBAL SOURCE'}</span>
                               <span className="text-[8px] font-black text-slate-500 uppercase">{n.date || 'LATEST'}</span>
                            </div>
                            <h4 className="text-sm font-black text-white uppercase leading-snug group-hover/news:text-blue-400 transition-colors">{n.title}</h4>
                         </div>
                         <div className="flex flex-col items-end gap-2">
                            <div className={`px-2 py-1 rounded-lg text-[10px] font-black border ${n.sentimentScore > 0 ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : 'text-rose-400 border-rose-500/20 bg-rose-500/5'}`}>
                              {n.sentimentScore > 0 ? `+${n.sentimentScore}` : n.sentimentScore}
                            </div>
                            <a href={n.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 hover:bg-blue-600 rounded-lg text-white transition-all shadow-lg border border-slate-700">
                               <ExternalLink size={14} />
                            </a>
                         </div>
                       </div>
                       <ImpactMatrix impact={n.expectedImpact} />
                       <p className="text-[10px] text-slate-500 font-bold mt-4 italic border-l-2 border-slate-800 pl-3">AI Context: {n.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => navigate(`/companies?sector=${selectedSector}&country=${countryId}`)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-3xl transition-all shadow-xl text-[11px] uppercase tracking-[0.2em] active:scale-[0.98]">View Deep Analysis</button>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
