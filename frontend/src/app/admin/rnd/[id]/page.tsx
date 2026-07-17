"use client";

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Save, ArrowLeft, Plus, Trash2, CheckCircle, X, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function RnDDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const [recipe, setRecipe] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{text: string, type: 'success'|'error'|'warning'} | null>(null);
  const [showPromoteConfirm, setShowPromoteConfirm] = useState(false);
  const [promoteForm, setPromoteForm] = useState({ price: '', category: 'Coffee' });
  const [historyToApply, setHistoryToApply] = useState<number | null>(null);

  const updateTargetCost = (updates: Partial<any>) => {
    setRecipe((prev: any) => {
      if (!prev) return prev;
      const nextRecipe = { ...prev, ...updates };
      const sPrice = nextRecipe.sellingPrice || 0;
      const cType = nextRecipe.targetCostType || 'nominal';
      const cVal = nextRecipe.targetCostValue || 0;
      
      nextRecipe.targetCost = cType === 'percentage' ? sPrice * (cVal / 100) : cVal;
      return nextRecipe;
    });
  };

  const showToast = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const { data: materials } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const res = await axios.get('/api/materials');
      return res.data?.$values || res.data || [];
    }
  });

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const res = await axios.get(`/api/rnd/${id}`);
        const recipeData = res.data;
        if (recipeData.ingredients && recipeData.ingredients.$values) {
          recipeData.ingredients = recipeData.ingredients.$values;
        }
        if (recipeData.testHistories && recipeData.testHistories.$values) {
          recipeData.testHistories = recipeData.testHistories.$values;
        }
        
        // Sort test histories by TestedAt desc
        if (recipeData.testHistories) {
          recipeData.testHistories.sort((a: any, b: any) => new Date(b.testedAt).getTime() - new Date(a.testedAt).getTime());
        }

        setRecipe(recipeData);
      } catch (e) {
        showToast("Recipe not found", "error");
        router.push('/admin/rnd');
      }
    };
    fetchRecipe();
  }, [id, router]);

  if (!recipe) return <div className="p-6">Loading data...</div>;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Hitung ulang targetCost berdasarkan ingredients
      const newActualCost = recipe.ingredients?.reduce((acc: number, ing: any) => acc + ((parseFloat(ing.quantity) || 0) * ing.costPerUnit), 0) || 0;
      const updatedRecipe = { 
        ...recipe, 
        actualCost: newActualCost,
        ingredients: recipe.ingredients?.map((ing: any) => ({
          id: ing.id,
          materialId: ing.materialId,
          quantity: parseFloat(ing.quantity) || 0,
          unit: ing.unit,
          costPerUnit: ing.costPerUnit,
          rnDRecipeId: recipe.id
        }))
      };

      await axios.put(`/api/rnd/${recipe.id}`, updatedRecipe);
      setRecipe(updatedRecipe);
      showToast('Saved!', 'success');
    } catch(e) {
      showToast('Failed to save', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestRecipe = async (deductStock: boolean = true) => {
    setIsTesting(true);
    try {
      const newActualCost = recipe.ingredients?.reduce((acc: number, ing: any) => acc + ((parseFloat(ing.quantity) || 0) * ing.costPerUnit), 0) || 0;
      const updatedRecipe = { 
        ...recipe, 
        actualCost: newActualCost,
        ingredients: recipe.ingredients?.map((ing: any) => ({
          id: ing.id,
          materialId: ing.materialId,
          quantity: parseFloat(ing.quantity) || 0,
          unit: ing.unit,
          costPerUnit: ing.costPerUnit,
          rnDRecipeId: recipe.id
        }))
      };

      // Save first
      await axios.put(`/api/rnd/${recipe.id}`, updatedRecipe);

      // Run Test
      await axios.post(`/api/rnd/${recipe.id}/test`, { deductStock });
      showToast(deductStock ? 'Test executed! Stock deducted.' : 'Test executed! No stock deducted.', 'success');
      
      // Refresh
      const freshRes = await axios.get(`/api/rnd/${id}`);
      const recipeData = freshRes.data;
      if (recipeData.ingredients && recipeData.ingredients.$values) recipeData.ingredients = recipeData.ingredients.$values;
      if (recipeData.testHistories && recipeData.testHistories.$values) recipeData.testHistories = recipeData.testHistories.$values;
      if (recipeData.testHistories) recipeData.testHistories.sort((a: any, b: any) => new Date(b.testedAt).getTime() - new Date(a.testedAt).getTime());
      
      setRecipe(recipeData);
    } catch(e: any) {
      const errResponse = e.response?.data;
      const errMsg = typeof errResponse === 'string' ? errResponse : (errResponse?.error || 'Failed to test recipe');
      showToast(errMsg, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleUpdateTestNotes = async (historyId: number, notes: string) => {
    try {
      await axios.put(`/api/rnd/history/${historyId}`, { notes });
      showToast('Tasting notes saved', 'success');
    } catch(e: any) {
      const errResponse = e.response?.data;
      const errMsg = typeof errResponse === 'string' ? errResponse : (errResponse?.error || 'Failed to save notes');
      showToast(errMsg, 'error');
    }
  };

  const handleApplyHistory = (historyId: number) => {
    setHistoryToApply(historyId);
  };

  const confirmApplyHistory = async () => {
    if (historyToApply === null) return;
    try {
      await axios.post(`/api/rnd/${recipe.id}/apply-history/${historyToApply}`);
      showToast('Recipe reverted to test version', 'success');
      
      const freshRes = await axios.get(`/api/rnd/${id}`);
      const recipeData = freshRes.data;
      if (recipeData.ingredients && recipeData.ingredients.$values) recipeData.ingredients = recipeData.ingredients.$values;
      if (recipeData.testHistories && recipeData.testHistories.$values) recipeData.testHistories = recipeData.testHistories.$values;
      if (recipeData.testHistories) recipeData.testHistories.sort((a: any, b: any) => new Date(b.testedAt).getTime() - new Date(a.testedAt).getTime());
      setRecipe(recipeData);

    } catch(e: any) {
      const errResponse = e.response?.data;
      const errMsg = typeof errResponse === 'string' ? errResponse : (errResponse?.error || 'Failed to apply version');
      showToast(errMsg, 'error');
    } finally {
      setHistoryToApply(null);
    }
  };

  const handlePromote = () => {
    const defaultPrice = recipe?.sellingPrice > 0 ? recipe.sellingPrice : recipe?.targetCost;
    setPromoteForm({ price: defaultPrice?.toString() || '0', category: 'Coffee' });
    setShowPromoteConfirm(true);
  };

  const confirmPromote = async () => {
    setShowPromoteConfirm(false);
    try {
      await axios.post(`/api/rnd/${recipe.id}/promote`, { 
        price: parseFloat(promoteForm.price) || 0, 
        categoryName: promoteForm.category 
      }); 
      showToast('Recipe promoted to Product successfully!', 'success');
      router.push('/admin/items');
    } catch(e: any) {
      const errResponse = e.response?.data;
      const errMsg = typeof errResponse === 'string' ? errResponse : (errResponse?.error || 'Failed to promote');
      showToast(errMsg, 'error');
    }
  };

  const addIngredient = () => {
    if (!materials || materials.length === 0) {
      showToast("No raw materials available. Please add some on the Materials page first.", "warning");
      return;
    }
    const defaultMaterial = materials[0];
    
    setRecipe({
      ...recipe,
      ingredients: [
        ...(recipe.ingredients || []),
        {
          materialId: defaultMaterial.id,
          material: defaultMaterial,
          quantity: "",
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
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-top-2 fade-in duration-300 flex items-center gap-3
          ${toastMessage.type === 'success' ? 'bg-emerald-500 border-emerald-600 text-white' : 
            toastMessage.type === 'error' ? 'bg-red-500 border-red-600 text-white' : 
            'bg-amber-500 border-amber-600 text-white'}`}
        >
          {toastMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : 
           toastMessage.type === 'error' ? <X className="w-5 h-5" /> : 
           <AlertTriangle className="w-5 h-5" />}
          <p className="font-medium text-sm">{toastMessage.text}</p>
        </div>
      )}

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
                <Input 
                  label="Harga Jual (Rp)"
                  type="number"
                  value={recipe.sellingPrice !== undefined && recipe.sellingPrice !== null ? recipe.sellingPrice : ''} 
                  onChange={(e) => {
                    const val = e.target.value;
                    updateTargetCost({ sellingPrice: val === '' ? 0 : parseFloat(val) });
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Status</label>
                <CustomSelect 
                  className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm bg-white"
                  value={recipe.status}
                  onChange={(val) => setRecipe({...recipe, status: val})}
                  options={recipe.status === 'Approved' ? [
                    { value: 'Approved', label: 'Approved' }
                  ] : [
                    { value: 'Draft', label: 'Draft' },
                    { value: 'Tested', label: 'Tested' },
                    { value: 'Rejected', label: 'Rejected' }
                  ]}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Format Target COGS</label>
                <CustomSelect 
                  className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm bg-white"
                  value={recipe.targetCostType || 'nominal'}
                  onChange={(val) => updateTargetCost({ targetCostType: val })}
                  options={[
                    { value: 'nominal', label: 'Nominal (Rp)' },
                    { value: 'percentage', label: 'Persentase (%)' }
                  ]}
                />
              </div>
              <div>
                <Input 
                  label={recipe.targetCostType === 'percentage' ? 'Target COGS (%)' : 'Target COGS (Rp)'}
                  type="number"
                  value={recipe.targetCostValue !== undefined ? recipe.targetCostValue : recipe.targetCost} 
                  onChange={(e) => updateTargetCost({ targetCostValue: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            {recipe.targetCostType === 'percentage' && recipe.sellingPrice > 0 && (
              <div className="text-xs text-zinc-500 mt-1">
                Setara dengan: <span className="font-semibold text-zinc-700">Rp {recipe.targetCost.toLocaleString('id-ID')}</span>
              </div>
            )}
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
          <div className="flex gap-2">
            <Button onClick={() => handleTestRecipe(true)} disabled={isTesting || !recipe.ingredients?.length} className="py-1.5 px-3 text-sm bg-brand-sage hover:bg-brand-sage/90 text-white border-none shadow-md shadow-brand-sage/20">
              {isTesting ? 'Testing...' : 'Test & Deduct Stock'}
            </Button>
            <Button onClick={() => handleTestRecipe(false)} disabled={isTesting || !recipe.ingredients?.length} className="py-1.5 px-3 text-sm bg-blue-500 hover:bg-blue-600 text-white border-none shadow-md shadow-blue-500/20">
              Test (No Deduction)
            </Button>
            <Button onClick={addIngredient} variant="secondary" className="py-1.5 px-3 text-sm border-zinc-200">
              <Plus className="w-4 h-4 mr-1" /> Add Material
            </Button>
          </div>
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
                  <CustomSelect 
                    className="w-full border border-zinc-200 rounded-md p-1.5 text-sm bg-white"
                    value={ing.materialId.toString()}
                    onChange={(val) => updateIngredient(idx, 'materialId', val)}
                    options={materials?.map((m: any) => ({ value: m.id.toString(), label: m.name })) || []}
                  />
                </td>
                <td className="px-3 py-2">
                  <input 
                    className="w-full border border-zinc-200 rounded-md p-1.5 text-sm"
                    type="number" 
                    value={ing.quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateIngredient(idx, 'quantity', val === '' ? '' : parseFloat(val));
                    }}
                  />
                </td>
                <td className="px-3 py-2 text-zinc-500">
                  {ing.unit}
                </td>
                <td className="px-3 py-2 text-right text-zinc-500">
                  Rp {ing.costPerUnit?.toLocaleString('id-ID')}
                </td>
                <td className="px-3 py-2 text-right font-medium">
                  Rp {((parseFloat(ing.quantity) || 0) * (ing.costPerUnit || 0)).toLocaleString('id-ID')}
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
            <tr className="bg-zinc-50/50 text-xs md:text-sm">
              <td colSpan={4} className="px-3 py-3 font-bold text-right">
                <div className="flex flex-col items-end">
                  <span>Estimasi COGS (Harga Rata-Rata):</span>
                  <span className="text-[10px] text-zinc-400 font-normal normal-case mt-0.5">
                    *Menggunakan biaya rata-rata bahan baku saat ini
                  </span>
                </div>
              </td>
              <td className="px-3 py-3 font-bold text-right text-brand-sage whitespace-nowrap">
                {(() => {
                  const actualCost = recipe.ingredients?.reduce((acc: number, ing: any) => acc + ((parseFloat(ing.quantity) || 0) * ing.costPerUnit), 0) || 0;
                  const cogsPercent = recipe.sellingPrice > 0 ? (actualCost / recipe.sellingPrice) * 100 : 0;
                  const profitPercent = recipe.sellingPrice > 0 ? ((recipe.sellingPrice - actualCost) / recipe.sellingPrice) * 100 : 0;
                  return (
                    <div>
                      <div>Rp {actualCost.toLocaleString('id-ID')}</div>
                      {recipe.sellingPrice > 0 && (
                        <div className="text-[10px] text-zinc-500 font-medium normal-case">
                          (COGS: {cogsPercent.toFixed(1)}% | Keuntungan: {profitPercent.toFixed(1)}%)
                        </div>
                      )}
                    </div>
                  );
                })()}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </Card>

      {/* Test History Section */}
      <Card className="p-6 mt-6">
        <h2 className="text-lg font-bold mb-4">Test History & Reviews</h2>
        {(!recipe.testHistories || recipe.testHistories.length === 0) ? (
          <div className="text-zinc-500 text-sm text-center py-6 bg-zinc-50 rounded-lg border border-dashed border-zinc-200">No tests have been run yet. Add materials and click "Test & Deduct Stock".</div>
        ) : (
          <div className="space-y-4">
            {recipe.testHistories.map((test: any) => (
              <div key={test.id} className="border border-zinc-200 rounded-xl p-4 bg-white shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded text-sm">{test.testVersion}</h3>
                    <p className="text-xs text-zinc-500">{new Date(test.testedAt).toLocaleString()}</p>
                  </div>
                  <label className="text-xs font-semibold text-zinc-600 block mb-1 uppercase tracking-wider">Tasting Notes / Feedback</label>
                  <textarea
                    className="w-full border border-zinc-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500 bg-zinc-50"
                    rows={2}
                    placeholder="E.g., Too sweet, needs more salt..."
                    defaultValue={test.notes}
                    onBlur={(e) => handleUpdateTestNotes(test.id, e.target.value)}
                  />
                </div>
                <div className="md:w-48 text-right flex flex-col justify-between items-end border-t md:border-t-0 md:border-l border-zinc-100 pt-4 md:pt-0 md:pl-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Biaya Riil FIFO (Saat Tes)</p>
                    <p className="font-bold text-brand-sage text-lg">Rp {test.actualCost.toLocaleString('id-ID')}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="text-xs py-1 h-8 mt-2 w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                    onClick={() => handleApplyHistory(test.id)}
                  >
                    Use this version
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Custom Confirm Modal for Promote */}
      {showPromoteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">Promote to Menu?</h3>
              <p className="text-zinc-500 text-sm leading-relaxed mb-4">
                You are about to promote <span className="font-semibold text-zinc-700">{recipe.name}</span> to a real product. Please specify its initial selling price and category.
              </p>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Selling Price (Rp)</label>
                  <Input 
                    type="number" 
                    value={promoteForm.price} 
                    onChange={e => setPromoteForm({...promoteForm, price: e.target.value})} 
                    placeholder="e.g. 25000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Category</label>
                  <CustomSelect
                    value={promoteForm.category}
                    onChange={(val) => setPromoteForm({...promoteForm, category: val})}
                    options={[
                      { label: "Coffee", value: "Coffee" },
                      { label: "Non-Coffee", value: "Non-Coffee" },
                      { label: "Tea", value: "Tea" },
                      { label: "Food", value: "Food" },
                      { label: "Snack", value: "Snack" },
                      { label: "Add-on", value: "Add-on" },
                      { label: "Topping", value: "Topping" }
                    ]}
                    className="bg-white border border-zinc-200 text-zinc-900 rounded-lg px-3 py-2 flex items-center h-10 w-full"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowPromoteConfirm(false)} className="flex-1 border-zinc-200 text-zinc-600 hover:bg-zinc-50">
                  Cancel
                </Button>
                <Button onClick={confirmPromote} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Yes, Promote it!
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal for Revert Recipe */}
      {historyToApply !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">Revert Recipe?</h3>
              <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                Are you sure you want to revert the recipe ingredients to this test version? This will overwrite the current material composition for this recipe.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setHistoryToApply(null)} className="flex-1 border-zinc-200 text-zinc-600 hover:bg-zinc-50">
                  Cancel
                </Button>
                <Button onClick={confirmApplyHistory} className="flex-1 bg-brand-sage hover:bg-brand-sage/90 border-none shadow-md shadow-brand-sage/20 text-white">
                  Yes, Revert it
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
