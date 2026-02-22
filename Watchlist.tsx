
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Activity, ShoppingCart, BarChart3, TrendingUp, History, Bell, ArrowUpRight, CheckCircle2, Clock, Share2, Building2, User2, Factory, Plus, Trash2, Search, Target } from 'lucide-react';
import { getCompanyStats } from '../services/geminiService';
import { checkTechnicalAlerts } from '../services/alertService';
import { PriceAreaChart, ComparisonBarChart } from './Charts';
import { CycleIndicator, IndicatorTooltip, RegionPills, EcosystemCard, BacktestBlock } from './Shared';
import { INITIAL_ALERTS } from '../constants';
import { LanguageContext, CountryContext } from '../App';
import { useTranslation } from '../translations';
import { TradeRecord, BusinessSource, BacktestResult, CompanyStats, RelatedCompany } from '../types';

export const Watchlist: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { lang } = useContext(LanguageContext);
  const { addCountries } = useContext(CountryContext);
  const t = useTranslation(lang);
  
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fin_watchlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { console.error("Watchlist corrupted"); }
    return ['AAPL', 'TSLA', 'NVDA'];
  });

  const [newTicker, setNewTicker] = useState('');
  const [selectedTicker, setSelectedTicker] = useState(params.get('ticker') || watchlist[0] || '');
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(false);

  const alertSettings = React.useMemo(() => {
    const saved = localStorage.getItem('fin_settings');
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  }, []);

  useEffect(() => {
    localStorage.setItem('fin_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const fetchData = useCallback(async (ticker: string) => {
    if (!ticker) return;
    setLoading(true);
    setSyncStatus(false);
    try {
      const statsRes = await getCompanyStats(ticker, lang);
      const data = statsRes.data;
      setStats(data);
      
      if (data) {
         checkTechnicalAlerts(ticker, {
           rsi: data.rsi || 50, macd: data.macd || 0, adx: data.adx || 20,
           bollingerUpper: data.bollingerUpper, bollingerLower: data.bollingerLower
         }, alertSettings, lang, data.currentPrice);

         const discovered: string[] = [];
         data.revenueSources?.forEach((s: BusinessSource) => s.countries?.forEach(c => discovered.push(c)));
         data.expenditureSources?.forEach((s: BusinessSource) => s.countries?.forEach(c => discovered.push(c)));
         
         if (discovered.length > 0) {
           addCountries([...new Set(discovered)]);
           setSyncStatus(true);
           setTimeout(() => setSyncStatus(false), 4000);
         }
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [lang, addCountries, alertSettings]);

  useEffect(() => {
    if (selectedTicker) {
      fetchData(selectedTicker);
      setParams({ ticker: selectedTicker });
    }
  }, [selectedTicker, fetchData, setParams]);

  const handleAddTicker = (e: React.FormEvent) => {
    e.preventDefault();
    const ticker = newTicker.trim().toUpperCase();
    if (ticker && !watchlist.includes(ticker)) {
      setWatchlist(prev => [...prev, ticker]);
      setSelectedTicker(ticker);
      setNewTicker('');
    }
  };

  const handleRemoveTicker = (ticker: string) => {
    const next = watchlist.filter(t => t !== ticker);
    setWatchlist(next);
    if (selectedTicker === ticker) {
      setSelectedTicker(next[0] || '');
    }
  };

  const handleSimulateBuy = () => {
    if (!stats) return;
    const portfolio = JSON.parse(localStorage.getItem('fin_portfolio_v2') ?? '{"balance": 100000, "positions": [], "history": []}');
    const price = stats.currentPrice || 100;
    const cost = price * 10;
    if (portfolio.balance < cost) { alert('Insufficient Balance!'); return; }
    
    const newTrade: TradeRecord = { id: Math.random().toString(36).substr(2, 9), ticker: selectedTicker, type: 'BUY', price, amount: 10, timestamp: Date.now() };
    const idx = portfolio.positions.findIndex((p: any) => p.ticker === selectedTicker);
    if (idx >= 0) {
      portfolio.positions[idx].averagePrice = (portfolio.positions[idx].averagePrice * portfolio.positions[idx].amount + cost) / (portfolio.positions[idx].amount + 10);
      portfolio.positions[idx].amount += 10;
    } else {
      portfolio.positions.push({ ticker: selectedTicker, averagePrice: price, amount: 10 });
    }
    portfolio.balance -= cost;
    portfolio.history.unshift(newTrade);
    localStorage.setItem('fin_portfolio_v2', JSON.stringify(portfolio));
    alert(`Success: Purchased 10 shares of ${selectedTicker} @ $${price.toFixed(2)}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-64 space-y-4">
          <form onSubmit={handleAddTicker} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder={t('add_ticker')}
              className="bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs w-full focus:ring-2 focus:ring-blue-500 transition-all outline-none text-white font-bold"
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value)}
            />
          </form>
          
          <div className="flex lg:flex-col overflow-x-auto gap-2 no-scrollbar">
            {watchlist.map(ticker => (
              <div key={ticker} className="flex-shrink-0 lg:w-full group relative">
                <button 
                  onClick={() => setSelectedTicker(ticker)} 
                  className={`w-full p-4 rounded-xl border text-left transition-all pr-10 ${selectedTicker === ticker ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'}`}
                >
                  <p className="font-black text-sm">{ticker}</p>
                </button>
                <button 
                  onClick={() => handleRemoveTicker(ticker)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          
          {watchlist.length === 0 && (
            <p className="text-[10px] text-slate-600 font-black uppercase text-center py-10 italic">
              {t('watchlist_empty')}
            </p>
          )}
        </aside>

        <section className="flex-1 space-y-6">
          {!selectedTicker ? (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-6 bg-slate-900/30 rounded-[2.5rem] border border-dashed border-slate-800">
              <Plus className="text-slate-700 w-12 h-12" />
              <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest">{t('watchlist_empty')}</p>
            </div>
          ) : loading ? (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-6 bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-800">
              <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest animate-pulse">Analyzing Corporate Footprint...</p>
            </div>
          ) : stats && (
            <>
              <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl relative">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div>
                    <h3 className="text-5xl font-black tracking-tighter text-white uppercase">{selectedTicker}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      {syncStatus && <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase px-2 py-0.5 rounded animate-bounce"><CheckCircle2 size={10} /> Macro Synced</span>}
                      <p className="text-[9px] text-slate-500 uppercase font-black flex items-center gap-1"><Bell size={10} className="text-blue-500" /> Watchdog Active</p>
                    </div>
                  </div>
                  {stats.volatilityCycle && <CycleIndicator phase={stats.volatilityCycle} />}
                </div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="text-right font-mono"><p className="text-[9px] text-slate-500 font-black uppercase mb-1">Spot Price</p><p className="text-3xl font-black text-emerald-400">${stats.currentPrice?.toFixed(2)}</p></div>
                  <button onClick={handleSimulateBuy} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-5 rounded-2xl flex items-center gap-2 font-black uppercase text-xs shadow-2xl active:scale-95 transition-all"><ShoppingCart size={20} /> Buy</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <RegionPills title={t('revenue_regions')} sources={stats.revenueSources} icon={<TrendingUp size={16} />} color="text-emerald-400" />
                 <RegionPills title={t('expenditure_regions')} sources={stats.expenditureSources} icon={<Target size={16} />} color="text-rose-400" />
              </div>

              <EcosystemCard companies={stats.relatedCompanies} onTickerSelect={(ticker) => {
                if (!watchlist.includes(ticker)) {
                  setWatchlist(prev => [...prev, ticker]);
                }
                setSelectedTicker(ticker);
              }} />

              <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-blue-500/10 shadow-2xl space-y-6">
                  <div className="flex items-center gap-3">
                    <History className="text-blue-500" size={20} />
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-white">Dual-Period AI Backtesting Matrix</h3>
                  </div>
                  <div className="flex flex-col md:flex-row gap-6">
                    {stats.backtest1Y && <BacktestBlock title="Short-term" data={stats.backtest1Y} label="1 Year Performance" />}
                    {stats.backtest3Y && <BacktestBlock title="Long-term" data={stats.backtest3Y} label="3 Year Performance" />}
                  </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl">
                 <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-3"><BarChart3 size={20} className="text-blue-500" /><h3 className="text-[11px] font-black uppercase tracking-widest text-white">12-Quarter Performance Matrix</h3></div>
                   <div className="flex gap-4 text-[9px] font-black uppercase text-slate-500"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-blue-500" /> Revenue</div><div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-emerald-500" /> Net Income</div></div>
                 </div>
                 <div className="h-72 w-full"><ComparisonBarChart data={stats.financials || []} xKey="period" bars={[{ key: 'revenue', color: '#3b82f6' }, { key: 'netIncome', color: '#10b981' }]} /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                 <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl h-80 relative overflow-hidden group">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">1Y Momentum Vector</p>
                    <PriceAreaChart data={stats.priceTrend || []} xKey="date" yKey="price" color="#3b82f6" />
                 </div>
                 <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl flex flex-col justify-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">Asset Health Indicators</p>
                    <div className="grid grid-cols-2 gap-4">
                      {[{l: 'RSI (14)', v: stats.rsi, c: stats.rsi > 70 ? 'text-rose-400' : stats.rsi < 30 ? 'text-emerald-400' : 'text-blue-400', info: t('rsi_desc')},
                        {l: 'ADX Trend', v: stats.adx, c: 'text-slate-300', info: t('adx_desc')}].map((ind, i) => (
                        <div key={i} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center relative">
                          <div className="absolute top-2 right-2">
                             <IndicatorTooltip text={ind.info} />
                          </div>
                          <p className="text-[8px] font-black text-slate-500 uppercase mb-1">{ind.l}</p>
                          <p className={`text-2xl font-black font-mono ${ind.c}`}>{ind.v?.toFixed(1)}</p>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
