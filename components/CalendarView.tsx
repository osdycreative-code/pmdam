import React, { useContext, useState } from 'react';
import { StoreContext } from '../App';
import { Task } from '../types';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon } from 'lucide-react';

export const CalendarView: React.FC = () => {
    const { tasks, activeListId } = useContext(StoreContext);
    const [currentDate, setCurrentDate] = useState(new Date());

    // Filter tasks for the current module/list that have due dates
    const calendarTasks = tasks.filter(t => 
        t.listId === activeListId && 
        t.dueDate
    );

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        
        const days = [];
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        // Empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-32 bg-gray-50/30 border border-gray-100"></div>);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // Find tasks for this day
            const daysTasks = calendarTasks.filter(t => {
                if (!t.dueDate) return false;
                const tDate = new Date(t.dueDate);
                return tDate.getDate() === day && 
                       tDate.getMonth() === month && 
                       tDate.getFullYear() === year;
            });

            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

            days.push(
                <div key={day} className={`h-32 border border-gray-100 p-2 flex flex-col group hover:bg-gray-50 transition-colors ${isToday ? 'bg-indigo-50/30' : 'bg-white'}`}>
                    <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'}`}>
                            {day}
                        </span>
                        {daysTasks.length > 0 && (
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">
                                {daysTasks.length}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                        {daysTasks.map(task => (
                            <div 
                                key={task.id} 
                                className="text-[10px] p-1.5 rounded bg-white border border-l-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer truncate"
                                style={{ borderLeftColor: getPriorityColor(task.priority) }}
                                title={task.title}
                            >
                                <div className="font-medium text-gray-800 truncate">{task.title}</div>
                                {task.reminder && (
                                    <div className="flex items-center gap-1 text-[9px] text-gray-400 mt-0.5">
                                        <Clock size={8} />
                                        {new Date(task.reminder).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className="flex-1 flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Calendar Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <CalendarIcon size={20} className="text-indigo-600" />
                            {monthNames[month]} {year}
                        </h2>
                        <div className="flex bg-gray-100 rounded-lg p-0.5">
                            <button onClick={prevMonth} className="p-1 hover:bg-white rounded-md shadow-sm transition-all text-gray-600">
                                <ChevronLeft size={16} />
                            </button>
                            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-indigo-600">
                                Today
                            </button>
                            <button onClick={nextMonth} className="p-1 hover:bg-white rounded-md shadow-sm transition-all text-gray-600">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 flex-1 bg-gray-200 gap-px overflow-y-auto">
                    {days}
                </div>
            </div>
        );
    };

    const getPriorityColor = (priority: string) => {
        switch(priority) {
            case 'Urgent': return '#dc2626'; // red-600
            case 'High': return '#f97316'; // orange-500
            case 'Medium': return '#3b82f6'; // blue-500
            case 'Low': return '#22c55e'; // green-500
            default: return '#9ca3af'; // gray-400
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-50 p-6 overflow-hidden">
             {/* Header Section */}
             <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Calendar</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage schedules and task deadlines</p>
                </div>
            </div>
            
            {renderCalendar()}
        </div>
    );
};
