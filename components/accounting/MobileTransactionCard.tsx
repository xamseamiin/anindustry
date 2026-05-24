import React from 'react';
import Link from 'next/link';
import {
    TrendingUp, TrendingDown, Info as InfoIcon, CheckCircle, Scale,
    User as UserIcon, Briefcase as BriefcaseIcon, Truck, Users,
    Eye, Edit, Trash2, DollarSign, XCircle, Calendar, Banknote
} from 'lucide-react';

interface Transaction {
    id: string;
    description: string;
    amount: number;
    type: string;
    transactionDate: string;
    note?: string;
    account?: { name: string; };
    project?: { name: string; };
    vendor?: { name: string; };
    customer?: { name: string; };
    employee?: { fullName: string; };
    user?: { fullName: string; };
}

interface MobileTransactionCardProps {
    transaction: Transaction;
    onEdit?: (trx: any) => void;
    onDelete?: (id: string) => void;
}

const MobileTransactionCard: React.FC<MobileTransactionCardProps> = ({ transaction, onEdit, onDelete }) => {
    const isIncome = transaction.type === 'INCOME' || transaction.type === 'TRANSFER_IN' || transaction.type === 'DEBT_REPAID';
    const amountColorClass = isIncome ? 'text-secondary' : 'text-redError';
    let borderColor = 'border-lightGray dark:border-gray-700';
    if (isIncome) borderColor = 'border-secondary';
    else borderColor = 'border-redError';

    // Enhanced type badge
    let typeBadgeClass = '';
    let typeIcon = null;
    let typeDisplayText = transaction.type;

    switch (transaction.type) {
        case 'INCOME':
        case 'TRANSFER_IN':
            typeBadgeClass = 'bg-secondary/10 text-secondary border border-secondary/20';
            typeIcon = <TrendingUp size={12} className="mr-1" />;
            typeDisplayText = transaction.type === 'INCOME' ? 'Dakhli' : 'Wareeji (Soo Gal)';
            break;
        case 'EXPENSE':
        case 'TRANSFER_OUT':
            typeBadgeClass = 'bg-redError/10 text-redError border border-redError/20';
            typeIcon = <TrendingDown size={12} className="mr-1" />;
            typeDisplayText = transaction.type === 'EXPENSE' ? 'Kharash' : 'Wareeji (Bax)';
            break;
        case 'DEBT_TAKEN':
            typeBadgeClass = 'bg-orange-500/10 text-orange-600 border border-orange-500/20';
            typeIcon = <Scale size={12} className="mr-1" />;
            typeDisplayText = 'Deyn La Qaatay';
            break;
        case 'DEBT_REPAID':
            typeBadgeClass = 'bg-blue-500/10 text-blue-600 border border-blue-500/20';
            typeIcon = <CheckCircle size={12} className="mr-1" />;
            typeDisplayText = 'Deyn La Bixiyay';
            break;
        default:
            typeBadgeClass = 'bg-primary/10 text-primary border border-primary/20';
            typeIcon = <InfoIcon size={12} className="mr-1" />;
            typeDisplayText = transaction.type;
    }

    return (
        <div className={`bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border-l-2 ${borderColor}`}>
            {/* Header with amount and actions */}
            <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0 pr-2">
                    <h4 className="font-semibold text-darkGray dark:text-gray-100 text-sm flex items-center space-x-1">
                        {isIncome ? <DollarSign size={14} className="text-secondary flex-shrink-0" /> : <XCircle size={14} className="text-redError flex-shrink-0" />}
                        <span className="break-words line-clamp-2">{transaction.description}</span>
                    </h4>
                </div>
                <div className="flex space-x-1 flex-shrink-0">
                    <Link href={`/projects/accounting/transactions/${transaction.id}`} className="p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="View">
                        <Eye size={14} />
                    </Link>
                    {onEdit && (
                        <button onClick={() => onEdit(transaction)} className="p-1.5 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Edit">
                            <Edit size={14} />
                        </button>
                    )}
                    {onDelete && (
                        <button onClick={() => onDelete(transaction.id)} className="p-1.5 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete">
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Amount - Prominent display */}
            <div className={`mb-2 text-base font-bold ${amountColorClass}`}>
                {isIncome ? '+' : '-'}ETB {Math.abs(transaction.amount).toLocaleString()}
            </div>

            {/* Transaction details */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-mediumGray dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                        <Calendar size={12} className="flex-shrink-0" />
                        <span>{new Date(transaction.transactionDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <Banknote size={12} className="flex-shrink-0" />
                        <span className="truncate max-w-[100px]">{transaction.account?.name || 'N/A'}</span>
                    </div>
                </div>

                <div className="flex items-center space-x-1">
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold flex items-center w-fit ${typeBadgeClass}`}>
                        {typeIcon}
                        {typeDisplayText}
                    </span>
                </div>

                {/* Context info */}
                {(transaction.project?.name || transaction.vendor?.name || transaction.customer?.name || transaction.employee?.fullName || transaction.user?.fullName) && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {transaction.type === 'DEBT_TAKEN' && transaction.vendor?.name && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100">
                                <Scale size={10} className="mr-0.5" />
                                Deyn: {transaction.vendor.name}
                            </span>
                        )}
                        {transaction.type === 'DEBT_TAKEN' && transaction.customer?.name && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100">
                                <Scale size={10} className="mr-0.5" />
                                Deyn: {transaction.customer.name}
                            </span>
                        )}
                        {transaction.type === 'DEBT_REPAID' && transaction.vendor?.name && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                                <CheckCircle size={10} className="mr-0.5" />
                                Bixiyay: {transaction.vendor.name}
                            </span>
                        )}
                        {transaction.type === 'DEBT_REPAID' && transaction.customer?.name && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                                <CheckCircle size={10} className="mr-0.5" />
                                Bixiyay: {transaction.customer.name}
                            </span>
                        )}

                        {transaction.project?.name && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                                <BriefcaseIcon size={10} className="mr-0.5" />
                                {transaction.project.name}
                            </span>
                        )}

                        {transaction.type !== 'DEBT_TAKEN' && transaction.type !== 'DEBT_REPAID' && (
                            <>
                                {transaction.vendor?.name && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100">
                                        <Truck size={10} className="mr-0.5" />
                                        {transaction.vendor.name}
                                    </span>
                                )}
                                {transaction.customer?.name && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                                        <UserIcon size={10} className="mr-0.5" />
                                        {transaction.customer.name}
                                    </span>
                                )}
                                {transaction.employee?.fullName && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                                        <Users size={10} className="mr-0.5" />
                                        {transaction.employee.fullName}
                                    </span>
                                )}
                            </>
                        )}

                        {transaction.user?.fullName && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                <UserIcon size={10} className="mr-0.5" />
                                {transaction.user.fullName}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MobileTransactionCard;
