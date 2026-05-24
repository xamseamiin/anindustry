// components/expenses/EditableExpenseForm.tsx
'use client';

import React, { useState } from 'react';
import { DollarSign, Tag, Calendar, CreditCard, Plus, MinusCircle, XCircle } from 'lucide-react';

// This component is a self-contained, editable form for a single expense object.
export const EditableExpenseForm = ({ initialExpense, onUpdate, onRemove, allAccounts, allProjects }: any) => {
  const [expense, setExpense] = useState(initialExpense);

  const handleInputChange = (field: string, value: any) => {
    const updatedExpense = { ...expense, [field]: value };
    setExpense(updatedExpense);
    onUpdate(updatedExpense);
  };

  const handleMaterialChange = (index: number, field: string, value: any) => {
    const updatedMaterials = [...expense.materials];
    updatedMaterials[index] = { ...updatedMaterials[index], [field]: value };
    
    // Recalculate total amount for material expenses
    const newTotal = updatedMaterials.reduce((sum: number, item: any) => sum + (Number(item.qty) * Number(item.price)), 0);
    
    const updatedExpense = { ...expense, materials: updatedMaterials, amount: newTotal };
    setExpense(updatedExpense);
    onUpdate(updatedExpense);
  };
  
  const addMaterial = () => {
    const updatedMaterials = [...expense.materials, { name: '', qty: 1, price: 0, unit: 'pcs' }];
    const updatedExpense = { ...expense, materials: updatedMaterials };
    setExpense(updatedExpense);
    onUpdate(updatedExpense);
  }

  const removeMaterial = (index: number) => {
    const updatedMaterials = expense.materials.filter((_: any, i: number) => i !== index);
     // Recalculate total amount after removal
    const newTotal = updatedMaterials.reduce((sum: number, item: any) => sum + (Number(item.qty) * Number(item.price)), 0);
    const updatedExpense = { ...expense, materials: updatedMaterials, amount: newTotal };
    setExpense(updatedExpense);
    onUpdate(updatedExpense);
  }

  return (
    <div className="p-6 border-2 border-lightGray dark:border-gray-700 rounded-xl mb-6 bg-white dark:bg-gray-800 relative animate-fade-in-up">
        <button onClick={onRemove} title="Ka saar kharashkan liiska" className="absolute top-4 right-4 text-redError hover:bg-redError/10 p-1 rounded-full transition-colors"><XCircle size={24}/></button>
        <h3 className="text-xl font-bold text-primary mb-4">Kharashka Kooxda: #{initialExpense.groupId}</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category */}
            <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Nooca Kharashka</label>
                <div className="relative mt-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-mediumGray" size={16}/>
                    <input type="text" readOnly value={expense.category} className="w-full p-2 pl-9 rounded-md bg-lightGray dark:bg-gray-700 cursor-not-allowed border-none" title="Nooca Kharashka" />
                </div>
            </div>
             {/* Date */}
            <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Taariikhda</label>
                 <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-mediumGray" size={16}/>
                    <input type="date" value={expense.date} onChange={e => handleInputChange('date', e.target.value)} className="w-full p-2 pl-9 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600" title="Taariikhda Kharashka" />
                </div>
            </div>
             {/* Paid From */}
            <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Laga Bixiyay</label>
                 <div className="relative mt-1">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-mediumGray" size={16}/>
                    <select value={expense.paidFrom} onChange={e => handleInputChange('paidFrom', e.target.value)} className="w-full p-2 pl-9 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 appearance-none" title="Dooro Akoonka Laga Bixiyay">
                        <option value="">-- Dooro Akoon --</option>
                        {allAccounts.map((acc: any) => <option key={acc.id} value={acc.name}>{acc.name}</option>)}
                    </select>
                </div>
            </div>
        </div>

        {/* Dynamic Fields based on Category */}
        <div className="mt-4 pt-4 border-t dark:border-gray-700">
            {expense.category === 'Material' ? (
                <div>
                    <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">Faahfaahinta Alaabta</h4>
                    {expense.materials.map((mat: any, index: number) => (
                        <div key={index} className="grid grid-cols-10 gap-2 mb-2 items-center">
                            <input type="text" placeholder="Magaca Alaabta" value={mat.name} onChange={e => handleMaterialChange(index, 'name', e.target.value)} className="col-span-4 p-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600"/>
                            <input type="number" placeholder="Tirada" value={mat.qty} onChange={e => handleMaterialChange(index, 'qty', e.target.value)} className="col-span-2 p-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600"/>
                            <input type="number" placeholder="Qiimaha" value={mat.price} onChange={e => handleMaterialChange(index, 'price', e.target.value)} className="col-span-2 p-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600"/>
                            <input type="text" placeholder="Cutubka" value={mat.unit} onChange={e => handleMaterialChange(index, 'unit', e.target.value)} className="col-span-1 p-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600"/>
                            <button type="button" onClick={() => removeMaterial(index)} className="col-span-1 text-redError hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full p-1 transition-colors" title="Ka saar alaabta"><MinusCircle/></button>
                        </div>
                    ))}
                    <button type="button" onClick={addMaterial} className="text-primary font-semibold flex items-center mt-2 p-1" title="Ku dar alaab cusub"><Plus size={16} className="mr-1"/>Ku dar Alaab</button>
                </div>
            ) : (
                <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Qiimaha</label>
                    <div className="relative mt-1">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-mediumGray" size={16}/>
                        <input type="number" value={expense.amount} onChange={e => handleInputChange('amount', parseFloat(e.target.value) || 0)} className="w-full p-2 pl-9 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600" title="Qiimaha Kharashka" />
                    </div>
                </div>
            )}
        </div>
         <div className="mt-4 pt-4 border-t dark:border-gray-700 flex justify-end items-center">
            <span className="font-semibold text-gray-700 dark:text-gray-200">Wadarta Kharashka:</span>
            <span className="text-2xl font-bold text-redError ml-4">
                ${(expense.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
        </div>
    </div>
  );
};