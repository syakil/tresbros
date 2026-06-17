"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Coffee } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Dummy API Call (Akan diganti dengan Axios ke .NET Backend)
    setTimeout(() => {
      login(
        { id: 1, username: 'admin_kasir', role: 'KASIR' }, 
        'dummy_jwt_token_123'
      );
      router.push('/pos'); // Redirect ke Kasir setelah sukses
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-brand-olive rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(75,90,58,0.4)]">
            <Coffee className="w-10 h-10 text-brand-cream" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-brand-cream tracking-tight">Tres Bros</h1>
          <p className="text-brand-sage mt-2 text-sm md:text-base">Login Sistem Operasional (POS & KDS)</p>
        </div>

        {/* Login Form Card */}
        <Card variant="default" className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <Input 
              label="Username" 
              type="text" 
              placeholder="Masukkan username..." 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
            
            <Input 
              label="Password" 
              type="password" 
              placeholder="Masukkan password..." 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />

            <div className="pt-2">
              <Button 
                type="submit" 
                variant="primary" 
                fullWidth 
                disabled={isLoading}
              >
                {isLoading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
              </Button>
            </div>
          </form>
        </Card>
        
        {/* Footer */}
        <p className="text-center text-xs text-brand-sage/50 mt-10">
          &copy; {new Date().getFullYear()} Tres Bros Caffè. All rights reserved.
        </p>
      </div>
    </div>
  );
}
