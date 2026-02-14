import { useEffect, useRef, useState } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { OrderStatus } from '@/types/serviceOrder';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const STATUS_MAP: Record<OrderStatus, { label: string; emoji: string; color: string; bg: string }> = {
  open: { label: 'Em Aberto', emoji: '📋', color: '#f59e0b', bg: 'bg-amber-500' },
  executing: { label: 'Em Execução', emoji: '🔧', color: '#2563eb', bg: 'bg-blue-600' },
  executed: { label: 'Executado', emoji: '✅', color: '#16a34a', bg: 'bg-green-600' },
  closed: { label: 'Encerrado', emoji: '🔒', color: '#6b7280', bg: 'bg-gray-500' },
};

const OrdersMap = () => {
  const { orders } = useOrders();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [filters, setFilters] = useState<Record<OrderStatus, boolean>>({
    open: true, executing: true, executed: true, closed: true,
  });

  const toggleFilter = (status: OrderStatus) => {
    setFilters(prev => ({ ...prev, [status]: !prev[status] }));
  };

  const allOrders = orders.filter(o => o.address);
  const filteredOrders = allOrders.filter(o => filters[o.status]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current).setView([-14.235, -51.9253], 4);
    mapInstanceRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer(layer => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    const bounds: L.LatLngExpression[] = [];

    const createMarker = (order: typeof filteredOrders[0], pos: L.LatLngExpression) => {
      const totalCost = (order.laborCost || 0) + (order.materialCost || 0);
      const s = STATUS_MAP[order.status];
      const popup = `
        <div style="min-width:200px;font-family:system-ui;">
          <strong style="font-size:14px;">OS #${order.id}</strong>
          <span style="background:#f0f0f0;padding:2px 6px;border-radius:4px;font-size:11px;margin-left:6px;">${s.emoji} ${s.label}</span>
          <hr style="margin:6px 0;border:none;border-top:1px solid #eee;">
          <p style="margin:4px 0;font-size:13px;"><strong>👤 Cliente:</strong> ${order.clientName}</p>
          <p style="margin:4px 0;font-size:13px;"><strong>📱 WhatsApp:</strong> <a href="https://wa.me/55${order.clientPhone?.replace(/\D/g, '')}" target="_blank" style="color:#25d366;">${order.clientPhone}</a></p>
          <p style="margin:4px 0;font-size:13px;"><strong>📍 Local:</strong> ${order.address}</p>
          <p style="margin:4px 0;font-size:13px;"><strong>💰 Valor Total:</strong> <span style="color:#16a34a;font-weight:bold;">R$ ${totalCost.toFixed(2)}</span></p>
          <p style="margin:4px 0;font-size:12px;color:#666;">${order.description?.slice(0, 80) || ''}${(order.description?.length || 0) > 80 ? '...' : ''}</p>
        </div>
      `;
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background:${s.color};width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:bold;">${order.id}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker(pos, { icon }).addTo(map).bindPopup(popup);
    };

    filteredOrders.forEach(order => {
      if (order.latitude && order.longitude) {
        const pos: L.LatLngExpression = [order.latitude, order.longitude];
        bounds.push(pos);
        createMarker(order, pos);
      }
    });

    filteredOrders.forEach(async (order) => {
      if (!order.latitude && !order.longitude && order.address) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(order.address)}&format=json&limit=1`);
          const data = await res.json();
          if (data[0]) {
            const pos: L.LatLngExpression = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            createMarker(order, pos);
            if (map.getZoom() === 4) map.setView(pos, 12);
          }
        } catch { /* ignore */ }
      }
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [50, 50], maxZoom: 14 });
    }
  }, [filteredOrders]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">Mapa de Ordens de Serviço</h2>
        <p className="text-sm text-muted-foreground">{filteredOrders.length} de {allOrders.length} ordem(ns) no mapa</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(Object.keys(STATUS_MAP) as OrderStatus[]).map(status => {
          const s = STATUS_MAP[status];
          const count = allOrders.filter(o => o.status === status).length;
          return (
            <button
              key={status}
              onClick={() => toggleFilter(status)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filters[status]
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-muted text-muted-foreground border-border opacity-50'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${s.bg} ${!filters[status] ? 'opacity-40' : ''}`} />
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      <div ref={mapRef} className="w-full h-[calc(100vh-220px)] rounded-xl border shadow-sm z-0" />
    </div>
  );
};

export default OrdersMap;
