import { useEffect, useRef } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const OrdersMap = () => {
  const { orders } = useOrders();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Get all orders (not just closed) that have coordinates or address
  const allOrders = orders.filter(o => o.address);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([-14.235, -51.9253], 4);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    const bounds: L.LatLngExpression[] = [];

    allOrders.forEach(order => {
      if (order.latitude && order.longitude) {
        const pos: L.LatLngExpression = [order.latitude, order.longitude];
        bounds.push(pos);

        const totalCost = (order.laborCost || 0) + (order.materialCost || 0);
        const statusLabel = order.status === 'closed' ? '🔒 Encerrado' :
          order.status === 'executed' ? '✅ Executado' :
          order.status === 'executing' ? '🔧 Em Execução' : '📋 Em Aberto';

        const popup = `
          <div style="min-width:200px;font-family:system-ui;">
            <strong style="font-size:14px;">OS #${order.id}</strong>
            <span style="background:#f0f0f0;padding:2px 6px;border-radius:4px;font-size:11px;margin-left:6px;">${statusLabel}</span>
            <hr style="margin:6px 0;border:none;border-top:1px solid #eee;">
            <p style="margin:4px 0;font-size:13px;"><strong>👤 Cliente:</strong> ${order.clientName}</p>
            <p style="margin:4px 0;font-size:13px;"><strong>📱 WhatsApp:</strong> <a href="https://wa.me/55${order.clientPhone?.replace(/\D/g, '')}" target="_blank" style="color:#25d366;">${order.clientPhone}</a></p>
            <p style="margin:4px 0;font-size:13px;"><strong>📍 Local:</strong> ${order.address}</p>
            <p style="margin:4px 0;font-size:13px;"><strong>💰 Valor Total:</strong> <span style="color:#16a34a;font-weight:bold;">R$ ${totalCost.toFixed(2)}</span></p>
            <p style="margin:4px 0;font-size:12px;color:#666;">${order.description?.slice(0, 80) || ''}${(order.description?.length || 0) > 80 ? '...' : ''}</p>
          </div>
        `;

        const iconColor = order.status === 'closed' ? '#6b7280' :
          order.status === 'executed' ? '#16a34a' :
          order.status === 'executing' ? '#2563eb' : '#f59e0b';

        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background:${iconColor};width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:bold;">${order.id}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        L.marker(pos, { icon }).addTo(map).bindPopup(popup);
      }
    });

    // Geocode orders without coordinates using address
    allOrders.forEach(async (order) => {
      if (!order.latitude && !order.longitude && order.address) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(order.address)}&format=json&limit=1`);
          const data = await res.json();
          if (data[0]) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            const pos: L.LatLngExpression = [lat, lon];

            const totalCost = (order.laborCost || 0) + (order.materialCost || 0);
            const statusLabel = order.status === 'closed' ? '🔒 Encerrado' :
              order.status === 'executed' ? '✅ Executado' :
              order.status === 'executing' ? '🔧 Em Execução' : '📋 Em Aberto';

            const popup = `
              <div style="min-width:200px;font-family:system-ui;">
                <strong style="font-size:14px;">OS #${order.id}</strong>
                <span style="background:#f0f0f0;padding:2px 6px;border-radius:4px;font-size:11px;margin-left:6px;">${statusLabel}</span>
                <hr style="margin:6px 0;border:none;border-top:1px solid #eee;">
                <p style="margin:4px 0;font-size:13px;"><strong>👤 Cliente:</strong> ${order.clientName}</p>
                <p style="margin:4px 0;font-size:13px;"><strong>📱 WhatsApp:</strong> <a href="https://wa.me/55${order.clientPhone?.replace(/\D/g, '')}" target="_blank" style="color:#25d366;">${order.clientPhone}</a></p>
                <p style="margin:4px 0;font-size:13px;"><strong>📍 Local:</strong> ${order.address}</p>
                <p style="margin:4px 0;font-size:13px;"><strong>💰 Valor Total:</strong> <span style="color:#16a34a;font-weight:bold;">R$ ${totalCost.toFixed(2)}</span></p>
              </div>
            `;

            const iconColor = order.status === 'closed' ? '#6b7280' :
              order.status === 'executed' ? '#16a34a' :
              order.status === 'executing' ? '#2563eb' : '#f59e0b';

            const icon = L.divIcon({
              className: 'custom-marker',
              html: `<div style="background:${iconColor};width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:bold;">${order.id}</div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            });

            L.marker(pos, { icon }).addTo(map).bindPopup(popup);

            if (map.getZoom() === 4) {
              map.setView(pos, 12);
            }
          }
        } catch { /* ignore geocoding errors */ }
      }
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [50, 50], maxZoom: 14 });
    }
  }, [allOrders]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">Mapa de Ordens de Serviço</h2>
        <p className="text-sm text-muted-foreground">{allOrders.length} ordem(ns) no mapa</p>
      </div>

      <div className="flex gap-3 flex-wrap text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Em Aberto</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Em Execução</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-600 inline-block" /> Executado</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-500 inline-block" /> Encerrado</span>
      </div>

      <div ref={mapRef} className="w-full h-[calc(100vh-220px)] rounded-xl border shadow-sm z-0" />
    </div>
  );
};

export default OrdersMap;
