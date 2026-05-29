/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Activity, 
  Heart, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  Stethoscope, 
  ChevronRight,
  Loader2,
  RefreshCcw,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeHeartHealth, HeartData, AnalysisResult } from './services/geminiService';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    age: 45,
    sex: 1,
    cp: 0,
    trestbps: 120,
    chol: 230,
    fbs: 0,
    restecg: 1,
    thalach: 150,
    exang: 0,
    oldpeak: 1.0,
    slope: 1,
    ca: 0,
    thal: 2
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Allow empty string for better UX while typing
    if (value === '') {
      setFormData(prev => ({ ...prev, [name]: '' }));
      return;
    }

    if (name === 'oldpeak') {
      const parsedValue = parseFloat(value);
      setFormData(prev => ({
        ...prev,
        [name]: isNaN(parsedValue) ? value : parsedValue
      }));
    } else {
      const parsedValue = parseInt(value);
      setFormData(prev => ({
        ...prev,
        [name]: isNaN(parsedValue) ? value : parsedValue
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean data before sending (convert empty strings or strings back to numbers)
    const cleanedData = Object.entries(formData).reduce((acc, [key, val]) => {
      acc[key] = val === '' ? 0 : Number(val);
      return acc;
    }, {} as any);

    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const analysis = await analyzeHeartHealth(cleanedData);
      setResult(analysis);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Something went wrong during the analysis.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Low': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-ui-bg font-sans selection:bg-brand-primary/10 pb-20 md:pb-0">
      {/* Friendly Navigation */}
      <nav className="bg-ui-card border-b border-ui-border sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-brand-primary/10 p-2 rounded-xl shrink-0">
              <Heart className="w-5 h-5 md:w-6 md:h-6 text-brand-primary fill-brand-primary/20" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-slate-900 leading-tight truncate text-sm md:text-base">Heart Disease Predictor</h1>
              <p className="text-[9px] md:text-[10px] text-slate-500 font-medium uppercase tracking-wider truncate">Clinical Insight Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setResult(null)}
              className="text-xs md:text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors hidden sm:block"
            >
              Clear
            </button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="bg-brand-primary hover:bg-brand-secondary text-white px-4 md:px-5 py-2 rounded-full text-xs md:text-sm font-bold shadow-lg shadow-brand-primary/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : <Activity className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              <span className="hidden xs:inline">Analyze</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
          
          {/* Health Information Form */}
          <section className="lg:col-span-7 space-y-6 md:space-y-8">
            <header className="space-y-2">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Patient Information</h2>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed max-w-md">
                Please enter the following health indicators. These biomarkers help assess cardiovascular health patterns.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8 md:space-y-10">
              {/* Group 1: Basics */}
              <div className="space-y-4 md:space-y-6 bg-white p-5 md:p-0 rounded-2xl md:bg-transparent border border-ui-border md:border-0 shadow-sm md:shadow-none">
                <div className="flex items-center gap-2 text-brand-primary">
                  <Info className="w-4 h-4" />
                  <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest">General Profile</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Age</label>
                    <input 
                      type="number" name="age" value={formData.age} onChange={handleInputChange}
                      className="w-full bg-white border border-ui-border rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                      placeholder="e.g. 45"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Biological Sex</label>
                    <select 
                      name="sex" value={formData.sex} onChange={handleInputChange}
                      className="w-full bg-white border border-ui-border rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all appearance-none"
                    >
                      <option value={1}>Male</option>
                      <option value={0}>Female</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Group 2: Measurements */}
              <div className="space-y-4 md:space-y-6 bg-white p-5 md:p-0 rounded-2xl md:bg-transparent border border-ui-border md:border-0 shadow-sm md:shadow-none">
                <div className="flex items-center gap-2 text-brand-primary">
                  <Activity className="w-4 h-4" />
                  <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest">Clinical Measurements</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Blood Pressure (Systolic)</label>
                    <div className="relative">
                      <input 
                        type="number" name="trestbps" value={formData.trestbps} onChange={handleInputChange}
                        className="w-full bg-white border border-ui-border rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">mmHg</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Total Cholesterol</label>
                    <div className="relative">
                      <input 
                        type="number" name="chol" value={formData.chol} onChange={handleInputChange}
                        className="w-full bg-white border border-ui-border rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">mg/dL</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Max Heart Rate</label>
                    <div className="relative">
                      <input 
                        type="number" name="thalach" value={formData.thalach} onChange={handleInputChange}
                        className="w-full bg-white border border-ui-border rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">bpm</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Chest Pain Severity</label>
                    <select 
                      name="cp" value={formData.cp} onChange={handleInputChange}
                      className="w-full bg-white border border-ui-border rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all appearance-none"
                    >
                      <option value={0}>Typical Angina</option>
                      <option value={1}>Atypical Angina</option>
                      <option value={2}>Non-anginal Pain</option>
                      <option value={3}>Asymptomatic</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Group 3: Indicators */}
              <div className="space-y-4 md:space-y-6 bg-white p-5 md:p-0 rounded-2xl md:bg-transparent border border-ui-border md:border-0 shadow-sm md:shadow-none">
                <div className="flex items-center gap-2 text-brand-primary">
                  <AlertTriangle className="w-4 h-4" />
                  <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest">Health Patterns</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Exercise-Induced ST Depression</label>
                    <input 
                      type="number" step="0.1" name="oldpeak" value={formData.oldpeak} onChange={handleInputChange}
                      className="w-full bg-white border border-ui-border rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Major Vessels Colored by Fluoroscopy</label>
                    <select 
                      name="ca" value={formData.ca} onChange={handleInputChange}
                      className="w-full bg-white border border-ui-border rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all appearance-none"
                    >
                      <option value={0}>Zero</option>
                      <option value={1}>One</option>
                      <option value={2}>Two</option>
                      <option value={3}>Three</option>
                      <option value={4}>Four (Rare)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="fixed bottom-4 left-4 right-4 z-40 lg:hidden">
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold text-base shadow-2xl shadow-brand-primary/40 flex items-center justify-center gap-3 transition-transform active:scale-[0.98] border border-white/20"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Stethoscope className="w-5 h-5" />}
                  Perform Health Analysis
                </button>
              </div>
            </form>
          </section>

          {/* Analysis Results Display */}
          <aside className="lg:col-span-5 sticky top-24">
            <AnimatePresence mode="wait">
              {error ? (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white border-2 border-red-500 rounded-3xl p-8 shadow-2xl shadow-red-50 space-y-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-red-50 p-2.5 rounded-2xl shrink-0 text-red-600">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-lg">API Key Error (Expired)</h3>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Action Required</p>
                    </div>
                  </div>

                  <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl text-sm text-red-800 leading-relaxed font-medium">
                    {error}
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                      Isko Theek Karne Ka Tareeqa (Steps to Fix):
                    </h4>
                    <div className="space-y-3">
                      <div className="flex gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-600">
                        <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0">
                          1
                        </span>
                        <span>Left background ya panel me <b>Settings</b> &gt; <b>Secrets</b> par click karein.</span>
                      </div>
                      <div className="flex gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-600">
                        <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0">
                          2
                        </span>
                        <span>Wahan <b>GEMINI_API_KEY</b> ya <b>VITE_GEMINI_API_KEY</b> ke samne <b>Edit/Options</b> par click karke apni nayi valid/working Gemini key paste karein.</span>
                      </div>
                      <div className="flex gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-600">
                        <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0">
                          3
                        </span>
                        <span>Usko save karne ke baad page ko refresh (F5) karein aur apna analysis dubara run karein!</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setError(null)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCcw className="w-4 h-4" /> Got it, try again
                  </button>
                </motion.div>
              ) : result ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-ui-card border border-ui-border rounded-3xl p-8 shadow-2xl shadow-slate-200/50 space-y-8"
                >
                  {result.isFallback && (
                    <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex gap-3 text-xs text-amber-800 leading-relaxed font-normal">
                      <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <span className="font-black uppercase text-[10px] tracking-widest block text-amber-900 mb-0.5">
                          ⚠️ Local Fallback Engine Active
                        </span>
                        Gemini API key is expired or unconfigured. Applied clinical physiological heuristics for instant risk evaluation. Renew your <b>GEMINI_API_KEY</b> in Left Menu &gt; Settings &gt; Secrets to restore advanced customized clinical reasoning.
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between col-span-2">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Risk Assessment</p>
                      <div className={`inline-flex items-center px-4 py-1.5 rounded-full border text-sm font-bold ${getRiskColor(result.riskLevel)}`}>
                        {result.riskLevel} Risk Level
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Confidence Score</p>
                      <span className="text-3xl font-black text-slate-900">
                        {typeof result.probability === 'number' && !isNaN(result.probability) 
                          ? (result.probability > 1 
                              ? `${Math.round(result.probability)}%` 
                              : `${Math.round(result.probability * 100)}%`)
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-600 text-sm leading-relaxed relative">
                    <span className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-black text-brand-primary uppercase tracking-widest border border-slate-100 rounded">Clinical Insight</span>
                    "{result.insights}"
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                       Key Recommendations
                    </h4>
                    <div className="space-y-3">
                      {result.recommendations.map((rec, i) => (
                        <div key={i} className="flex gap-4 p-4 bg-white border border-slate-100 rounded-2xl text-sm text-slate-600 group hover:border-brand-primary/20 transition-colors">
                          <span className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-[10px] font-bold text-brand-primary shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                            {i+1}
                          </span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex items-center gap-3 text-slate-400 text-[10px] font-medium italic">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Disclaimer: This is a diagnostic assessment and not a substitute for professional medical advice.
                  </div>
                </motion.div>
              ) : (
                <div className="bg-ui-card border-2 border-dashed border-ui-border rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-6">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center relative">
                    <Stethoscope className={`w-8 h-8 text-slate-300 ${loading ? 'animate-pulse' : ''}`} />
                    {loading && (
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-2 border-brand-primary border-t-transparent rounded-full"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-900">Ready for Analysis</h3>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-[240px] mx-auto">
                      Fill out the health profile on the left and start the diagnostic process.
                    </p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </aside>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-12 border-t border-ui-border text-center space-y-4">
        <div className="flex items-center justify-center gap-2 opacity-30">
          <Heart className="w-4 h-4 text-brand-accent fill-brand-accent" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Heart Disease Predictor v2.0.4</span>
        </div>
        <p className="text-[10px] text-slate-400 max-w-lg mx-auto leading-relaxed">
          The prediction model uses a deep behavioral network to correlate physiological biomarkers with probability scores. Built for clinical educational research.
        </p>
      </footer>
    </div>
  );
}
