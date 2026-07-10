import React, { useEffect, useRef } from 'react';
import { useSimulation, formatTime } from '@/lib/simulationContext';
import { AlertTriangle, CheckCircle, Info, XCircle, ScrollText } from 'lucide-react';

const TYPE_CONFIG = {
  error: { icon: XCircle, color: 'text-red-400' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400' },
  success: { icon: CheckCircle, color: 'text-green-400' },
  info: { icon: Info, color: 'text-blue-400' },
};

export default function EventLog() {
  const { log } = useSimulation();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [log]);

  return (
    <div className="flex flex-col h-full bg-[#0D0D0D] min-h-0">
      <div className="px-3 py-2 border-b border-[#2A2A2A] flex items-center gap-2 flex-shrink-0">
        <ScrollText className="w-4 h-4 text-gray-400" />
        <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider">Log de Eventos</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-0.5 min-h-0">
        {log.length === 0 && <p className="text-xs text-gray-600 text-center py-4">Sin eventos registrados</p>}
        {log.map(entry => {
          const cfg = TYPE_CONFIG[entry.type] || TYPE_CONFIG.info;
          const Icon = cfg.icon;
          return (
            <div key={entry.id} className="flex items-start gap-2 text-xs py-1 px-2 rounded hover:bg-[#1A1A1A]">
              <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${cfg.color}`} />
              <span className="font-mono text-gray-500 flex-shrink-0">{formatTime(entry.time)}</span>
              <span className="text-gray-300 break-words">{entry.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}