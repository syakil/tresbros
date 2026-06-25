"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { Coffee, KeyRound, User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await axios.post('/api/auth/login', { username, password });
      if (data.success) {
        // Redirect to dashboard as requested by user
        window.location.href = '/admin/dashboard';
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal login. Silakan periksa kembali username dan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 font-sans text-zinc-900 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md bg-white border border-zinc-200 p-8 rounded-3xl shadow-xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-50 p-4 rounded-2xl mb-4 border border-blue-100 shadow-sm">
            <Coffee className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-zinc-900">Tres<span className="text-blue-600">bros</span></h1>
          <p className="text-zinc-500 mt-2">Masuk ke sistem manajemen kasir</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-6 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-zinc-400" />
              </div>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white border border-zinc-300 rounded-xl py-3.5 pl-12 pr-4 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
                placeholder="Masukkan username"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <KeyRound className="w-5 h-5 text-zinc-400" />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-zinc-300 rounded-xl py-3.5 pl-12 pr-4 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
                placeholder="Masukkan password"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full py-4 mt-2 justify-center text-lg font-bold shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 transition-all"
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Masuk Sekarang'}
          </Button>
        </form>
        
        <div className="mt-8 text-center text-xs text-zinc-400">
          <p>&copy; {new Date().getFullYear()} Tresbros Coffee. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
