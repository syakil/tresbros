"use client";

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Save, ArrowLeft, Plus, Trash2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RnDDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [recipe, setRecipe] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: materials } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const res = await axios.get('/api/materials');
      return res.data;
    }
  });

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const res = await axios.get(`/api/rnd/${params.id}`);
        setRecipe(res.data);
      } catch (e) {
        alert("Recipe not found");
        router.push('/admin/rnd');
      }
    };
    fetchRecipe();
  }, [params.id, router]);

  if (!recipe) return <div className="p-6">Loading data...</div>;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Hitung ulang targetCost berdasarkan ingredients
      const newActualCost = recipe.ingredients?.reduce((acc: number, ing: any) => acc + (ing.quantity * ing.costPerUnit), 0) || 0;
      const updatedRecipe = { ...recipe, actualCost: newActualCost };

      await axios.put(`/api/rnd/${recipe.id}`, updatedRecipe);
      setRecipe(updatedRecipe);
      alert('Saved!');
    } catch(e) {
      alert('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePromote = async () => {
    if (confirm("Promote this recipe to a real product? Price and category will need to be configured later on the Products page.")) {
      try {
        await axios.post(`/api/rnd/${recipe.id}/promote`, { price: 0, categoryId: 1 }); // Default category 1
        alert('Recipe promoted to Product successfully!');
        router.push('/admin/items');
      } catch(e) {
        alert('Failed to promote');
      }
    }
  };

  const addIngredient = () => {
    if (!materials || materials.length === 0) return;
    const defaultMaterial = materials[0];
    
    setRecipe({
      ...recipe,
      ingredients: [
        ...(recipe.ingredients || []),
        {
          materialId: defaultMaterial.id,
          material: defaultMaterial,
          quantity: 1,
          unit: defaultMaterial.unit,
          costPerUnit: defaultMaterial.costPerUnit || 0
        }
      ]
    });
  };

  const removeIngredient = (index: number) => {
    const newIngredients = [...recipe.ingredients];
    newIngredients.splice(index, 1);
    setRecipe({ ...recipe, ingredients: newIngredients });
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const newIngredients = [...recipe.ingredients];
    newIngredients[index][field] = value;
    
    if (field === 'materialId') {
      const selectedMat = materials?.find((m: any) => m.id === parseInt(value));
      if (selectedMat) {
        newIngredients[index].material = selectedMat;
        newIngredients[index].unit = selectedMat.unit;
        newIngredients[index].costPerUnit = selectedMat.costPerUnit || 0;
      }
    }
    
    setRecipe({ ...recipe, ingredients: newIngredients });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/rnd" className="p-2 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-display font-bold text-zinc-900">R&D Details</h1>
        </div>
        <div className="flex gap-2">
          {recipe.status === 'Approved' ? (
            <div className="px-4 py-2 bg-green-100 text-green-700 font-medium rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5" /> Already a Product
            </div>
          ) : (
            <Button onClick={handlePromote} variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-none">
              <CheckCircle className="w-4 h-4 mr-2" />
              Promote to Menu
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <Input 
                label="Nama Resep"
                value={recipe.name} 
                onChange={(e) => setRecipe({...recipe, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Description & Experiment Goal</label>
              <textarea 
                className="w-full border border-zinc-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-sage/50"
                rows={3}
                value={recipe.description || ''}
                onChange={(e) => setRecipe({...recipe, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Status</label>
                <select 
                  className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm bg-white"
                  value={recipe.status}
                  onChange={(e) => setRecipe({...recipe, status: e.target.value})}
                >
                  <option value="Draft">Draft</option>
                  <option value="Tested">Tested</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div>
                <Input 
                  label="Target COGS (Rp)"
                  type="number"
                  value={recipe.targetCost} 
                  onChange={(e) => setRecipe({...recipe, targetCost: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">Notes / Tasting Notes</h2>
          <textarea 
            className="w-full border border-zinc-200 rounded-lg p-3 text-sm h-[200px] focus:outline-none focus:ring-2 focus:ring-brand-sage/50"
            placeholder="Write experiment results here (e.g., 'Not sweet enough, add 5g sugar')"
            value={recipe.notes || ''}
            onChange={(e) => setRecipe({...recipe, notes: e.target.value})}
          />
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Raw Material Simulation (COGS)</h2>
          <Button onClick={addIngredient} variant="secondary" className="py-1.5 px-3 text-sm">
            <Plus className="w-4 h-4 mr-1" /> Add Material
          </Button>
        </div>

        <table className="w-full text-sm text-left mb-4">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-3 py-2">Raw Material</th>
              <th className="px-3 py-2 w-32">Quantity</th>
              <th className="px-3 py-2">Unit</th>
              <th className="px-3 py-2 text-right">Price / Unit</th>
              <th className="px-3 py-2 text-right">Subtotal</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {recipe.ingredients?.map((ing: any, idx: number) => (
              <tr key={idx}>
                <td className="px-3 py-2">
                  <select 
                    className="w-full border border-zinc-200 rounded-md p-1.5 text-sm"
                    value={ing.materialId}
                    onChange={(e) => updateIngredient(idx, 'materialId', e.target.value)}
                  >
                    {materials?.map((m: any) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input 
                    className="w-full border border-zinc-200 rounded-md p-1.5 text-sm"
                    type="number" 
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(idx, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className="px-3 py-2 text-zinc-500">
                  {ing.unit}
                </td>
                <td className="px-3 py-2 text-right text-zinc-500">
                  Rp {ing.costPerUnit?.toLocaleString('id-ID')}
                </td>
                <td className="px-3 py-2 text-right font-medium">
                  Rp {((ing.quantity || 0) * (ing.costPerUnit || 0)).toLocaleString('id-ID')}
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => removeIngredient(idx)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-zinc-50/50">
              <td colSpan={4} className="px-3 py-3 font-bold text-right">Total Actual COGS:</td>
              <td className="px-3 py-3 font-bold text-right text-brand-sage">
                Rp {(recipe.ingredients?.reduce((acc: number, ing: any) => acc + (ing.quantity * ing.costPerUnit), 0) || 0).toLocaleString('id-ID')}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </Card>
    </div>
  );
}
