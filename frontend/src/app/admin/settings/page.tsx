"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import axios from 'axios';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [extraShotPrice, setExtraShotPrice] = useState(3000);
  const [addToppingPrice, setAddToppingPrice] = useState(5000);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const resTax = await axios.get('/api/settings/TAX_ENABLED');
      setTaxEnabled(resTax.data.value === 'true');
    } catch (e) {}

    try {
      const resExtra = await axios.get('/api/settings/PRICE_EXTRA_SHOT');
      setExtraShotPrice(parseInt(resExtra.data.value, 10) || 3000);
    } catch (e) {}

    try {
      const resTopping = await axios.get('/api/settings/PRICE_ADD_TOPPING');
      setAddToppingPrice(parseInt(resTopping.data.value, 10) || 5000);
    } catch (e) {}
    
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post('/api/settings', {
        key: 'TAX_ENABLED',
        value: taxEnabled ? 'true' : 'false',
        dataType: 'bool'
      });

      await axios.post('/api/settings', {
        key: 'PRICE_EXTRA_SHOT',
        value: extraShotPrice.toString(),
        dataType: 'int'
      });

      await axios.post('/api/settings', {
        key: 'PRICE_ADD_TOPPING',
        value: addToppingPrice.toString(),
        dataType: 'int'
      });

      alert('Settings saved successfully!');
    } catch (error) {
      console.error("Failed to save settings", error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-zinc-500">Loading settings...</div>;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-display font-bold text-zinc-900">System Settings</h1>
        <p className="text-zinc-500">Restaurant operations and price configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border border-zinc-200 bg-white flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 mb-4">Tax Settings (PB1)</h2>
            <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-200">
              <div>
                <h3 className="font-semibold text-zinc-900">Enable 11% Tax</h3>
                <p className="text-sm text-zinc-500 mt-1">
                  If enabled, the system will automatically calculate an 11% tax (PB1) on every sales transaction in POS and Mobile.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={taxEnabled}
                  onChange={(e) => setTaxEnabled(e.target.checked)}
                />
                <div className="w-14 h-7 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-zinc-200 bg-white">
          <h2 className="text-xl font-bold text-zinc-900 mb-4">POS Add-on Pricing (Rp)</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Extra Shot Price</label>
              <input 
                type="number"
                value={extraShotPrice}
                onChange={(e) => setExtraShotPrice(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
              <p className="text-xs text-zinc-400 mt-1">Price added to item when 'Extra Shot' tag is selected.</p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Add Topping Price</label>
              <input 
                type="number"
                value={addToppingPrice}
                onChange={(e) => setAddToppingPrice(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
              <p className="text-xs text-zinc-400 mt-1">Price added to item when 'Add Topping' tag is selected.</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={saving} variant="primary" className="px-8 py-3.5 text-base font-bold shadow-md shadow-blue-500/20">
          <Save className="w-5 h-5 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
