import { useEffect, useRef, useState, useMemo } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { OrderStatus } from '@/types/serviceOrder';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const BASE_LOCATION = { lat: -22.8595, lng: -47.1327, label: 'Base Operacional', address: 'R. Alcídio Rodelli, 1244 - Cidade Satélite Íris, Campinas - SP' };

const STATUS_MAP: Record<OrderStatus, { label: string; emoji: string; color: string; bg: string }> = {
  open: { label: 'Em Aberto', emoji: '📋', color: '#f59e0b', bg: 'bg-amber-500' },
  quote: { label: 'Orçamento', emoji: '💰', color: '#9333ea', bg: 'bg-purple-600' },
  executing: { label: 'Em Execução', emoji: '🔧', color: '#2563eb', bg: 'bg-blue-600' },
  executed: { label: 'Executado', emoji: '✅', color: '#16a34a', bg: 'bg-green-600' },
  closed: { label: 'Encerrado', emoji: '🔒', color: '#6b7280', bg: 'bg-gray-500' },
};

const OrdersMap = () => {
  const { orders } = useOrders();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const baseMarkerRef = useRef<L.Marker | null>(null);
  const [filters, setFilters] = useState<Record<OrderStatus, boolean>>({
    open: true, quote: true, executing: true, executed: true, closed: true,
  });
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [routeMode, setRouteMode] = useState(false);
  const routeModeRef = useRef(false);
  const [routeInfo, setRouteInfo] = useState<string | null>(null);

  const drawRoute = async (destLat: number, destLng: number, orderId: number) => {
    const map = mapInstanceRef.current;
    if (!map || !routeLayerRef.current) return;
    routeLayerRef.current.clearLayers();

    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${BASE_LOCATION.lng},${BASE_LOCATION.lat};${destLng},${destLat}?overview=full&geometries=geojson`
      );
      const data = await res.json();
      if (data.routes?.[0]) {
        const coords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]] as L.LatLngExpression);
        const distKm = (data.routes[0].distance / 1000).toFixed(1);
        const durationMin = Math.round(data.routes[0].duration / 60);

        const polyline = L.polyline(coords, { color: '#2563eb', weight: 4, opacity: 0.8, dashArray: '8, 8' });
        routeLayerRef.current!.addLayer(polyline);

        // Midpoint label
        const mid = coords[Math.floor(coords.length / 2)];
        const label = L.divIcon({
          className: 'route-label',
          html: `<div style="background:white;padding:4px 8px;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.2);font-size:12px;font-weight:bold;white-space:nowrap;font-family:system-ui;">🚗 ${distKm} km · ~${durationMin} min</div>`,
          iconSize: [0, 0],
        });
        routeLayerRef.current!.addLayer(L.marker(mid, { icon: label, interactive: false }));

        map.fitBounds(polyline.getBounds(), { padding: [60, 60] });
        setRouteInfo(`🚗 OS #${orderId} — ${distKm} km · ~${durationMin} min`);
      }
    } catch {
      setRouteInfo('Erro ao traçar rota');
    }
    routeModeRef.current = false;
    setRouteMode(false);
  };

  const toggleFilter = (status: OrderStatus) => {
    setFilters(prev => ({ ...prev, [status]: !prev[status] }));
  };

  const extractCity = (address: string) => {
    // Address format: "Street - Neighborhood - City - State, ZIP"
    const parts = address.split(' - ').map(p => p.trim());
    if (parts.length >= 3) {
      // City is second-to-last part (before "SP, 13187-149")
      return parts[parts.length - 2];
    }
    if (parts.length === 2) return parts[1].replace(/\s*,\s*\d.*$/, '').trim();
    // Fallback: try comma split
    const commaParts = address.split(',').map(p => p.trim());
    return commaParts.length >= 2 ? commaParts[commaParts.length - 2] : address;
  };

  const allOrders = orders.filter(o => o.address);
  const statusFiltered = allOrders.filter(o => filters[o.status]);
  const filteredOrders = selectedCity
    ? statusFiltered.filter(o => extractCity(o.address) === selectedCity)
    : statusFiltered;

  // Group orders by city (extract city from address)
  const cityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    statusFiltered.forEach(order => {
      if (!order.address) return;
      const city = extractCity(order.address);
      counts[city] = (counts[city] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [statusFiltered]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current).setView([BASE_LOCATION.lat, BASE_LOCATION.lng], 12);
    mapInstanceRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Base marker
    const baseIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background:#dc2626;width:44px;height:44px;border-radius:50%;border:4px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer;">🏠</div>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });
    const baseMarker = L.marker([BASE_LOCATION.lat, BASE_LOCATION.lng], { icon: baseIcon, zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup(`<div style="font-family:system-ui;"><strong>🏠 ${BASE_LOCATION.label}</strong><p style="margin:4px 0;font-size:12px;">${BASE_LOCATION.address}</p><p style="margin:4px 0;font-size:11px;color:#2563eb;font-weight:600;">Clique para traçar rota até um atendimento</p></div>`);
    baseMarkerRef.current = baseMarker;
    
    baseMarker.on('click', () => {
      routeModeRef.current = true;
      setRouteMode(true);
      setRouteInfo('📍 Clique em um ponto de atendimento para traçar a rota');
      if (routeLayerRef.current) routeLayerRef.current.clearLayers();
    });

    routeLayerRef.current = L.layerGroup().addTo(map);

    return () => { map.remove(); mapInstanceRef.current = null; routeLayerRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove order markers but keep base and tile layers
    map.eachLayer(layer => {
      if (layer instanceof L.Marker && layer !== baseMarkerRef.current) map.removeLayer(layer);
    });

    const bounds: L.LatLngExpression[] = [];
    let pendingGeocode = 0;

    const fitIfReady = () => {
      if (bounds.length > 0) {
        map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [50, 50], maxZoom: 14 });
      }
    };

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
      const marker = L.marker(pos, { icon }).addTo(map).bindPopup(popup);
      marker.on('click', () => {
        if (routeModeRef.current) {
          const p = pos as [number, number];
          drawRoute(p[0], p[1], order.id);
        }
      });
    };

    filteredOrders.forEach(order => {
      if (order.latitude && order.longitude) {
        const pos: L.LatLngExpression = [order.latitude, order.longitude];
        bounds.push(pos);
        createMarker(order, pos);
      }
    });

    filteredOrders.forEach(order => {
      if (!order.latitude && !order.longitude && order.address) {
        pendingGeocode++;
        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(order.address)}&format=json&limit=1`)
          .then(res => res.json())
          .then(data => {
            if (data[0]) {
              const pos: L.LatLngExpression = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
              bounds.push(pos);
              createMarker(order, pos);
            }
          })
          .catch(() => {})
          .finally(() => {
            pendingGeocode--;
            if (pendingGeocode === 0) fitIfReady();
          });
      }
    });

    // Fit immediately for orders with coordinates
    if (pendingGeocode === 0) fitIfReady();
  }, [filteredOrders, selectedCity]);

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

      {/* Cities */}
      {cityCounts.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4" /> Cidades
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCity(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  !selectedCity
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-muted text-foreground border-border'
                }`}
              >
                Todas
              </button>
              {cityCounts.map(([city, count]) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(selectedCity === city ? null : city)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedCity === city
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-muted text-foreground border-border'
                  }`}
                >
                  {city} ({count})
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Route info */}
      {routeInfo && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted border border-border text-sm font-medium">
          <span className="flex-1">{routeInfo}</span>
          <button
            onClick={() => {
              setRouteInfo(null);
              setRouteMode(false);
              routeModeRef.current = false;
              if (routeLayerRef.current) routeLayerRef.current.clearLayers();
            }}
            className="text-xs text-destructive font-semibold hover:underline"
          >
            Limpar
          </button>
        </div>
      )}

      <div ref={mapRef} className="w-full h-[calc(100vh-220px)] rounded-xl border shadow-sm z-0" />
    </div>
  );
};

export default OrdersMap;
