import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

export default function TheoryPanel() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] text-xs text-gray-400 hover:text-white transition-colors">
        <BookOpen className="w-3.5 h-3.5" /> Modelo Teórico
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <div className="bg-[#0A0A0A] border border-[#222] rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-300 uppercase flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" /> Modelo de Control
        </span>
        <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <svg viewBox="0 0 400 170" className="w-full">
        <rect x="5" y="65" width="60" height="30" fill="none" stroke="#3B82F6" strokeWidth="1" rx="3" />
        <text x="35" y="83" fill="#3B82F6" fontSize="8" textAnchor="middle">Referencia</text>
        <circle cx="85" cy="80" r="6" fill="none" stroke="#999" strokeWidth="1" />
        <text x="85" y="84" fill="#999" fontSize="8" textAnchor="middle">±</text>
        <rect x="105" y="65" width="55" height="30" fill="none" stroke="#EAB308" strokeWidth="1" rx="3" />
        <text x="132" y="83" fill="#EAB308" fontSize="8" textAnchor="middle">Controlador</text>
        <text x="132" y="92" fill="#EAB308" fontSize="7" textAnchor="middle">KV</text>
        <rect x="195" y="65" width="55" height="30" fill="none" stroke="#22C55E" strokeWidth="1" rx="3" />
        <text x="222" y="83" fill="#22C55E" fontSize="8" textAnchor="middle">Planta</text>
        <text x="222" y="92" fill="#22C55E" fontSize="7" textAnchor="middle">Colectivo</text>
        <rect x="290" y="65" width="55" height="30" fill="none" stroke="#F97316" strokeWidth="1" rx="3" />
        <text x="317" y="83" fill="#F97316" fontSize="8" textAnchor="middle">Velocidad</text>
        <line x1="65" y1="80" x2="79" y2="80" stroke="#666" strokeWidth="1" />
        <line x1="91" y1="80" x2="105" y2="80" stroke="#666" strokeWidth="1" />
        <polygon points="103,78 103,82 107,80" fill="#666" />
        <line x1="160" y1="80" x2="195" y2="80" stroke="#666" strokeWidth="1" />
        <polygon points="193,78 193,82 197,80" fill="#666" />
        <line x1="250" y1="80" x2="290" y2="80" stroke="#666" strokeWidth="1" />
        <polygon points="288,78 288,82 292,80" fill="#666" />
        <line x1="345" y1="80" x2="370" y2="80" stroke="#666" strokeWidth="1" />
        <line x1="370" y1="80" x2="370" y2="130" stroke="#666" strokeWidth="1" />
        <line x1="370" y1="130" x2="85" y2="130" stroke="#666" strokeWidth="1" />
        <line x1="85" y1="130" x2="85" y2="86" stroke="#666" strokeWidth="1" />
        <polygon points="83,88 87,88 85,84" fill="#666" />
        <text x="225" y="125" fill="#666" fontSize="7" textAnchor="middle">Realimentación</text>
      </svg>
      <div className="mt-2 space-y-1 font-mono text-[10px] text-gray-400">
        <div>v_target = throttle × v_max</div>
        <div>v(t) = v(t-Δt) + (v_target - v(t-Δt)) × KV × Δt</div>
        <div className="text-red-400">e(t) = v_target - v(t)</div>
        <div>x(t) = x(t-Δt) + v(t) × Δt / 3600</div>
      </div>
      <p className="mt-2 text-[10px] text-gray-500 leading-relaxed">
        KV controla la velocidad de respuesta del sistema. Valores altos = respuesta rápida pero posible overshoot. Valores bajos = respuesta lenta.
      </p>
    </div>
  );
}