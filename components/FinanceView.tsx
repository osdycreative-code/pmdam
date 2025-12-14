
import React, { useState, useMemo, useEffect } from 'react';
import { usePersistence, FinanceCategory } from '../src/context/CentralizedPersistenceContext';
import { Plus, Search, TrendingUp, TrendingDown, DollarSign, Calendar, ArrowUpRight, ArrowDownRight, Trash2, Wallet, Briefcase, Settings, FileText, CreditCard, Users, CheckCircle2, AlertCircle, Edit } from 'lucide-react';
import { TipoTransaccion, AccountPayable, AccountReceivable } from '../types';

type Tab = 'overview' | 'categories' | 'payable' | 'receivable';

export const FinanceView: React.FC = () => {
    const { 
        finances, projects, fetchFinances, loading,
        categories, fetchCategories, createCategory, deleteCategory,
        accountsPayable, fetchAccountsPayable, createAccountPayable, deleteAccountPayable,
        accountsReceivable, fetchAccountsReceivable, createAccountReceivable, deleteAccountReceivable,
        createFinance, updateFinance, deleteFinance 
    } = usePersistence();

    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<any>(null);
    
    // Overview Form State
    const [concepto, setConcepto] = useState('');
    const [monto, setMonto] = useState('');
    const [tipo, setTipo] = useState<TipoTransaccion>('Gasto');
    const [categoria, setCategory] = useState('');
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

    // Categories Form State
    const [newCatName, setNewCatName] = useState('');
    const [newCatType, setNewCatType] = useState<'Income'|'Expense'>('Expense');

    // AP/AR Form State (Shared for simplicity, distinct handlers)
    const [entityName, setEntityName] = useState('');
    const [apArAmount, setApArAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [description, setDescription] = useState('');
    const [invoiceNum, setInvoiceNum] = useState('');

    useEffect(() => {
        // Initial fetch handled by context, but we ensure cleanliness
    }, []);

    // --- Overview Logic ---
    const visibleTransactions = useMemo(() => {
        // No longer filter by project ID
        const filtered = finances;
        
        return filtered.filter(t => 
            t.concepto.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (t.categoria && t.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
        ).sort((a, b) => new Date(b.fecha_transaccion).getTime() - new Date(a.fecha_transaccion).getTime());
    }, [finances, searchTerm]); // Removed selectedProjectId dependency

    const summary = useMemo(() => {
        const income = visibleTransactions
            .filter(t => t.tipo_transaccion === 'Ingreso')
            .reduce((sum, t) => sum + Number(t.monto), 0);
        const expense = visibleTransactions
            .filter(t => t.tipo_transaccion === 'Gasto')
            .reduce((sum, t) => sum + Number(t.monto), 0);
        return {
            income,
            expense,
            balance: income - expense
        };
    }, [visibleTransactions]);

    const handleProjectChange = (projectId: number | '') => {
        setSelectedProjectId(projectId);
        if (projectId) {
            fetchFinances(projectId);
        }
    };

    const handleCreateTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTransaction) {
                await updateFinance(editingTransaction.id, {
                    concepto,
                    monto: Number(monto),
                    tipo_transaccion: tipo,
                    categoria,
                    fecha_transaccion: fecha
                });
            } else {
                await createFinance({
                    proyecto_id: undefined, // No project association enforced
                    concepto: finalConcept,
                    monto: Number(monto),
                    tipo_transaccion: tipo,
                    categoria,
                    fecha_transaccion: fecha
                });
            }
            setIsModalOpen(false);
            setEditingTransaction(null);
            // Reset
            setConcepto(''); setMonto(''); setCategory('');
        } catch (err) { console.error(err); }
    };

    const handleEditClick = (t: any) => {
        setEditingTransaction(t);
        setConcepto(t.concepto);
        setMonto(t.monto);
        setTipo(t.tipo_transaccion);
        setCategory(t.categoria);
        setFecha(t.fecha_transaccion ? t.fecha_transaccion.split('T')[0] : new Date().toISOString().split('T')[0]); // Handle potentially iso string
        setIsModalOpen(true);
    };

    // --- Categories Logic ---
    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if(newCatName.trim()) {
            await createCategory(newCatName, newCatType);
            setNewCatName('');
        }
    };

    // --- AP/AR Logic ---
    const handleCreateAPAR = async (e: React.FormEvent) => {
        e.preventDefault();
        const item = {
            name: entityName,
            description,
            totalAmount: Number(apArAmount),
            paidAmount: 0,
            balance: Number(apArAmount),
            dueDate: new Date(dueDate),
            invoiceNumber: invoiceNum,
            status: 'Pending'
        };

        if (activeTab === 'payable') {
            // Mapping to DB interface (simplified) in context
            await createAccountPayable({
                entity_name: entityName,
                description,
                amount: Number(apArAmount),
                due_date: dueDate,
                status: 'Pending',
                invoice_number: invoiceNum
            });
        } else {
             await createAccountReceivable({
                entity_name: entityName,
                description,
                amount: Number(apArAmount),
                due_date: dueDate,
                status: 'Pending',
                invoice_number: invoiceNum
            });
        }
        setIsModalOpen(false);
        setEntityName(''); setApArAmount(''); setDueDate(''); setDescription(''); setInvoiceNum('');
    };


    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    // --- Sub-Components for Tabs ---

    const renderOverview = () => (
        <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-50 border-b border-gray-200">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col transition-all duration-200">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Net Balance</span>
                    <div className="flex items-center justify-between">
                        <span className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-gray-900' : 'text-rose-600'}`}>
                            {formatCurrency(summary.balance)}
                        </span>
                        <div className={`p-2 rounded-full ${summary.balance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                <Wallet size={20} />
                        </div>
                    </div>
                </div>
                {/* ... other cards could go here ... */}
            </div>

            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                     <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none text-xs"
                        />
                    </div>
                </div>

                <button 
                    onClick={() => {
                         setEditingTransaction(null);
                         setConcepto(''); setMonto(''); setCategory('');
                         setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 font-medium text-xs shadow-sm"
                >
                    <Plus size={14} /> Add Transaction
                </button>
            </div>

            {/* Table */}
             <div className="flex-1 overflow-auto bg-gray-50/50 p-6">
                {visibleTransactions.length === 0 ? (
                    <div className="text-center text-gray-400 mt-20">No transactions found</div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                             <thead className="bg-gray-50 border-b border-gray-100">
                                 <tr>
                                     <th className="px-6 py-3 font-semibold text-gray-500">Concept</th>
                                     <th className="px-6 py-3 font-semibold text-gray-500">Category</th>
                                     <th className="px-6 py-3 font-semibold text-gray-500">Date</th>
                                     <th className="px-6 py-3 font-semibold text-gray-500 text-right">Amount</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-50">
                                 {visibleTransactions.map(t => (
                                     <tr key={t.id} className="hover:bg-gray-50">
                                         <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                                              <div className={`p-1 rounded-full ${t.tipo_transaccion === 'Ingreso' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                {t.tipo_transaccion === 'Ingreso' ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                                             </div>
                                             {t.concepto}
                                         </td>
                                         <td className="px-6 py-4">{t.categoria}</td>
                                         <td className="px-6 py-4 text-gray-500">{new Date(t.fecha_transaccion).toLocaleDateString()}</td>
                                         <td className={`px-6 py-4 text-right font-medium ${t.tipo_transaccion === 'Ingreso' ? 'text-emerald-600' : 'text-gray-900'}`}>
                                            <div className="flex items-center justify-end gap-3">
                                                 {formatCurrency(Number(t.monto))}
                                                 <button 
                                                    onClick={() => handleEditClick(t)} 
                                                    className="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                                                    title="Edit Transaction"
                                                 >
                                                     <Edit size={14} />
                                                 </button>
                                            </div>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );

    const renderCategories = () => (
        <div className="p-6 flex-1 overflow-auto bg-gray-50/50">
            <div className="max-w-4xl mx-auto">
                 <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
                     <h3 className="font-bold text-gray-800 mb-4">Manage Categories</h3>
                     <form onSubmit={handleCreateCategory} className="flex gap-4">
                         <input 
                            placeholder="New Category Name"
                            className="flex-1 border-gray-300 rounded-lg p-2 text-sm"
                            value={newCatName}
                            onChange={e => setNewCatName(e.target.value)}
                            title="New Category Name"
                         />
                         <select 
                            className="border-gray-300 rounded-lg p-2 text-sm"
                            value={newCatType}
                            onChange={(e: any) => setNewCatType(e.target.value)}
                            title="Category Type"
                         >
                             <option value="Expense">Expense</option>
                             <option value="Income">Income</option>
                         </select>
                         <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Add</button>
                     </form>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-3">
                         <h4 className="font-semibold text-gray-700 text-sm uppercase">Income Categories</h4>
                         {categories.filter(c => c.type === 'Income').map(c => (
                             <div key={c.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                 <span>{c.name}</span>
                                 <button onClick={() => deleteCategory(c.id)} className="text-gray-400 hover:text-red-500" title="Delete Category"><Trash2 size={14}/></button>
                             </div>
                         ))}
                     </div>
                     <div className="space-y-3">
                         <h4 className="font-semibold text-gray-700 text-sm uppercase">Expense Categories</h4>
                         {categories.filter(c => c.type === 'Expense').map(c => (
                             <div key={c.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                 <span>{c.name}</span>
                                 <button onClick={() => deleteCategory(c.id)} className="text-gray-400 hover:text-red-500" title="Delete Category"><Trash2 size={14}/></button>
                             </div>
                         ))}
                     </div>
                 </div>
            </div>
        </div>
    );

    const renderAPAR = (isPayable: boolean) => {
        const items = isPayable ? accountsPayable : accountsReceivable;
        const deleteFn = isPayable ? deleteAccountPayable : deleteAccountReceivable;
        const title = isPayable ? 'Accounts Payable' : 'Accounts Receivable';

        return (
             <div className="flex-1 overflow-auto bg-gray-50/50 p-6">
                 <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                        >
                            <Plus size={16}/> New Record
                        </button>
                    </div>

                    {items.length === 0 ? (
                        <div className="text-center text-gray-400 py-12">No records found.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map(item => (
                                <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-gray-900 line-clamp-1" title={item.name || (item as any).entity_name}>{item.name || (item as any).entity_name}</div>
                                        <div className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${(item as any).status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {(item as any).status || 'Pending'}
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(item.totalAmount || (item as any).amount)}</div>
                                    <div className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                                        <Calendar size={12}/> Due: {new Date(item.dueDate || (item as any).due_date).toLocaleDateString()}
                                    </div>
                                    
                                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                        <button onClick={() => deleteFn(item.id)} className="text-gray-400 hover:text-red-500 p-1" title="Delete Record"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                 </div>
             </div>
        );
    };


    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header with Tabs */}
            <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><DollarSign size={20}/></div>
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setActiveTab('overview')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'overview' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Overview
                        </button>
                        <button 
                            onClick={() => setActiveTab('categories')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'categories' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Categories
                        </button>
                        <button 
                            onClick={() => setActiveTab('payable')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'payable' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Payable
                        </button>
                        <button 
                            onClick={() => setActiveTab('receivable')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'receivable' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Receivable
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Switcher */}
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'categories' && renderCategories()}
            {activeTab === 'payable' && renderAPAR(true)}
            {activeTab === 'receivable' && renderAPAR(false)}

            {/* General Modal (reused for different purposes based on activeTab) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-[fadeIn_0.2s_ease-out]">
                        <h2 className="text-lg font-bold mb-6 text-gray-800">
                            {activeTab === 'overview' ? (editingTransaction ? 'Edit Transaction' : 'New Transaction') : activeTab === 'payable' ? 'New Bill' : 'New Invoice'}
                        </h2>
                        
                        {activeTab === 'overview' ? (
                            <form onSubmit={handleCreateTransaction} className="space-y-5">
                                 {/* Overview Form reused from previous step... simplified here for brevity but fully implemented in replacement */}
                                 <div className="flex bg-gray-100 p-1 rounded-lg">
                                    <button type="button" onClick={() => setTipo('Ingreso')} className={`flex-1 py-1.5 text-sm font-medium rounded-md ${tipo === 'Ingreso' ? 'bg-white text-emerald-600 shadow' : 'text-gray-500'}`}>Income</button>
                                    <button type="button" onClick={() => setTipo('Gasto')} className={`flex-1 py-1.5 text-sm font-medium rounded-md ${tipo === 'Gasto' ? 'bg-white text-rose-600 shadow' : 'text-gray-500'}`}>Expense</button>
                                </div>
                                <input required placeholder="Concept" value={concepto} onChange={e => setConcepto(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 text-sm" />
                                <div className="grid grid-cols-2 gap-4">
                                    <input required type="number" placeholder="Amount" value={monto} onChange={e => setMonto(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 text-sm" />
                                    <input required type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 text-sm" title="Transaction Date" />
                                </div>
                                <select value={categoria} onChange={e => setCategory(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 text-sm" title="Select Category">
                                    <option value="">Select Category...</option>
                                    {categories.filter(c => (tipo === 'Ingreso' ? c.type === 'Income' : c.type === 'Expense')).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                                <div className="flex justify-end gap-2 mt-4">
                                     <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
                                     <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Save</button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleCreateAPAR} className="space-y-4">
                                <input required placeholder="Entity Name (e.g. Vendor or Client)" value={entityName} onChange={e => setEntityName(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 text-sm" />
                                <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 text-sm" />
                                <div className="grid grid-cols-2 gap-4">
                                    <input required type="number" placeholder="Total Amount" value={apArAmount} onChange={e => setApArAmount(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 text-sm" />
                                    <input required type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 text-sm" title="Due Date" />
                                </div>
                                <input placeholder="Invoice Number" value={invoiceNum} onChange={e => setInvoiceNum(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 text-sm" />
                                <div className="flex justify-end gap-2 mt-4">
                                     <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
                                     <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Save Record</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}