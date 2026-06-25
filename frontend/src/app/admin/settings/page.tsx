"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import axios from 'axios';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/settings/TAX_ENABLED');
      setTaxEnabled(res.data.value === 'true');
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error("Failed to fetch settings", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post('/api/settings', {
        key: 'TAX_ENABLED',
        value: taxEnabled ? 'true' : 'false',
        dataType: 'bool'
      });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error("Failed to save settings", error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-brand-cream">Loading settings...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-brand-cream">System Settings</h1>
        <p className="text-brand-sage">Restaurant operations and tax configuration</p>
      </div>

      <Card className="p-6 max-w-2xl">
        <h2 className="text-xl font-bold text-brand-cream mb-4">Tax Settings (PB1)</h2>
        <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
          <div>
            <h3 className="font-semibold text-brand-cream">Enable 11% Tax</h3>
            <p className="text-sm text-brand-sage mt-1">
              If enabled, the system will automatically calculate an 11% tax (PB1) on every sales transaction in POS and Mobile.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={taxEnabled}
              onChange={(e) => setTaxEnabled(e.target.checked)}
            />
            <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-brand-cream after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-warm"></div>
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={saving} variant="primary">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
