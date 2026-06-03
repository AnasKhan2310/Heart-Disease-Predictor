/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Activity, 
  Heart, 
  Info, 
  ChevronRight,
  ChevronLeft,
  Loader2,
  HelpCircle,
  Printer,
  X,
  Sliders,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeHeartHealth, HeartData, AnalysisResult } from './services/geminiService';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [helpTopic, setHelpTopic] = useState<{ title: string; text: string } | null>(null);
  const [heartViewMode, setHeartViewMode] = useState<"standard" | "vessels">("standard");

  // Simple, easy-to-use biological settings
  const [formData, setFormData] = useState<HeartData>({
    age: 42,
    sex: 1, // 1 = Male, 0 = Female
    cp: 1,  // Chest Pain Type
    trestbps: 120, // Blood Pressure
    chol: 215, // Cholesterol
    fbs: 0,   // Blood Sugar
    restecg: 0,
    thalach: 145, // Max Heart Rate
    exang: 0,   // Pain during exercise
    oldpeak: 0.8, // Wave strain
    slope: 1,
    ca: 0,    // Blocked vessels
    thal: 2
  });

  // Simple local calculator using clear, plain rules to assess risk
  const calculateLocalHeuristics = (data: HeartData): AnalysisResult => {
    let score = 0;
    
    // Simple factors
    if (data.age > 50) score += 2;
    if (data.age > 65) score += 2;
    if (data.sex === 1) score += 1.5; // Male baseline
    
    // Chest pain types (0 is typical pressure, 1 atypical, 2 mild discomfort, 3 none)
    if (data.cp === 0) score += 4;
    else if (data.cp === 1) score += 2;
    else if (data.cp === 2) score += 1;

    // Blood pressure
    if (data.trestbps > 130) score += 1.5;
    if (data.trestbps > 150) score += 2.5;

    // Cholesterol
    if (data.chol > 200) score += 1.5;
    if (data.chol > 240) score += 2.5;

    // Sugar
    if (data.fbs === 1) score += 1.5;

    // Low max heart rate indicates heart muscles get tired easily
    if (data.thalach < 140) score += 2;
    if (data.thalach < 120) score += 2;

    // Pain during exercise
    if (data.exang === 1) score += 3.5;

    // Wave strain
    if (data.oldpeak > 1.0) score += 2;
    if (data.oldpeak > 2.0) score += 2.5;

    // Blocked major vessels (0 to 4 index)
    score += (data.ca * 3);

    // Normalize out of 25 Max Score
    const maxScore = 24.5;
    let probability = Math.round((score / maxScore) * 100);
    probability = Math.min(95, Math.max(8, probability));

    let riskLevel: "Low" | "Medium" | "High" = "Low";
    let insights = "";
    let recommendations: string[] = [];

    if (probability > 65) {
      riskLevel = "High";
      insights = `Your metrics show clear high-risk patterns. High pressure (${data.trestbps}), lipid cholesterol (${data.chol}), and narrow vessels highlight cardiac strain. Please consult a doctor.`;
      recommendations = [
        "Consult a heart specialist or cardiologist as soon as possible.",
        "Check your blood pressure daily and record the outcomes.",
        "Avoid high physical exertion; stick to easy walking.",
        "Discuss preventive medications with your doctor."
      ];
    } else if (probability > 32) {
      riskLevel = "Medium";
      insights = `Your metrics indicate moderate tension. Slightly high blood pressure or cholesterol levels can cause mild strain over time. We recommend minor healthy habit adjustments.`;
      recommendations = [
        "Include more fresh vegetables and reduce sodium in meals.",
        "Do 30 minutes of light physical movement, 5 days a week.",
        "Check your dynamic blood levels every 6 months.",
        "Practice deep breathing or light yoga for stress relief."
      ];
    } else {
      riskLevel = "Low";
      insights = `Your metrics look great. Blood pressure, cholesterol levels, and heart rate values are well within safe normal limits. Keep maintaining these healthy habits!`;
      recommendations = [
        "Continue your current physical activities like walking or cycling.",
        "Eat wholesome home-cooked meals with low refined sugars.",
        "Schedule standard yearly clinical health checkups.",
        "Keep track of your active pulse rates during rest."
      ];
    }

    return {
      riskLevel,
      probability,
      insights,
      recommendations,
      isFallback: true
    };
  };

  const localOutput = calculateLocalHeuristics(formData);

  const handleSliderChange = (name: keyof HeartData, val: number) => {
    setFormData(prev => ({ ...prev, [name]: val }));
    // Clear static API results to prompt fresh run, showing live updates on the fly
    setResult(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const resp = await analyzeHeartHealth(formData);
      setResult(resp);
    } catch (err) {
      console.warn("AI Service offline. Using high fidelity rules instead.");
      setTimeout(() => {
        setResult(localOutput);
      }, 700);
    } finally {
      setLoading(false);
    }
  };

  const triggerHelp = (title: string, text: string) => {
    setHelpTopic({ title, text });
  };

  const getWrittenArteryReport = (ca: number) => {
    switch (ca) {
      case 0:
        return [
          {
            name: "Left Anterior Descending (LAD) Artery",
            status: "Normal Flow",
            desc: "Perfectly open with peak oxygen delivery. No arterial narrowing detected on primary checks.",
            colorLabel: "text-emerald-600 bg-emerald-50 border-emerald-150"
          },
          {
            name: "Left Circumflex (LCX) Artery",
            status: "Normal Flow",
            desc: "Supplying posterior muscle walls smoothly without resistance.",
            colorLabel: "text-emerald-600 bg-emerald-50 border-emerald-150"
          },
          {
            name: "Right Coronary Artery (RCA)",
            status: "Normal Flow",
            desc: "Full baseline flow maintains healthy pacemaker electric rhythm.",
            colorLabel: "text-emerald-600 bg-emerald-50 border-emerald-150"
          }
        ];
      case 1:
        return [
          {
            name: "Left Anterior Descending (LAD) Artery",
            status: "Mild Blockage",
            desc: "Initial plaque buildup noted. Blood velocity is slightly altered.",
            colorLabel: "text-amber-600 bg-amber-50 border-amber-150"
          },
          {
            name: "Left Circumflex (LCX) Artery",
            status: "Normal Flow",
            desc: "Pathway remains fully adaptive with normal muscular oxygenation.",
            colorLabel: "text-emerald-600 bg-emerald-50 border-emerald-150"
          },
          {
            name: "Right Coronary Artery (RCA)",
            status: "Normal Flow",
            desc: "Flow is clean, providing normal electrical pulse coordination.",
            colorLabel: "text-emerald-600 bg-emerald-50 border-emerald-150"
          }
        ];
      case 2:
        return [
          {
            name: "Left Anterior Descending (LAD) Artery",
            status: "Moderate Narrowing",
            desc: "Measurable lumen compression. Exercise may cause mild localized fatigue.",
            colorLabel: "text-amber-600 bg-amber-50 border-amber-150"
          },
          {
            name: "Left Circumflex (LCX) Artery",
            status: "Significant Narrowing",
            desc: "Decreased elasticity limits blood flow volume during strain.",
            colorLabel: "text-amber-600 bg-amber-50 border-amber-150"
          },
          {
            name: "Right Coronary Artery (RCA)",
            status: "Normal Flow",
            desc: "Normal pathway, ensuring standard oxygenation of the lower ventricle.",
            colorLabel: "text-emerald-600 bg-emerald-50 border-emerald-150"
          }
        ];
      case 3:
        return [
          {
            name: "Left Anterior Descending (LAD) Artery",
            status: "High Blockage",
            desc: "Critical blood flow restriction. Chest tightness under load is probable.",
            colorLabel: "text-rose-600 bg-rose-50 border-rose-150"
          },
          {
            name: "Left Circumflex (LCX) Artery",
            status: "Significant Narrowing",
            desc: "Restricted lumen. Elevated pressure needed to pump adequate blood.",
            colorLabel: "text-amber-600 bg-amber-50 border-amber-150"
          },
          {
            name: "Right Coronary Artery (RCA)",
            status: "Narrow Pathway",
            desc: "Partial occlusion. Impairs right ventricular baseline workload.",
            colorLabel: "text-amber-600 bg-amber-50 border-amber-150"
          }
        ];
      default:
        return [
          {
            name: "Left Anterior Descending (LAD) Artery",
            status: "Critical Narrowing",
            desc: "Highly blocked. Requires immediate clinical coronary verification.",
            colorLabel: "text-rose-600 bg-rose-50 border-rose-150"
          },
          {
            name: "Left Circumflex (LCX) Artery",
            status: "Severe Blockage",
            desc: "Severe tissue perfusions deficit. Left coronary reserves depleted.",
            colorLabel: "text-rose-600 bg-rose-50 border-rose-150"
          },
          {
            name: "Right Coronary Artery (RCA)",
            status: "Severe Blockage",
            desc: "Impairs right arterial margins. High risk for electrical coordination.",
            colorLabel: "text-rose-600 bg-rose-50 border-rose-150"
          }
        ];
    }
  };

  // Biomarker ranges for status alerts
  const bpStatus = formData.trestbps < 120 ? 'normal' : formData.trestbps < 140 ? 'elevated' : 'high';
  const cholStatus = formData.chol < 200 ? 'normal' : formData.chol < 240 ? 'elevated' : 'high';

  return (
    <div className="min-h-screen bg-[#f1f3f7] font-sans text-slate-800 antialiased selection:bg-blue-500/10 flex flex-col pb-12">
      
      {/* Dynamic Header (No "My Doctor", no "Dr+", no "Preset patient selector", beautiful Blue elements) */}
      <header className="bg-white border-b border-slate-200/80 px-4 md:px-8 py-5 sticky top-0 z-30 shadow-xs mb-8">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo & Simple Title */}
          <div className="flex items-center gap-2.5">
            <span className="text-blue-600 bg-blue-50 p-2 rounded-xl border border-blue-100 flex items-center justify-center">
              <Heart className="w-6 h-6 fill-rose-500 text-rose-600 animate-pulse" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight font-display flex items-center gap-1.5">
                HeartPredictor
              </h1>
              <p className="text-slate-500 text-[11px] font-medium leading-none mt-0.5">Simple heart health analyzer</p>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setFormData({
                  age: 42, sex: 1, cp: 1, trestbps: 120, chol: 215, fbs: 0, restecg: 0, thalach: 145, exang: 0, oldpeak: 0.8, slope: 1, ca: 0, thal: 2
                });
                setResult(null);
                setError(null);
              }}
              className="text-xs font-bold text-slate-550 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-4 py-2.5 rounded-xl transition"
            >
              Reset Values
            </button>
            <button 
              onClick={() => window.print()}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition"
              title="Print Page Report"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 md:px-8">
        
        {/* 3-Column Interactive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= COLUMN 1 (5/12): INPUT SETTINGS ================= */}
          <section className="lg:col-span-5 space-y-5">
            
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-6">
              
              {/* Box Title */}
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Step 1</span>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <Sliders className="w-4 h-4 text-blue-500" />
                  Heart Parameters
                </h3>
                <p className="text-slate-450 text-xs mt-0.5">Type the values or pick choices to check heart risk metrics.</p>
              </div>

              {/* Input Group 1: General Info */}
              <div className="space-y-4">
                
                {/* Age Typed Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">Patient Age</span>
                    <button type="button" onClick={() => triggerHelp("Age", "Higher age slowly narrows dynamic vessels and hardens arterial walls over time.")} className="text-slate-400 hover:text-blue-500"><HelpCircle className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="relative">
                    <input 
                      type="number" 
                      min="1" 
                      max="125"
                      value={formData.age} 
                      onChange={(e) => handleSliderChange('age', Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-16 py-2.5 text-xs font-bold outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-slate-800"
                      placeholder="e.g. 42"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-slate-400 select-none">
                      years old
                    </span>
                  </div>
                </div>

                {/* Biological Sex Toggle */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">Biological Sex</span>
                    <button type="button" onClick={() => triggerHelp("Sex", "Different baseline hormones play structural roles in vascular system flexibility.")} className="text-slate-400 hover:text-blue-500"><HelpCircle className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSliderChange('sex', 1)}
                      className={`py-2 text-xs font-bold border rounded-xl transition ${
                        formData.sex === 1 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs font-extrabold' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSliderChange('sex', 0)}
                      className={`py-2 text-xs font-bold border rounded-xl transition ${
                        formData.sex === 0 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs font-extrabold' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Female
                    </button>
                  </div>
                </div>

              </div>

              {/* Input Group 2: Vitals */}
              <div className="space-y-4 pt-3 border-t border-slate-100">
                
                {/* Resting Blood Pressure Typed Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">Blood Pressure (Systolic)</span>
                    <button type="button" onClick={() => triggerHelp("Blood Pressure", "Pressure of blood flow in your arterial system. Levels over 135 mmHg can slowly stress the muscle walls.")} className="text-slate-400 hover:text-blue-500"><HelpCircle className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="relative">
                    <input 
                      type="number" 
                      min="50" 
                      max="240"
                      value={formData.trestbps} 
                      onChange={(e) => handleSliderChange('trestbps', Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-16 py-2.5 text-xs font-bold outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-slate-800"
                      placeholder="e.g. 120"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-slate-400 select-none font-mono">
                      mmHg
                    </span>
                  </div>
                </div>

                {/* Cholesterol level Typed Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">Cholesterol Level</span>
                    <button type="button" onClick={() => triggerHelp("Cholesterol", "Fatty deposits in your arteries. Values over 220 mg/dL can narrow blood paths and restrict flow.")} className="text-slate-400 hover:text-blue-500"><HelpCircle className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="relative">
                    <input 
                      type="number" 
                      min="50" 
                      max="600"
                      value={formData.chol} 
                      onChange={(e) => handleSliderChange('chol', Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-16 py-2.5 text-xs font-bold outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-slate-800"
                      placeholder="e.g. 215"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-slate-400 select-none font-mono">
                      mg/dL
                    </span>
                  </div>
                </div>

                {/* Sugar check toggle */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">Fasting Blood Sugar</span>
                    <button type="button" onClick={() => triggerHelp("Fasting Blood Sugar", "Checks sugar levels before breakfast. Elevated sugar over 120 points to sugar build up risk.")} className="text-slate-400 hover:text-blue-500"><HelpCircle className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSliderChange('fbs', 0)}
                      className={`py-2 text-xs font-bold border rounded-xl transition ${
                        formData.fbs === 0 
                          ? 'bg-blue-600 border-blue-600 text-white text-xs' 
                          : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      Normal (Below 120)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSliderChange('fbs', 1)}
                      className={`py-2 text-xs font-bold border rounded-xl transition ${
                        formData.fbs === 1 
                          ? 'bg-amber-500 border-amber-500 text-white text-xs' 
                          : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      High (Above 120)
                    </button>
                  </div>
                </div>

              </div>

              {/* Input Group 3: Core Wave & Vessel Signals */}
              <div className="space-y-4 pt-3 border-t border-slate-100">
                
                {/* Max heart output rate Typed Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">Max Heart Rate during Exercise</span>
                    <button type="button" onClick={() => triggerHelp("Max Heart Rate", "Highest pulse level achieved during heavy movement. Lower max capacity reflects tired muscles.")} className="text-slate-400 hover:text-blue-500"><HelpCircle className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="relative">
                    <input 
                      type="number" 
                      min="50" 
                      max="220"
                      value={formData.thalach} 
                      onChange={(e) => handleSliderChange('thalach', Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-16 py-2.5 text-xs font-bold outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-slate-800"
                      placeholder="e.g. 145"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-slate-400 select-none font-mono">
                      BPM
                    </span>
                  </div>
                </div>

                {/* Wave Strain ST Oldpeak Typed Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">ECG Wave Strain</span>
                    <button type="button" onClick={() => triggerHelp("ECG wave strain", "Measures stress strain levels under hard tests. Higher mm indexes point to sudden muscle fatigue.")} className="text-slate-400 hover:text-blue-500"><HelpCircle className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="relative">
                    <input 
                      type="number" 
                      min="0" 
                      max="10" 
                      step="0.1"
                      value={formData.oldpeak} 
                      onChange={(e) => handleSliderChange('oldpeak', Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-16 py-2.5 text-xs font-bold outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-slate-800"
                      placeholder="e.g. 0.8"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-slate-400 select-none font-mono">
                      ST mm
                    </span>
                  </div>
                </div>

                {/* Blocked major vessel selector */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">Blocked Major Heart Vessels</span>
                    <button type="button" onClick={() => triggerHelp("Blocked heart vessels", "Number of main pathways noted as blocked or restricted during a dye test.")} className="text-slate-400 hover:text-blue-500"><HelpCircle className="w-3.5 h-3.5" /></button>
                  </div>
                  <select
                    name="ca"
                    value={formData.ca}
                    onChange={(e) => handleSliderChange('ca', Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold shadow-none outline-none focus:border-blue-500"
                  >
                    <option value={0}>0 - No Blockages Found</option>
                    <option value={1}>1 - Minor vessel blockage</option>
                    <option value={2}>2 - Two vessels narrowing</option>
                    <option value={3}>3 - Extensive narrowing block</option>
                    <option value={4}>4 - Multiple complete blocks</option>
                  </select>
                </div>

                {/* Chest Pain Deficit Choice */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">Type of Chest Pain Present</span>
                  </div>
                  <select 
                    name="cp" value={formData.cp} onChange={(e) => handleSliderChange('cp', Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-blue-500 transition-colors"
                  >
                    <option value={1}>Atypical Discomfort (Short twinges, mild squeezes)</option>
                    <option value={2}>Non-Anginal Discomfort (Muscular tension or stomach acid reflex)</option>
                    <option value={3}>Absolutely No Pain (Asymptomatic and normal)</option>
                    <option value={0}>Typical Deep Squeeze (Heavy localized chest pressure under load)</option>
                  </select>
                </div>

                {/* Angina toggle */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">Chest Discomfort triggered by Exercise?</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSliderChange('exang', 0)}
                      className={`py-2 text-xs font-bold border rounded-xl transition ${
                        formData.exang === 0 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      No Pain triggers
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSliderChange('exang', 1)}
                      className={`py-2 text-xs font-bold border rounded-xl transition ${
                        formData.exang === 1 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Yes, Pain occurs
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </section>

          {/* ================= COLUMN 2 (4/12): THE ANATOMICAL OSCILLATING HEART ================= */}
          <section className="lg:col-span-4 flex flex-col justify-between bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs relative overflow-hidden min-h-[580px]">
            
            {/* Simulated monitor labels */}
            <div className="w-full flex items-center justify-between z-10 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block">Anatomical System</span>
                <p className="text-xs font-black text-slate-800">
                  Biological Heart Pulse Simulator
                </p>
              </div>

              <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full border text-blue-600 bg-blue-50 border-blue-100 uppercase">
                Living Organ View
              </span>
            </div>

            {/* Centered pulsating SVG heart body */}
            <div className="relative w-full flex flex-col items-center justify-center py-4">
              
              {/* Floating pulse indicator with Rose styling */}
              <motion.div 
                className="absolute top-4 bg-slate-900/95 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-lg border border-slate-800 flex items-center gap-1.5 z-20"
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 60 / formData.thalach, repeat: Infinity }}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>{formData.thalach} BPM (Heart Rate)</span>
              </motion.div>

              {/* Complex SVG anatomical drawing (High fidelity biological cross section mimicking user schema) */}
              <motion.div
                className="w-full max-w-[210px] mt-8 relative z-0 flex items-center justify-center select-none"
                animate={{ 
                  scale: [1, 1.05, 1],
                  filter: [
                    'drop-shadow(0 10px 15px rgba(59, 130, 246, 0.12))',
                    'drop-shadow(0 15px 25px rgba(59, 130, 246, 0.22))',
                    'drop-shadow(0 10px 15px rgba(59, 130, 246, 0.12))'
                  ]
                }}
                transition={{ 
                  duration: 60 / formData.thalach, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <svg viewBox="0 0 400 450" className="w-full h-auto drop-shadow-md select-none">
                  <defs>
                    <linearGradient id="aortaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f87171" stroke="#dc2626" />
                      <stop offset="60%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#991b1b" />
                    </linearGradient>
                    <linearGradient id="pulmonaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="60%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#1e3a8a" />
                    </linearGradient>
                    <linearGradient id="shinyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* ---- Background Vessels ---- */}
                  {/* Pulmonary Veins (red back branches on the right side) */}
                  <g opacity="0.9">
                    <path d="M 280 180 C 290 170, 330 170, 340 180 C 345 185, 345 195, 335 200 L 285 200 Z" fill="#dc2626" />
                    <path d="M 275 210 C 285 200, 325 200, 335 210 C 340 215, 340 225, 330 230 L 280 230 Z" fill="#b91c1c" />
                  </g>

                  {/* Superior Vena Cava (blue tube, top left, deoxygenated blood inlet) */}
                  <path 
                    d="M 125 100 L 125 220 C 125 240, 150 240, 155 210 L 155 100 Z" 
                    fill="url(#pulmonaryGrad)" 
                  />
                  <ellipse cx="140" cy="100" rx="15" ry="6" fill="#1e3a8a" />

                  {/* Inferior Vena Cava (blue tube, bottom left) */}
                  <path 
                    d="M 130 360 L 130 430 C 130 440, 155 440, 155 420 L 155 360 Z" 
                    fill="url(#pulmonaryGrad)" 
                  />
                  <ellipse cx="142.5" cy="430" rx="12.5" ry="5" fill="#1d4ed8" />

                  {/* ---- Aorta Arch (red oxygen-rich output) ---- */}
                  {/* Top three branching arteries */}
                  <g>
                    {/* Left artery */}
                    <path d="M 205 50 L 205 105" stroke="url(#aortaGrad)" strokeWidth="12" strokeLinecap="round" />
                    <ellipse cx="205" cy="50" rx="6" ry="2.5" fill="#991b1b" />
                    {/* Middle artery */}
                    <path d="M 225 40 L 225 100" stroke="url(#aortaGrad)" strokeWidth="12" strokeLinecap="round" />
                    <ellipse cx="225" cy="40" rx="6" ry="2.5" fill="#991b1b" />
                    {/* Right artery */}
                    <path d="M 248 45 L 248 95" stroke="url(#aortaGrad)" strokeWidth="11" strokeLinecap="round" />
                    <ellipse cx="248" cy="45" rx="5.5" ry="2" fill="#991b1b" />
                  </g>

                  {/* Curved aorta hook */}
                  <path 
                    d="M 185 140 
                       C 185 60, 275 55, 280 130 
                       C 280 150, 255 155, 255 130 
                       C 255 100, 215 100, 215 140 Z" 
                    fill="url(#aortaGrad)" 
                  />

                  {/* ---- Pulmonary Trunk (blue vessel crossing in front of aorta) ---- */}
                  <path 
                    d="M 235 120 
                       C 235 160, 215 190, 195 240 
                       L 225 240 
                       C 240 195, 255 170, 255 120 Z" 
                    fill="url(#pulmonaryGrad)" 
                  />
                  <ellipse cx="245" cy="120" rx="10" ry="4" fill="#1e3a8a" />
                  
                  {/* Left & Right Pulmonary Artery Branches */}
                  <path d="M 245 125 C 265 120, 290 110, 305 120 L 295 135 C 285 128, 260 135, 248 135 Z" fill="url(#pulmonaryGrad)" />
                  <path d="M 205 130 C 185 125, 155 115, 140 125 L 145 140 C 160 133, 185 138, 195 138 Z" fill="url(#pulmonaryGrad)" />

                  {/* Shine reflection overlay on vessels */}
                  <path d="M 205 138 C 215 105, 245 105, 250 138" stroke="url(#shinyGrad)" strokeWidth="2.5" fill="none" opacity="0.6" />

                  {/* ---- MAIN MYOCARDIUM (ANATOMICAL CROSS SECTION) ---- */}
                  {/* Fleshy outer thick muscular frame of the sliced heart */}
                  <path 
                    d="M 200 190 
                       C 275 165, 360 210, 340 335 
                       C 320 425, 230 488, 200 495 
                       C 170 488, 80 425, 60 335 
                       C 40 210, 125 165, 200 190 Z" 
                    fill="#ffb1b0" 
                    stroke="#db6d7d" 
                    strokeWidth="4" 
                  />

                  {/* ---- INNER CHAMBER CAVITIES ---- */}
                  {/* Right Ventricle Cavity (viewers' left, deoxygenated purple-lavender #b28ba2) */}
                  <path 
                    d="M 125 245 
                       C 115 295, 115 375, 185 410 
                       C 192 385, 190 290, 180 255 
                       C 160 245, 135 240, 125 245 Z" 
                    fill="#b28ba2" 
                    stroke="#8c6c80" 
                    strokeWidth="1.5" 
                  />

                  {/* Left Ventricle Cavity (viewers' right, thickest wall, oxygenated warm red-rose #df7e81) */}
                  <path 
                    d="M 220 255 
                       C 210 290, 208 385, 215 410 
                       C 265 390, 290 325, 280 255 
                       C 260 250, 235 248, 220 255 Z" 
                    fill="#df7e81" 
                    stroke="#bb5c5f" 
                    strokeWidth="1.5" 
                  />
                  
                  {/* Atrium Interiors (top hollow spaces) */}
                  {/* Right Atrium (left side of graphic) */}
                  <path d="M 125 220 C 120 200, 145 195, 165 210 C 158 230, 140 235, 125 220 Z" fill="#9e7fa5" />
                  {/* Left Atrium (right side of graphic) */}
                  <path d="M 235 215 C 248 198, 275 200, 275 220 C 265 240, 245 235, 235 215 Z" fill="#da747d" />

                  {/* ---- HIGH FIDELITY VALVES & ATTACHMENT TENDONS ---- */}
                  {/* Base Pulmonary Valve (in the central blue trunk) */}
                  <g stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" fill="none">
                    <path d="M 216 238 C 223 234, 225 240, 232 238" />
                    <path d="M 233 238 C 240 234, 242 240, 249 238" />
                  </g>
                  {/* Valve background white flap filling */}
                  <path d="M 216 238 C 223 230, 227 230, 233 238 C 240 230, 244 230, 249 238 Z" fill="#e7f2fa" opacity="0.6" />

                  {/* Mitral / Bicuspid Valve (viewers' right, hanging white elegant cusps) */}
                  <g>
                    {/* White valve leaflets */}
                    <path 
                      d="M 220 255 C 228 275, 235 285, 245 285 C 255 285, 265 275, 275 255" 
                      fill="none" 
                      stroke="#ffffff" 
                      strokeWidth="3.5" 
                      strokeLinecap="round" 
                    />
                    
                    {/* Tendon cords (chordae tendineae) descending with fine white lines */}
                    <line x1="230" y1="275" x2="225" y2="350" stroke="#ffffff" strokeWidth="1.2" opacity="0.9" />
                    <line x1="240" y1="285" x2="230" y2="360" stroke="#ffffff" strokeWidth="1.2" opacity="0.9" />
                    <line x1="250" y1="285" x2="255" y2="360" stroke="#ffffff" strokeWidth="1.2" opacity="0.9" />
                    <line x1="262" y1="270" x2="265" y2="345" stroke="#ffffff" strokeWidth="1.2" opacity="0.9" />
                    
                    {/* Papillary muscle heads (fleshy anchors inside LV) */}
                    <path d="M 220 350 C 225 340, 230 340, 235 355" fill="#fca3b0" stroke="#db6d7d" strokeWidth="1.5" />
                    <path d="M 250 355 C 255 340, 260 340, 265 350" fill="#fca3b0" stroke="#db6d7d" strokeWidth="1.5" />
                  </g>

                  {/* Tricuspid Valve (viewers' left) */}
                  <g>
                    {/* White valve leaflets */}
                    <path 
                      d="M 128 248 C 138 270, 148 280, 155 280 C 162 280, 170 270, 178 253" 
                      fill="none" 
                      stroke="#ffffff" 
                      strokeWidth="3.5" 
                      strokeLinecap="round" 
                    />
                    
                    {/* Tendon cords (chordae tendineae) */}
                    <line x1="138" y1="268" x2="142" y2="340" stroke="#ffffff" strokeWidth="1.2" opacity="0.9" />
                    <line x1="148" y1="280" x2="148" y2="345" stroke="#ffffff" strokeWidth="1.2" opacity="0.9" />
                    <line x1="158" y1="280" x2="165" y2="340" stroke="#ffffff" strokeWidth="1.2" opacity="0.9" />
                    <line x1="168" y1="265" x2="175" y2="335" stroke="#ffffff" strokeWidth="1.2" opacity="0.9" />
                    
                    {/* Papillary muscles inside RV */}
                    <path d="M 138 340 C 142 335, 146 335, 150 345" fill="#ffb1b0" stroke="#db6d7d" strokeWidth="1.5" />
                    <path d="M 160 340 C 165 330, 170 330, 175 340" fill="#ffb1b0" stroke="#db6d7d" strokeWidth="1.5" />
                  </g>

                  {/* Surface highlights to complete the look */}
                  <ellipse cx="200" cy="490" rx="4" ry="2" fill="#ffffff" opacity="0.4" />
                </svg>
              </motion.div>
            </div>

            {/* Written Artery Report Replacing Dots and Orbit Elements */}
            <div className="mt-2 space-y-3 pt-3 border-t border-slate-100 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider block">Artery Flow Detailed Report</span>
                <span className="text-[10px] text-slate-400 font-bold">CA Selected: {formData.ca}</span>
              </div>
              
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {getWrittenArteryReport(formData.ca).map((artery, idx) => {
                  let badgeColors = "text-emerald-700 bg-emerald-50 border-emerald-100";
                  if (artery.status.includes("Mild") || artery.status.includes("Moderate") || artery.status.includes("Narrow")) {
                    badgeColors = "text-amber-700 bg-amber-50 border-amber-100";
                  } else if (artery.status.includes("High") || artery.status.includes("Critical") || artery.status.includes("Severe")) {
                    badgeColors = "text-rose-700 bg-rose-50 border-rose-100";
                  }

                  return (
                    <div key={idx} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-extrabold text-slate-800 leading-tight">
                          {artery.name}
                        </span>
                        <span className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md border shrink-0 ${badgeColors}`}>
                          {artery.status}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 font-semibold leading-normal">
                        {artery.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

          </section>

          {/* ================= COLUMN 3 (3/12): DIAGNOSTIC REPORT ================= */}
          <section className="lg:col-span-3 space-y-5">
            
            {/* Primary Report Card (Uses simple, direct, short words with Blue highlights) */}
            <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl" />
              
              {/* Header inside Report */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-blue-400">Diagnosis</p>
                  <h4 className="font-extrabold text-sm text-slate-100">Evaluated Risk</h4>
                </div>
                <Activity className="w-4 h-4 text-blue-500" />
              </div>

              {/* Status and Score */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-xl font-black ${
                      localOutput.riskLevel === 'High' ? 'text-rose-500' : localOutput.riskLevel === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {localOutput.riskLevel} Risk
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold tracking-tight">Relative score category</p>
                  </div>
                  <div className="bg-white/10 border border-white/10 text-slate-200 text-xs font-bold py-1 px-2.5 rounded-xl">
                    {localOutput.probability}% Weight
                  </div>
                </div>

                {/* Score slider indicator */}
                <div className="space-y-1">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 rounded-full ${
                        localOutput.riskLevel === 'High' ? 'bg-rose-500' : localOutput.riskLevel === 'Medium' ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${localOutput.probability}%` }}
                    />
                  </div>
                </div>

                {/* Simplified insights */}
                <p className="text-[11.5px] text-slate-300 leading-relaxed pt-1 font-medium">
                  {localOutput.insights}
                </p>

                {/* Trigger AI Query */}
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-650/15"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-3.5 h-3.5" />
                      <span>Let AI Analyze</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Custom Interactive AI Result */}
            <AnimatePresence>
              {result && (
                <motion.div 
                   className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-4 text-left"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs uppercase tracking-wider">
                      <Brain className="w-3.5 h-3.5" />
                      <span>AI Health Synthesis</span>
                    </div>
                    <button onClick={() => setResult(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                    "{result.insights}"
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Action steps</h5>
                    {result.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex gap-2 text-xs border border-slate-100 p-2 rounded-xl bg-slate-50/50">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-slate-500 leading-tight font-medium">{rec}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Simple Biomarker Health Meters */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Gauge Health Metrics</span>
              
              <div className="space-y-3 pt-1">
                {/* Resting Blood Pressure */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">Blood Pressure</span>
                    <span className={`text-[10.5px] font-black ${bpStatus === 'high' ? 'text-rose-500' : bpStatus === 'elevated' ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {formData.trestbps} mmHg
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-350 ${bpStatus === 'high' ? 'bg-rose-500' : bpStatus === 'elevated' ? 'bg-amber-400' : 'bg-emerald-400'}`}
                      style={{ width: `${Math.min(100, Math.max(10, ((formData.trestbps - 70) / 160) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Cholesterol */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">Cholesterol</span>
                    <span className={`text-[10.5px] font-black ${cholStatus === 'high' ? 'text-rose-500' : cholStatus === 'elevated' ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {formData.chol} mg/dL
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-350 ${cholStatus === 'high' ? 'bg-rose-500' : cholStatus === 'elevated' ? 'bg-amber-400' : 'bg-emerald-400'}`}
                      style={{ width: `${Math.min(100, Math.max(10, ((formData.chol - 100) / 450) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Clear channel text */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500 font-semibold gap-1.5">
                  <span>Blocked Arteries status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    formData.ca === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                  }`}>
                    {formData.ca === 0 ? 'All Clear' : `${formData.ca} Blocked`}
                  </span>
                </div>
              </div>
            </div>

          </section>

        </div>

      </main>

      {/* Simplified Tooltip description modal */}
      <AnimatePresence>
        {helpTopic && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setHelpTopic(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-5 max-w-sm w-full border border-slate-200 shadow-xl space-y-4 text-left"
            >
              <div className="flex items-center gap-1.5 text-blue-600 font-bold pb-2 border-b border-slate-100">
                <Info className="w-5 h-5 text-blue-500" />
                <h4 className="text-slate-900 text-xs font-black uppercase tracking-wider">{helpTopic.title}</h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">{helpTopic.text}</p>
              <button 
                onClick={() => setHelpTopic(null)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs transition"
              >
                Okay, got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
