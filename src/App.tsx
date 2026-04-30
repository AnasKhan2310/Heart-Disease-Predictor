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
  const [formData, setFormData] = useState<HeartData>({
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
    setFormData(prev => ({
      ...prev,
      [name]: name === 'oldpeak' ? parseFloat(value) : parseInt(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const analysis = await analyzeHeartHealth(formData);
      setResult(analysis);
    } catch (error) {
      console.error(error);
      alert("Something went wrong during the analysis.");
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
    <div className="min-h-screen bg-ui-bg font-sans selection:bg-brand-primary/10">
      {/* Friendly Navigation */}
      <nav className="bg-ui-card border-b border-ui-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-brand-primary/10 p-2 rounded-xl">
              <Heart className="w-6 h-6 text-brand-primary fill-brand-primary/20" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 leading-tight">Heart Disease Predictor</h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Clinical Insight Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setResult(null)}
              className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              Clear Analysis
            </button>
            <div className="h-4 w-px bg-slate-200"></div>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="bg-brand-primary hover:bg-brand-secondary text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-brand-primary/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              Analyze Health
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Health Information Form */}
          <section className="lg:col-span-7 space-y-8">
            <header className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Patient Information</h2>
              <p className="text-slate-500 text-sm leading-relaxed max-w-md">
                Please enter the following health indicators. These biomarkers help assess cardiovascular health patterns.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Group 1: Basics */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-brand-primary">
                  <Info className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-widest">General Profile</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-brand-primary">
                  <Activity className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Clinical Measurements</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-brand-primary">
                  <AlertTriangle className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Health Patterns</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

              <div className="lg:hidden pt-4">
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-brand-primary text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-brand-primary/20 flex items-center justify-center gap-3 transition-transform active:scale-[0.98]"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Stethoscope className="w-6 h-6" />}
                  Perform Health Analysis
                </button>
              </div>
            </form>
          </section>

          {/* Analysis Results Display */}
          <aside className="lg:col-span-5 sticky top-24">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-ui-card border border-ui-border rounded-3xl p-8 shadow-2xl shadow-slate-200/50 space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Risk Assessment</p>
                      <div className={`inline-flex items-center px-4 py-1.5 rounded-full border text-sm font-bold ${getRiskColor(result.riskLevel)}`}>
                        {result.riskLevel} Risk Level
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Confidence Score</p>
                      <span className="text-3xl font-black text-slate-900">{Math.round(result.probability * 100)}%</span>
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
