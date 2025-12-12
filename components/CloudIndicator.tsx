
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export const CloudIndicator: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<Date | null>(null);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Optional: Ping supabase to verify real connectivity
        const checkConnection = async () => {
            if (!navigator.onLine) return;
            try {
                const { error } = await supabase.from('proyectos_maestros').select('count', { count: 'exact', head: true });
                if (!error) setIsOnline(true);
            } catch (e) {
                // Silent fail
            }
        };

        const interval = setInterval(checkConnection, 30000); // Check every 30s

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    const handleManualSync = () => {
        setIsSyncing(true);
        // Here you would trigger the actual sync service
        setTimeout(() => {
            setIsSyncing(false);
            setLastSync(new Date());
        }, 1000);
    };

    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-xs font-medium border border-gray-100">
            {isOnline ? (
                <div className="flex items-center gap-2 text-emerald-600">
                    <Wifi size={14} />
                    <span>Cloud Connected</span>
                </div>
            ) : (
                <div className="flex items-center gap-2 text-rose-500">
                    <WifiOff size={14} />
                    <span>Offline Mode</span>
                </div>
            )}
            
            <div className="h-3 w-px bg-gray-200 mx-1"></div>

            <button 
                onClick={handleManualSync}
                disabled={isSyncing || !isOnline}
                className={`text-gray-400 hover:text-indigo-600 transition-colors ${isSyncing ? 'animate-spin' : ''}`}
                title="Sync Now"
            >
                <RefreshCw size={14} />
            </button>
        </div>
    );
};
