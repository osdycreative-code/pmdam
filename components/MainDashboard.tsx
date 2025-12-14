import React, { useContext, useMemo } from 'react';
import { StoreContext } from '../App';
import { CheckCircle2, AlertCircle, TrendingUp, Wallet, Clock, ArrowRight, Layout, Calendar, Target, DollarSign, PieChart } from 'lucide-react';
import { TaskStatus, TaskPriority, ProjectStatus, TransactionType } from '../types';

export const MainDashboard: React.FC = () => {
    const { tasks, projects, transactions, setActiveSpaceId, setActiveListId, setActiveTaskId } = useContext(StoreContext);

    // --- Aggregation Logic for Key Modules ---

    // Tasks Summary
    const taskSummary = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === TaskStatus.DONE).length;
        const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
        const todo = tasks.filter(t => t.status === TaskStatus.TODO).length;
        const overdue = tasks.filter(t => 
            t.dueDate && new Date(t.dueDate) < new Date() && t.status !== TaskStatus.DONE
        ).length;
        
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return { total, completed, inProgress, todo, overdue, completionRate };
    }, [tasks]);

    // Finance Summary
    const financeSummary = useMemo(() => {
        const income = transactions
            .filter(t => t.type === TransactionType.INCOME)
            .reduce((acc, t) => acc + t.amount, 0);
            
        const expenses = transactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .reduce((acc, t) => acc + t.amount, 0);
            
        const balance = income - expenses;
        const netProfit = balance;
        
        // Top expense categories
        const expenseByCategory: Record<string, number> = {};
        transactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .forEach(t => {
                if (!expenseByCategory[t.category]) {
                    expenseByCategory[t.category] = 0;
                }
                expenseByCategory[t.category] += t.amount;
            });
            
        const topExpenses = Object.entries(expenseByCategory)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([category, amount]) => ({ category, amount }));

        return { income, expenses, balance, netProfit, topExpenses };
    }, [transactions]);

    // Projects Summary
    const projectSummary = useMemo(() => {
        const total = projects.length;
        const active = projects.filter(p => p.status === ProjectStatus.ACTIVE).length;
        const completed = projects.filter(p => p.status === ProjectStatus.COMPLETED).length;
        const planning = projects.filter(p => p.status === ProjectStatus.PLANNING).length;
        const onHold = projects.filter(p => p.status === ProjectStatus.ON_HOLD).length;
        
        // Average progress of active projects
        const activeProjects = projects.filter(p => p.status === ProjectStatus.ACTIVE);
        const avgProgress = activeProjects.length > 0 
            ? Math.round(activeProjects.reduce((acc, p) => acc + p.progress, 0) / activeProjects.length)
            : 0;
            
        // Projects nearing deadline (within 7 days)
        const upcomingDeadlines = projects
            .filter(p => 
                p.status === ProjectStatus.ACTIVE && 
                p.endDate && 
                new Date(p.endDate) <= new Date(new Date().setDate(new Date().getDate() + 7)) &&
                new Date(p.endDate) >= new Date()
            )
            .sort((a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime())
            .slice(0, 3);

        return { total, active, completed, planning, onHold, avgProgress, upcomingDeadlines };
    }, [projects]);

    // Recent Activities
    const recentActivities = useMemo(() => {
        // Combine recent tasks and projects
        const activities: Array<{
            id: string;
            title: string;
            type: 'task' | 'project';
            timestamp: Date;
            status?: TaskStatus | ProjectStatus;
            listId?: string;
        }> = [];
        
        // Add recent tasks
        tasks.forEach(task => {
            activities.push({
                id: task.id,
                title: task.title,
                type: 'task',
                timestamp: task.createdAt,
                status: task.status,
                listId: task.listId
            });
        });
        
        // Add recent projects
        projects.forEach(project => {
            activities.push({
                id: project.id,
                title: project.name,
                type: 'project',
                timestamp: project.startDate,
                status: project.status
            });
        });
        
        // Sort by timestamp (most recent first)
        return activities
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 5);
    }, [tasks, projects]);

    // Recent Transactions
    const recentTransactions = useMemo(() => {
        return transactions
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [transactions]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD', 
            maximumFractionDigits: 0 
        }).format(val);
    };

    const handleNavigateToTask = (taskId: string, listId: string) => {
        // Implementation would depend on your routing system
        console.log(`Navigating to task ${taskId} in list ${listId}`);
    };

    const today = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
    });

    return (
        <div className="flex flex-col h-full bg-gray-50/50 overflow-y-auto">
            {/* Header */}
            <div className="px-8 py-8 pb-6">
                <div className="flex items-end justify-between mb-2">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Main Dashboard</h1>
                        <p className="text-gray-500 mt-1 flex items-center gap-2">
                            <Calendar size={14} /> {today}
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-8 pb-12 space-y-8">
                {/* Key Metrics Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Projects Card */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:border-teal-300 hover:shadow-md hover:border-teal-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                                <TrendingUp size={20} />
                            </div>
                            <span className="text-xs text-teal-600 font-bold px-2 py-1 bg-teal-50 rounded-full">
                                {projectSummary.active} Active
                            </span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{projectSummary.total}</div>
                        <div className="text-sm text-gray-500 mb-4">Total Projects</div>
                        <div className="flex items-center text-xs text-gray-500">
                            <span className="flex-1">Avg. Progress: {projectSummary.avgProgress}%</span>
                        </div>
                    </div>

                    {/* Tasks Card */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md hover:border-blue-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <CheckCircle2 size={20} />
                            </div>
                            <span className="text-xs text-blue-600 font-bold px-2 py-1 bg-blue-50 rounded-full">
                                {taskSummary.completionRate}% Done
                            </span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{taskSummary.total}</div>
                        <div className="text-sm text-gray-500 mb-4">Total Tasks</div>
                        <div className="flex items-center text-xs text-gray-500">
                            <span className="flex-1">{taskSummary.overdue} Overdue</span>
                        </div>
                    </div>

                    {/* Finance Card - Net Balance */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:border-emerald-300 hover:shadow-md hover:border-emerald-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                <Wallet size={20} />
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${financeSummary.balance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {financeSummary.balance >= 0 ? 'Profit' : 'Loss'}
                            </span>
                        </div>
                        <div className={`text-3xl font-bold mb-1 ${financeSummary.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                            {formatCurrency(financeSummary.balance)}
                        </div>
                        <div className="text-sm text-gray-500 mb-4">Net Balance</div>
                        <div className="flex items-center text-xs text-gray-500 gap-4">
                            <span className="text-green-600 flex items-center gap-1" title="Total Income">
                                <ArrowRight size={12} className="-rotate-45" /> {formatCurrency(financeSummary.income)}
                            </span>
                            <span className="text-red-500 flex items-center gap-1" title="Total Expenses">
                                <ArrowRight size={12} className="rotate-45" /> {formatCurrency(financeSummary.expenses)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Detailed Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Projects & Tasks */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Projects Section */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-200 hover:border-teal-300 hover:shadow-md hover:border-teal-200">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-teal-600" /> Projects Overview
                                </h2>
                                <span className="text-sm text-gray-500">{projectSummary.total} Total</span>
                            </div>
                            
                            {/* Project Status Distribution */}
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                                            <span className="text-sm text-gray-600">Active</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                                            <span className="text-sm text-gray-600">Completed</span>
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium">{projectSummary.avgProgress}% Avg.</span>
                                </div>
                                
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                                    <div 
                                        className="bg-teal-500 h-2.5 rounded-full" 
                                        style={{ width: `${projectSummary.avgProgress}%` }}
                                    ></div>
                                </div>
                                
                                <div className="grid grid-cols-4 gap-2 text-center">
                                    <div>
                                        <div className="text-lg font-bold text-gray-900">{projectSummary.active}</div>
                                        <div className="text-xs text-gray-500">Active</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-gray-900">{projectSummary.completed}</div>
                                        <div className="text-xs text-gray-500">Completed</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-gray-900">{projectSummary.planning}</div>
                                        <div className="text-xs text-gray-500">Planning</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-gray-900">{projectSummary.onHold}</div>
                                        <div className="text-xs text-gray-500">On Hold</div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Upcoming Deadlines */}
                            {projectSummary.upcomingDeadlines.length > 0 && (
                                <div className="border-t border-gray-100 p-6">
                                    <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                                        <Clock size={16} className="text-orange-500" /> Upcoming Deadlines
                                    </h3>
                                    <div className="space-y-3">
                                        {projectSummary.upcomingDeadlines.map(project => (
                                            <div key={project.id} className="flex items-center justify-between p-3 bg-orange-50/50 rounded-lg">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{project.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        Due: {new Date(project.endDate!).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-medium text-orange-600">
                                                        {Math.ceil((new Date(project.endDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tasks Section */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-200 hover:border-blue-300 hover:shadow-md hover:border-blue-200">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                    <CheckCircle2 size={18} className="text-blue-600" /> Task Distribution
                                </h2>
                                <span className="text-sm text-gray-500">{taskSummary.total} Total</span>
                            </div>
                            
                            {/* Task Status Distribution */}
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                            <span className="text-sm text-gray-600">To Do</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                            <span className="text-sm text-gray-600">In Progress</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            <span className="text-sm text-gray-600">Completed</span>
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium">{taskSummary.completionRate}% Done</span>
                                </div>
                                
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                                    <div 
                                        className="bg-gradient-to-r from-blue-500 via-yellow-500 to-green-500 h-2.5 rounded-full" 
                                        style={{ width: '100%' }}
                                    ></div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div>
                                        <div className="text-lg font-bold text-gray-900">{taskSummary.todo}</div>
                                        <div className="text-xs text-gray-500">To Do</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-gray-900">{taskSummary.inProgress}</div>
                                        <div className="text-xs text-gray-500">In Progress</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-gray-900">{taskSummary.completed}</div>
                                        <div className="text-xs text-gray-500">Completed</div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Overdue Tasks */}
                            {taskSummary.overdue > 0 && (
                                <div className="border-t border-gray-100 p-6">
                                    <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                                        <AlertCircle size={16} className="text-red-500" /> Overdue Tasks
                                    </h3>
                                    <div className="text-center py-4">
                                        <div className="text-2xl font-bold text-red-600">{taskSummary.overdue}</div>
                                        <div className="text-sm text-gray-500">tasks past due date</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Finance & Quick Stats */}
                    <div className="space-y-8">
                        {/* Recent Transactions */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-200 hover:border-emerald-300 hover:shadow-md hover:border-emerald-200">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                    <Wallet size={18} className="text-emerald-600" /> My Last Transactions
                                </h2>
                            </div>
                            
                            <div className="p-6">
                                {recentTransactions.length > 0 ? (
                                    <div className="space-y-4">
                                        {recentTransactions.map(transaction => (
                                            <div key={transaction.id} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${transaction.type === TransactionType.INCOME ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                        {transaction.type === TransactionType.INCOME ? <ArrowRight size={16} className="rotate-[-45deg]" /> : <ArrowRight size={16} className="rotate-[45deg]" />}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                                                        {transaction.contact && (
                                                            <div className="text-xs text-gray-600 mb-0.5">{transaction.contact}</div>
                                                        )}
                                                        <div className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                <div className={`text-sm font-bold ${transaction.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                                                    {transaction.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(transaction.amount)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-400 py-6">
                                        <Wallet size={32} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No recent transactions</p>
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* Quick Stats */}
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-md p-6 text-white">
                            <h3 className="font-bold text-lg mb-4">Performance Snapshot</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Project Completion</span>
                                        <span>{projectSummary.completed}/{projectSummary.total}</span>
                                    </div>
                                    <div className="w-full bg-white/20 rounded-full h-2">
                                        <div 
                                            className="bg-white h-2 rounded-full" 
                                            style={{ 
                                                width: `${projectSummary.total > 0 ? (projectSummary.completed / projectSummary.total) * 100 : 0}%` 
                                            }}
                                        ></div>
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Task Completion</span>
                                        <span>{taskSummary.completionRate}%</span>
                                    </div>
                                    <div className="w-full bg-white/20 rounded-full h-2">
                                        <div 
                                            className="bg-white h-2 rounded-full" 
                                            style={{ width: `${taskSummary.completionRate}%` }}
                                        ></div>
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Financial Health</span>
                                        <span>{financeSummary.balance >= 0 ? 'Positive' : 'Negative'}</span>
                                    </div>
                                    <div className="w-full bg-white/20 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full ${financeSummary.balance >= 0 ? 'bg-green-400' : 'bg-red-400'}`} 
                                            style={{ width: '100%' }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};