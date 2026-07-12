import React from 'react';
import { useSimulation } from '@/lib/simulationContext';
import { ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';

export default function ControlButtons() {
    const { accelerate, brake, throttle, status, velocity, line } = useSimulation();
    const disabled = status !== 'running';
    const overMax = !disabled && line && velocity >= line.maxVelocity;

    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 flex flex-col gap-1">
                <button onClick={accelerate} disabled={disabled}
                        className={`flex items-center justify-center gap-2 py-4 rounded-lg border transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${overMax ? 'bg-red-900/40 border-red-600 text-red-400 hover:bg-red-900/60 animate-pulse' : 'bg-green-900/30 border-green-700/50 text-green-400 hover:bg-green-900/50'}`}>
                    <ChevronUp className="w-6 h-6" />
                    <span className="font-semibold text-sm sm:text-base">{overMax ? 'No subir más' : 'Acelerar'}</span>
                </button>
                {overMax && (
                    <div className="flex items-center justify-center gap-1 text-[10px] text-red-400 font-medium leading-tight">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>No subir más para evitar falla del motor</span>
                    </div>
                )}
            </div>
            <div className="flex flex-col items-center min-w-[56px]">
                <div className="text-[10px] text-gray-500 uppercase">Acelerador</div>
                <div className="text-2xl font-mono font-bold text-white">{throttle}%</div>
                <div className="w-2 h-14 bg-[#1A1A1A] rounded-full mt-1 overflow-hidden flex flex-col-reverse">
                    <div className="w-full bg-gradient-to-t from-green-600 to-green-400 transition-all duration-200" style={{ height: `${throttle}%` }} />
                </div>
            </div>
            <button onClick={brake} disabled={disabled}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-lg bg-red-900/30 border border-red-700/50 text-red-400 hover:bg-red-900/50 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronDown className="w-6 h-6" />
                <span className="font-semibold text-sm sm:text-base">Frenar</span>
            </button>
        </div>
    );
}
