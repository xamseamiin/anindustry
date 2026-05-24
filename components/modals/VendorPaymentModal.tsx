import React, { useState, useEffect } from 'react';
import { X, Loader2, DollarSign, Calendar, CreditCard, FileText, Briefcase } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface VendorPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    vendorId: string;
    vendorName: string;
    expenseId?: string;
    expenseAmount?: number;
    expenseDescription?: string;
    projectId?: string; // Link payment to the project the expense belongs to
}

interface PaymentFormData {
    amount: number;
    paymentDate: string;
    accountId: string;
    projectId: string; // Manually select project
    paymentMethod: string;
    reference?: string;
    note?: string;
}

const VendorPaymentModal: React.FC<VendorPaymentModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    vendorId,
    vendorName,
    expenseId,
    expenseAmount,
    expenseDescription,
    projectId,
}) => {
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<{ id: string; name: string; type: string }[]>([]);
    const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<PaymentFormData>({
        defaultValues: {
            amount: expenseAmount || 0,
            paymentDate: new Date().toISOString().split('T')[0],
            paymentMethod: 'Cash',
            projectId: projectId || '',
        }
    });

    // Reset form when modal opens or expense details change
    useEffect(() => {
        if (isOpen) {
            reset({
                amount: expenseAmount || 0,
                paymentDate: new Date().toISOString().split('T')[0],
                paymentMethod: 'Cash',
                accountId: watch('accountId') || '',
                projectId: projectId || '',
                reference: '',
                note: expenseDescription ? `Payment for: ${expenseDescription}` : '',
            });
            fetchAccounts();
            fetchProjects();
        }
    }, [isOpen, expenseAmount, expenseDescription, projectId, reset]);

    const fetchProjects = async () => {
        try {
            const response = await fetch('/api/projects');
            if (response.ok) {
                const data = await response.json();
                setProjects(data.projects || []);
            }
        } catch (err) {
            console.error('Failed to fetch projects', err);
        }
    };

    const fetchAccounts = async () => {
        try {
            const response = await fetch('/api/projects/accounting/accounts');
            if (response.ok) {
                const data = await response.json();
                setAccounts(data.accounts || []);
                // Set default account if available (e.g., first Cash account)
                const defaultAccount = data.accounts?.find((acc: any) => acc.type === 'Cash' || acc.name === 'Cash') || data.accounts?.[0];
                if (defaultAccount) {
                    setValue('accountId', defaultAccount.id);
                }
            }
        } catch (err) {
            console.error('Failed to fetch accounts', err);
        }
    };

    const onSubmit = async (data: PaymentFormData) => {
        setLoading(true);
        setError(null);

        try {
            const payload = {
                vendorId,
                amount: Number(data.amount),
                transactionDate: data.paymentDate,
                accountId: data.accountId,
                description: `Payment to ${vendorName}`,
                method: data.paymentMethod,
                reference: data.reference,
                note: data.note,
                expenseId: expenseId,
                projectId: data.projectId || null, // Use manually selected project or fallback to initial
                type: 'DEBT_REPAID'
            };

            const response = await fetch('/api/projects/accounting/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to process payment');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'An error occurred while processing the payment');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pay Vendor</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Recording payment to <span className="font-semibold text-primary">{vendorName}</span></p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                            {error}
                        </div>
                    )}

                    {expenseDescription && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 mb-4">
                            <p className="text-xs text-blue-600 dark:text-blue-300 font-semibold uppercase tracking-wider mb-1">Paying For</p>
                            <p className="text-sm text-blue-800 dark:text-blue-100 font-medium">{expenseDescription}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Amount (Br)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 font-semibold">Br</span>
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('amount', { required: 'Amount is required', min: { value: 0.01, message: 'Amount must be greater than 0' } })}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                                    placeholder="0.00"
                                />
                            </div>
                            {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="date"
                                        {...register('paymentDate', { required: 'Date is required' })}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Payment Method</label>
                                <select
                                    {...register('paymentMethod')}
                                    className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Check">Check</option>
                                    <option value="Mobile Money">Mobile Money</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Pay From Account</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <CreditCard size={16} className="text-gray-400" />
                                </div>
                                <select
                                    {...register('accountId', { required: 'Account is required' })}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                                >
                                    <option value="">Select Account</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                                    ))}
                                </select>
                            </div>
                            {errors.accountId && <p className="mt-1 text-xs text-red-500">{errors.accountId.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Link to Project (Optional)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Briefcase size={16} className="text-gray-400" />
                                </div>
                                <select
                                    {...register('projectId')}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                                >
                                    <option value="">No Project (General Debt)</option>
                                    {projects.map(proj => (
                                        <option key={proj.id} value={proj.id}>{proj.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ref / Note (Optional)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                                    <FileText size={16} className="text-gray-400" />
                                </div>
                                <textarea
                                    {...register('note')}
                                    rows={2}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                                    placeholder="e.g. Receipt #1234..."
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <DollarSign size={18} />}
                            {loading ? 'Processing...' : 'Confirm Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VendorPaymentModal;
