
import React, { useContext, useMemo } from 'react';
import { StoreContext } from '../App';
import { CheckCircle2, AlertCircle, TrendingUp, FolderKanban, Package, Clock, ArrowRight, Layout, Wallet, Calendar } from 'lucide-react';
import { TaskStatus, TaskPriority, ProjectStatus, TransactionType } from '../types';

export const DashboardView: React.FC = () => {
    const { tasks, projects, transactions, products, spaces, lists, setActiveSpaceId, setActiveListId, setActiveTaskId } = useContext(StoreContext);

    // --- Aggregation Logic ---

    // Tasks Stats
    const taskStats = useMemo(() => {
        const pending = tasks.filter(t => t.status !== TaskStatus.DONE);
        const urgent = pending.filter(t => t.priority === TaskPriority.URGENT || t.priority === TaskPriority.HIGH);
        const dueSoon = pending.filter(t => t.dueDate && new Date(t.dueDate) <= new Date(new Date().setDate(new Date().getDate() + 3)));
        return { pending: pending.length, urgent: urgent.length, dueSoon: dueSoon.length, urgentTasks: urgent };
    }, [tasks]);

    // Finance Stats
    const financeStats = useMemo(() => {
        const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
        const expense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
        return { balance: income - expense, income, expense };
    }, [transactions]);

    // Project Stats
    const projectStats = useMemo(() => {
        const active = projects.filter(p => p.status === ProjectStatus.ACTIVE);
        const avgProgress = active.length > 0 
            ? Math.round(active.reduce((acc, p) => acc + p.progress, 0) / active.length) 
            : 0;
        return { activeCount: active.length, avgProgress, activeProjects: active };
    }, [projects]);

    // Inventory Stats
    const lowStockCount = useMemo(() => {
        return products.filter(p => p.stockCount < 10).length;
    }, [products]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    };

    const handleNavigateToTask = (taskId: string, listId: string) => {
        const list = lists.find(l => l.id === listId);
        if (list) {
            setActiveSpaceId(list.spaceId);
            setActiveListId(listId);
            setTimeout(() => setActiveTaskId(taskId), 100);
        }
    };

    const handleNavigateToSpace = (spaceId: string) => {
        setActiveSpaceId(spaceId);
        const firstList = lists.find(l => l.spaceId === spaceId);
        if (firstList) setActiveListId(firstList.id);
    };

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <div className="flex flex-col h-full bg-gray-50/50 overflow-y-auto">
            {/* Header */}
            <div className="px-8 py-8 pb-6">
                <div className="flex items-end justify-between mb-2">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-gray-500 mt-1 flex items-center gap-2">
                            <Calendar size={14} /> {today}
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-8 pb-12 space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Tasks Card */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:border-blue-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <CheckCircle2 size={20} />
                            </div>
                            {taskStats.urgent > 0 && (
                                <span className="bg-red-50 text-red-600 text-xs px-2 py-1 rounded-full font-bold">
                                    {taskStats.urgent} Urgent
                                </span>
                            )}
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">{taskStats.pending}</div>
                        <div className="text-sm text-gray-500">Pending Tasks</div>
                    </div>

                    {/* Finance Card */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:border-emerald-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                <Wallet size={20} />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(financeStats.balance)}</div>
                        <div className="text-sm text-gray-500">Net Balance</div>
                    </div>

                    {/* Projects Card */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:border-teal-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                                <FolderKanban size={20} />
                            </div>
                            <span className="text-xs text-teal-600 font-bold px-2 py-1 bg-teal-50 rounded-full">{projectStats.activeCount} Active</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">{projectStats.activeCount}</div>
                        <div className="text-sm text-gray-500">Active Projects</div>
                    </div>

                    {/* Inventory Card */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:border-orange-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                <Package size={20} />
                            </div>
                            {lowStockCount > 0 && (
                                <span className="bg-orange-50 text-orange-600 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                    <AlertCircle size={10} /> Action
                                </span>
                            )}
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">{lowStockCount}</div>
                        <div className="text-sm text-gray-500">Low Stock Items</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column (2/3) */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Urgent Tasks */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                    <AlertCircle size={18} className="text-red-500" /> Priority Attention
                                </h2>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {taskStats.urgentTasks.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400 text-sm">
                                        No urgent tasks. Great job!
                                    </div>
                                ) : (
                                    taskStats.urgentTasks.slice(0, 5).map(task => (
                                        <div key={task.id} className="p-4 hover:bg-gray-50 transition-all duration-200 hover:border-gray-200 border border-transparent flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1.5 h-1.5 rounded-full ${task.priority === TaskPriority.URGENT ? 'bg-red-500' : 'bg-orange-500'}`} />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                                                    <p className="text-xs text-gray-500">
                                                        Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleNavigateToTask(task.id, task.listId)}
                                                className="opacity-0 group-hover:opacity-100 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md transition-all duration-200 hover:border-indigo-200 border border-transparent"
                                            >
                                                View
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Active Projects */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-teal-600" /> Project Status
                                </h2>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {projectStats.activeProjects.length === 0 ? (
                                    <div className="col-span-full text-center text-gray-400 text-sm py-4">No active projects</div>
                                ) : (
                                    projectStats.activeProjects.map(project => (
                                        <div key={project.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-teal-200 bg-gray-50/30">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-gray-800 text-sm truncate pr-2">{project.name}</h3>
                                                <span className="text-xs font-mono text-gray-500">{project.progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                                                <div 
                                                    className="bg-teal-500 h-1.5 rounded-full" 
                                                    style={{ width: `${project.progress}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-400">
                                                <span>End: {new Date(project.endDate).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Right Column (1/3) */}
                    <div className="space-y-6">
                        {/* Spaces Overview */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <h2 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Your Spaces</h2>
                            <div className="space-y-3">
                                {spaces.map(space => {
                                    const moduleCount = lists.filter(l => l.spaceId === space.id).length;
                                    return (
                                        <button 
                                            key={space.id}
                                            onClick={() => handleNavigateToSpace(space.id)}
                                            className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{space.icon}</span>
                                                <span className="font-medium text-gray-700 group-hover:text-indigo-700">{space.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-400 text-xs">
                                                <span>{moduleCount} Modules</span>
                                                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                         {/* Quick Actions / Tips */}
                         <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-md p-6 text-white">
                            <h3 className="font-bold text-lg mb-2">Pro Tip</h3>
                            <p className="text-indigo-100 text-sm mb-4 leading-relaxed">
                                Use the Creative Studio to draft project proposals or generate code snippets for your next sprint.
                            </p>
                            <div className="w-8 h-1 bg-white/20 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
