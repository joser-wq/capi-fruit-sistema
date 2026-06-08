import { Settings } from 'lucide-react';

export default function ConfigPage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-base font-semibold text-text-primary flex items-center gap-2 mb-5">
        <Settings className="w-5 h-5 text-primary" /> Configuración
      </h1>

      <div className="bg-surface border border-border rounded-card p-5">
        <h2 className="text-sm font-medium text-text-primary mb-2">Endpoint de integración web</h2>
        <p className="text-xs text-text-secondary mb-3">
          Tu página web debe llamar este endpoint cuando el cliente confirme un pedido en el carrito:
        </p>
        <div className="bg-surface-2 border border-border rounded-md p-3 font-mono text-xs text-text-primary">
          POST /api/pedidos/nuevo
        </div>
        <div className="mt-3 bg-surface-2 border border-border rounded-md p-3">
          <p className="text-[11px] text-text-secondary font-medium mb-2">Ejemplo de cuerpo JSON:</p>
          <pre className="text-[10px] text-text-primary overflow-x-auto">{JSON.stringify({
            nombreCliente: "Hotel Los Sueños",
            tipoCliente: "hotel",
            productos: [
              { nombre: "Piña", cantidad: 10, unidad: "unidad", pesoKg: 20 },
              { nombre: "Mango", cantidad: 5, unidad: "kg", pesoKg: 5 }
            ],
            direccionEntrega: "Carretera a Jacó, frente al hotel",
            telefono: "2630-0000",
            fechaSolicitada: "2026-06-10",
            notas: "Entregar antes de las 10am"
          }, null, 2)}</pre>
        </div>
        <p className="text-[11px] text-text-disabled mt-3">
          El sistema calculará automáticamente si el pedido es grande (&gt;5 kg o ≥3 tipos distintos de producto)
          y lo creará con estado <strong>pendiente</strong>.
        </p>
      </div>
    </div>
  );
}
