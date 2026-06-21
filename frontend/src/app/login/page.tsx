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
    <div className="min-h-screen bg-[#1c140d] flex items-center justify-center p-4 font-sans text-brand-cream relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-warm/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-sage/5 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md bg-black/40 border border-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-brand-warm/20 p-4 rounded-2xl mb-4 border border-brand-warm/30 shadow-[0_0_30px_rgba(212,163,115,0.2)]">
            <Coffee className="w-10 h-10 text-brand-warm" />
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-white">Tresbros</h1>
          <p className="text-brand-sage mt-2">Masuk ke sistem manajemen kasir</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-sage ml-1">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-brand-sage/60" />
              </div>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-brand-cream placeholder:text-brand-sage/40 focus:outline-none focus:border-brand-warm focus:ring-1 focus:ring-brand-warm/50 transition-all"
                placeholder="Masukkan username"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-sage ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <KeyRound className="w-5 h-5 text-brand-sage/60" />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-brand-cream placeholder:text-brand-sage/40 focus:outline-none focus:border-brand-warm focus:ring-1 focus:ring-brand-warm/50 transition-all"
                placeholder="Masukkan password"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full py-4 mt-2 justify-center text-lg font-bold shadow-lg shadow-brand-warm/20 hover:shadow-brand-warm/40 transition-all"
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Masuk Sekarang'}
          </Button>
        </form>
        
        <div className="mt-8 text-center text-xs text-brand-sage/50">
          <p>&copy; {new Date().getFullYear()} Tresbros Coffee. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
