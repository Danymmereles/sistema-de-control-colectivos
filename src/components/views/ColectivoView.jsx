import React from 'react';
import PantallaAviso from './colectivo/PantallaAviso';
import PantallaSituacion from './colectivo/PantallaSituacion';
import SpeedDisplay from './colectivo/SpeedDisplay';
import ArrivalDisplay from './colectivo/ArrivalDisplay';
import ControlButtons from './colectivo/ControlButtons';
import StopPassengerInfo from './colectivo/StopPassengerInfo';
import { Bus } from 'lucide-react';

export default function ColectivoView() {
  return (
    <div className="h-full overflow-y-auto bg-[#0D0D0D] p-3 sm:p-4 space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Bus className="w-4 h-4 text-green-400" />
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Vista Colectivo</h2>
      </div>
      <PantallaSituacion />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <PantallaAviso />
        <SpeedDisplay />
      </div>
      <ArrivalDisplay />
      <StopPassengerInfo />
      <ControlButtons />
    </div>
  );
}