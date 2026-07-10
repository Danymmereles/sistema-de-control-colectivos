import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

export default function TheoryPanel() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] text-xs text-gray-400 hover:text-white transition-colors w-full justify-center">
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
      <svg viewBox="0 0 440 210" className="w-full">
        {/* Reference */}
        <text x="10" y="85" fill="#3B82F6" fontSize="9" textAnchor="middle">Ref</text>
        <line x1="22" y1="80" x2="48" y2="80" stroke="#666" strokeWidth="1" />
        <polygon points="46,78 46,82 50,80" fill="#666" />
        {/* Sum point */}
        <circle cx="58" cy="80" r="7" fill="none" stroke="#999" strokeWidth="1" />
        <text x="58" y="84" fill="#999" fontSize="8" textAnchor="middle">±</text>
        <line x1="65" y1="80" x2="85" y2="80" stroke="#666" strokeWidth="1" />
        <polygon points="83,78 83,82 87,80" fill="#666" />
        {/* Controller - Centro de Monitoreo */}
        <rect x="87" y="62" width="70" height="36" fill="none" stroke="#EAB308" strokeWidth="1" rx="3" />
        <text x="122" y="78" fill="#EAB308" fontSize="8" textAnchor="middle" fontWeight="bold">Controlador</text>
        <text x="122" y="89" fill="#EAB308" fontSize="7" textAnchor="middle">Centro Monitoreo</text>
        <line x1="157" y1="80" x2="177" y2="80" stroke="#666" strokeWidth="1" />
        <polygon points="175,78 175,82 179,80" fill="#666" />
        {/* Actuator - Chofer */}
        <rect x="179" y="62" width="60" height="36" fill="none" stroke="#22C55E" strokeWidth="1" rx="3" />
        <text x="209" y="78" fill="#22C55E" fontSize="8" textAnchor="middle" fontWeight="bold">Actuador</text>
        <text x="209" y="89" fill="#22C55E" fontSize="7" textAnchor="middle">Chofer</text>
        <line x1="239" y1="80" x2="259" y2="80" stroke="#666" strokeWidth="1" />
        <polygon points="257,78 257,82 261,80" fill="#666" />
        {/* Process - Ejecución e Incidencias */}
        <rect x="261" y="58" width="75" height="44" fill="none" stroke="#F97316" strokeWidth="1" rx="3" />
        <text x="298" y="74" fill="#F97316" fontSize="8" textAnchor="middle" fontWeight="bold">Proceso</text>
        <text x="298" y="84" fill="#F97316" fontSize="7" textAnchor="middle">Ejecución e</text>
        <text x="298" y="93" fill="#F97316" fontSize="7" textAnchor="middle">Incidencias</text>
        <line x1="336" y1="80" x2="370" y2="80" stroke="#666" strokeWidth="1" />
        <polygon points="368,78 368,82 372,80" fill="#666" />
        {/* Output */}
        <text x="400" y="78" fill="#aaa" fontSize="8" textAnchor="middle">Velocidad</text>
        <text x="400" y="88" fill="#aaa" fontSize="8" textAnchor="middle">Posición</text>
        {/* Feedback path */}
        <line x1="370" y1="80" x2="400" y2="80" stroke="#666" strokeWidth="1" />
        <line x1="400" y1="80" x2="420" y2="80" stroke="#666" strokeWidth="1" />
        <line x1="420" y1="80" x2="420" y2="170" stroke="#666" strokeWidth="1" />
        <line x1="420" y1="170" x2="298" y2="170" stroke="#666" strokeWidth="1" />
        {/* Measurement - Validadora Sube / GPS */}
        <rect x="250" y="158" width="96" height="24" fill="none" stroke="#A855F7" strokeWidth="1" rx="3" />
        <text x="298" y="173" fill="#A855F7" fontSize="7" textAnchor="middle">Validadora Sube / GPS</text>
        <line x1="298" y1="158" x2="298" y2="102" stroke="#666" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="250" y1="170" x2="58" y2="170" stroke="#666" strokeWidth="1" />
        <line x1="58" y1="170" x2="58" y2="87" stroke="#666" strokeWidth="1" />
        <polygon points="56,89 60,89 58,85" fill="#666" />
        <text x="225" y="165" fill="#666" fontSize="7" textAnchor="middle">Realimentación</text>
        {/* Disturbance - Carga / Pasajeros (outside feedback) */}
        <line x1="298" y1="102" x2="298" y2="120" stroke="#666" strokeWidth="1" strokeDasharray="2 2" />
        <polygon points="296,118 300,118 298,122" fill="#666" />
        <text x="298" y="138" fill="#EC4899" fontSize="8" textAnchor="middle" fontWeight="bold">Carga</text>
        <text x="298" y="148" fill="#EC4899" fontSize="7" textAnchor="middle">(Pasajeros)</text>
      </svg>
      <div className="mt-3 space-y-1 font-mono text-[10px] text-gray-400">
        <div>v_target = throttle × v_max × 1.3</div>
        <div>Δv_max = KV × 36 km/h/s × Δt</div>
        <div className="text-red-400">e_dist = |pos_planificada - pos_actual|</div>
        <div className="text-red-400">e_tiempo = |ETA - t_planificado|</div>
        <div>pos_planificada = (t / t_plan) × dist_original</div>
      </div>
      <p className="mt-2 text-[10px] text-gray-500 leading-relaxed">
        KV escala la aceleración máxima (10 m/s²). El controlador (centro de monitoreo) decide la acción, el chofer (actuador) ejecuta, y el proceso incluye incidencias del recorrido. La validadora Sube/GPS mide la posición. Los pasajeros son una carga externa (perturbación).
      </p>
    </div>
  );
}