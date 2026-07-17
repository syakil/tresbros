"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, ArrowLeft, CheckCircle2, XCircle, Coffee, Check, X } from 'lucide-react';
import { format } from 'date-fns';

interface TrialData {
  trialNumber: number;
  grindSize: string;
  dose: number;
  yield: number;
  time: number;
  sweetness: boolean;
  body: boolean;
  clean: boolean;
  milkMatch: boolean;
  passed: boolean;
}

export default function CalibrationPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState('Pagi');
  const [baristaName, setBaristaName] = useState('');
  const [beansName, setBeansName] = useState('');
  const [materialId, setMaterialId] = useState('');

  // 6 Trials State
  const initialTrials: TrialData[] = Array.from({ length: 6 }, (_, i) => ({
    trialNumber: i + 1,
    grindSize: '',
    dose: 0,
    yield: 0,
    time: 0,
    sweetness: false,
    body: false,
    clean: false,
    milkMatch: false,
    passed: false
  }));
  const [trials, setTrials] = useState<TrialData[]>(initialTrials);

  useEffect(() => {
    fetchLogs();
    fetchMaterials();
    
    // Auto-fetch user for barista name
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
    };
    try {
      const userCookie = getCookie('tresbros_user');
      if (userCookie) {
        const userData = JSON.parse(decodeURIComponent(userCookie));
        setBaristaName(userData.username || userData.name || 'Barista');
      }
    } catch(e) {}
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/calibration');
      setLogs(res.data || []);
    } catch (error) {
      console.error('Failed to fetch calibration logs', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const res = await axios.get('/api/materials');
      setMaterials(res.data || []);
    } catch (error) {
      console.error('Failed to fetch materials', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this log?')) return;
    try {
      await axios.delete(`/api/calibration/${id}`);
      fetchLogs();
    } catch (error) {
      console.error('Failed to delete log', error);
      alert('Failed to delete log');
    }
  };

  const handleTrialChange = (index: number, field: string, value: any) => {
    const newTrials = [...trials];
    newTrials[index] = { ...newTrials[index], [field]: value };
    setTrials(newTrials);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Filter out completely empty trials to not save blank rows
      const filledTrials = trials.filter(t => t.grindSize !== '' || t.dose > 0 || t.yield > 0 || t.time > 0);
      
      const selectedMaterial = materials.find(m => m.id.toString() === materialId);

      const payload = {
        date: new Date(date).toISOString(),
        shift,
        baristaName,
        beansName: selectedMaterial ? selectedMaterial.name : beansName,
        materialId: materialId ? parseInt(materialId) : null,
        trials: filledTrials.length > 0 ? filledTrials : trials
      };

      await axios.post('/api/calibration', payload);
      setIsCreating(false);
      resetForm();
      fetchLogs();
    } catch (error: any) {
      console.error('Failed to save calibration log', error);
      alert(error.response?.data?.error || 'Failed to save log');
    }
  };

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setShift('Pagi');
    // Keep barista name as is since it's from logged in user
    setBeansName('');
    setMaterialId('');
    setTrials(initialTrials);
  };

  if (isCreating) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setIsCreating(false)}
            className="p-2 hover:bg-zinc-200 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
              <Coffee className="w-6 h-6 text-blue-600" />
              Lembar Kontrol & Log Kalibrasi Espresso
            </h1>
            <p className="text-sm text-zinc-500">Record daily espresso calibration parameters</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-zinc-200/60 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Tanggal</label>
                <input 
                  type="date" 
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Shift</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="Pagi" checked={shift === 'Pagi'} onChange={(e) => setShift(e.target.value)} className="w-4 h-4 text-blue-600 focus:ring-blue-600" />
                    <span>Pagi</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="Siang/Malam" checked={shift === 'Siang/Malam'} onChange={(e) => setShift(e.target.value)} className="w-4 h-4 text-blue-600 focus:ring-blue-600" />
                    <span>Siang/Malam</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Nama Barista</label>
                <input 
                  type="text" 
                  required
                  readOnly
                  placeholder="e.g. John Doe"
                  value={baristaName}
                  onChange={(e) => setBaristaName(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-100 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition text-zinc-500 cursor-not-allowed" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Nama Kopi / Beans</label>
                <select 
                  required
                  value={materialId}
                  onChange={(e) => setMaterialId(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition appearance-none" 
                >
                  <option value="" disabled>Pilih Beans (Material)</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.stock} {m.unit})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 text-amber-800 text-sm flex flex-col sm:flex-row gap-4 justify-between items-start">
            <div>
              <span className="font-bold">PANDUAN PENGISIAN:</span> Timbang kopi bubuk (Dose) dan hasil ekstraksi (Yield) pada setiap kali percobaan (Trial). Isi parameter fisik secara detail, lalu beri tanda centang (✓) pada aspek evaluasi rasa dan indikator kelulusan.
            </div>
            <div className="bg-white/60 px-4 py-2 rounded-xl whitespace-nowrap shrink-0 border border-amber-100 shadow-sm">
              <span className="font-bold block text-xs uppercase text-amber-600/80 mb-1">Target Acuan</span>
              Dose 18g (±0.2g) | Yield 50g (±2g)<br/>Ratio 1:2.78 | Waktu 38-45s (Max 50s)
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#5c4033] text-white">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-center border-b border-r border-[#4a3329]" rowSpan={2}>Trial<br/>Ke-</th>
                    <th className="px-4 py-3 font-semibold text-center border-b border-r border-[#4a3329]" rowSpan={2}>Grind<br/>Size</th>
                    <th className="px-4 py-3 font-semibold text-center border-b border-r border-[#4a3329]" rowSpan={2}>Dose<br/>Ditimbang<br/>(Gram)</th>
                    <th className="px-4 py-3 font-semibold text-center border-b border-r border-[#4a3329]" rowSpan={2}>Yield<br/>Ditimbang<br/>(Gram)</th>
                    <th className="px-4 py-3 font-semibold text-center border-b border-r border-[#4a3329]" rowSpan={2}>Waktu<br/>(Detik)</th>
                    <th className="px-4 py-2 font-semibold text-center border-b border-r border-[#4a3329]" colSpan={4}>Evaluasi Rasa (Sensory)</th>
                    <th className="px-4 py-3 font-semibold text-center border-b border-[#4a3329]" rowSpan={2}>Status<br/>(Lulus/<br/>Gagal)</th>
                  </tr>
                  <tr>
                    <th className="px-2 py-2 font-medium text-center border-b border-r border-[#4a3329] text-xs">Sweetness<br/>(✓/✗)</th>
                    <th className="px-2 py-2 font-medium text-center border-b border-r border-[#4a3329] text-xs">Body<br/>(✓/✗)</th>
                    <th className="px-2 py-2 font-medium text-center border-b border-r border-[#4a3329] text-xs">Clean<br/>(✓/✗)</th>
                    <th className="px-2 py-2 font-medium text-center border-b border-r border-[#4a3329] text-xs">Milk Match<br/>(✓/✗)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {trials.map((trial, index) => (
                    <tr key={index} className="hover:bg-zinc-50 transition">
                      <td className="px-4 py-3 text-center font-bold text-zinc-500 border-r border-zinc-200">{trial.trialNumber}</td>
                      <td className="px-2 py-2 border-r border-zinc-200">
                        <input type="text" value={trial.grindSize} onChange={e => handleTrialChange(index, 'grindSize', e.target.value)} className="w-full bg-transparent border-none text-center focus:ring-0 p-1" placeholder="-" />
                      </td>
                      <td className="px-2 py-2 border-r border-zinc-200">
                        <input type="number" step="0.1" value={trial.dose || ''} onChange={e => handleTrialChange(index, 'dose', parseFloat(e.target.value) || 0)} className="w-full bg-transparent border-none text-center focus:ring-0 p-1" placeholder="0" />
                      </td>
                      <td className="px-2 py-2 border-r border-zinc-200">
                        <input type="number" step="0.1" value={trial.yield || ''} onChange={e => handleTrialChange(index, 'yield', parseFloat(e.target.value) || 0)} className="w-full bg-transparent border-none text-center focus:ring-0 p-1" placeholder="0" />
                      </td>
                      <td className="px-2 py-2 border-r border-zinc-200">
                        <input type="number" value={trial.time || ''} onChange={e => handleTrialChange(index, 'time', parseInt(e.target.value) || 0)} className="w-full bg-transparent border-none text-center focus:ring-0 p-1" placeholder="0" />
                      </td>
                      <td className="px-2 py-2 border-r border-zinc-200 text-center">
                        <input type="checkbox" checked={trial.sweetness} onChange={e => handleTrialChange(index, 'sweetness', e.target.checked)} className="w-5 h-5 rounded border-zinc-300 text-blue-600 focus:ring-blue-600 cursor-pointer" />
                      </td>
                      <td className="px-2 py-2 border-r border-zinc-200 text-center">
                        <input type="checkbox" checked={trial.body} onChange={e => handleTrialChange(index, 'body', e.target.checked)} className="w-5 h-5 rounded border-zinc-300 text-blue-600 focus:ring-blue-600 cursor-pointer" />
                      </td>
                      <td className="px-2 py-2 border-r border-zinc-200 text-center">
                        <input type="checkbox" checked={trial.clean} onChange={e => handleTrialChange(index, 'clean', e.target.checked)} className="w-5 h-5 rounded border-zinc-300 text-blue-600 focus:ring-blue-600 cursor-pointer" />
                      </td>
                      <td className="px-2 py-2 border-r border-zinc-200 text-center">
                        <input type="checkbox" checked={trial.milkMatch} onChange={e => handleTrialChange(index, 'milkMatch', e.target.checked)} className="w-5 h-5 rounded border-zinc-300 text-blue-600 focus:ring-blue-600 cursor-pointer" />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button 
                          type="button"
                          onClick={() => handleTrialChange(index, 'passed', !trial.passed)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-colors ${trial.passed ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'}`}
                        >
                          {trial.passed ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              className="px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-600/90 transition shadow-sm active:scale-95"
            >
              Simpan Log Kalibrasi
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <Coffee className="w-6 h-6 text-blue-600" />
            Log Kalibrasi Espresso
          </h1>
          <p className="text-sm text-zinc-500">History of daily espresso calibrations</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-600/90 transition shadow-sm active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Log</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-zinc-200/60 shadow-sm">
          <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Coffee className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 mb-1">Belum ada Log Kalibrasi</h3>
          <p className="text-zinc-500 mb-6 max-w-md mx-auto">Mulai catat parameter espresso harian untuk menjaga konsistensi kualitas kopi Anda.</p>
          <button 
            onClick={() => setIsCreating(true)}
            className="text-blue-600 font-medium hover:text-blue-600/80 transition"
          >
            Buat Log Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {logs.map((log: any) => (
            <div key={log.id} className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-6 flex flex-col relative group">
              <button 
                onClick={() => handleDelete(log.id)}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-zinc-900 text-lg">{log.material?.name || log.beansName}</h3>
                  <div className="text-sm text-zinc-500 flex items-center gap-2 mt-1">
                    <span className="font-medium bg-zinc-100 px-2 py-0.5 rounded text-zinc-700">{format(new Date(log.date), 'dd MMM yyyy')}</span>
                    <span>• Shift {log.shift}</span>
                  </div>
                </div>
                <div className="text-right pr-8">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Barista</span>
                  <p className="font-medium text-zinc-900">{log.baristaName}</p>
                </div>
              </div>
              
              <div className="mt-4 border-t border-zinc-100 pt-4 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Trial Results</p>
                <div className="space-y-2">
                  {log.trials?.map((trial: any, idx: number) => (
                    <div key={trial.id || idx} className="flex items-center justify-between text-sm p-2 rounded-lg bg-zinc-50/50">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-500 shrink-0">
                          {trial.trialNumber}
                        </span>
                        <div className="flex gap-4">
                          <span className="text-zinc-600">Dose: <span className="font-medium text-zinc-900">{trial.dose}g</span></span>
                          <span className="text-zinc-600">Yield: <span className="font-medium text-zinc-900">{trial.yield}g</span></span>
                          <span className="text-zinc-600">Time: <span className="font-medium text-zinc-900">{trial.time}s</span></span>
                        </div>
                      </div>
                      <div>
                        {trial.passed ? (
                          <span className="flex items-center gap-1 text-green-600 font-medium text-xs bg-green-50 px-2 py-1 rounded-md">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Lulus
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-500 font-medium text-xs bg-red-50 px-2 py-1 rounded-md">
                            <XCircle className="w-3.5 h-3.5" /> Gagal
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
