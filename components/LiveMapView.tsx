// components/LiveMapView.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { LocationData } from '../models/ActivityModel';

interface LiveMapViewProps {
  locations: LocationData[];
  currentLocation: LocationData | null;
}

export function LiveMapView({ locations, currentLocation }: LiveMapViewProps) {
  const [mapHtml, setMapHtml] = useState<string>('');

  useEffect(() => {
    if (locations.length > 0 || currentLocation) {
      setMapHtml(generateLiveMapHtml(locations, currentLocation));
    }
  }, [locations, currentLocation]);

  const generateLiveMapHtml = (
    locs: LocationData[],
    current: LocationData | null
  ): string => {
    // Si no hay ubicaciones, mostrar mapa vacío centrado en ubicación actual
    if (locs.length === 0 && !current) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              margin: 0; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              background: #1a1a1a; 
              color: white; 
              font-family: system-ui;
            }
          </style>
        </head>
        <body>
          <div>Esperando señal GPS...</div>
        </body>
        </html>
      `;
    }

    // Determinar centro del mapa
    const centerLocation = current || locs[locs.length - 1];
    const centerLat = centerLocation.latitude;
    const centerLon = centerLocation.longitude;

    // Crear segmentos para la polilínea
    const points = locs.map(loc => [loc.latitude, loc.longitude]);
    const pointsJson = JSON.stringify(points);

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <style>
        html, body, #map {
          height: 100%;
          margin: 0;
          padding: 0;
          background: #0b1020;
        }
        .live-indicator {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(68, 27, 233, 0.97);
          color: #fff;
          padding: 6px 12px;
          border-radius: 20px;
          font-family: system-ui;
          font-size: 11px;
          font-weight: 700;
          z-index: 1000;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .live-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          background: #fff;
          border-radius: 50%;
          margin-right: 6px;
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      </style>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    </head>
    <body>
      <div id="map"></div>
      <div class="live-indicator">
        <span class="live-dot"></span>EN VIVO
      </div>
      <script>
        var map = L.map('map', {
          zoomControl: false,
          attributionControl: false
        }).setView([${centerLat}, ${centerLon}], 17);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19
        }).addTo(map);

        var points = ${pointsJson};

        // Dibujar la ruta
        if (points.length > 1) {
          L.polyline(points, {
            color: '#00e1ff',
            weight: 4,
            opacity: 0.8,
            lineCap: 'round'
          }).addTo(map);

          // Punto de inicio
          L.circleMarker(points[0], {
            radius: 6,
            color: '#00ff85',
            fillColor: '#00ff85',
            fillOpacity: 1,
            weight: 2
          }).addTo(map).bindPopup('Inicio');
        }

        // Ubicación actual (último punto)
        if (points.length > 0) {
          var currentLatLng = points[points.length - 1];
          
          // Marcador pulsante para ubicación actual
          var currentMarker = L.circleMarker(currentLatLng, {
            radius: 8,
            color: '#16e74eff',
            fillColor: '#17fb26ff',
            fillOpacity: 1,
            weight: 3
          }).addTo(map);

          // Círculo exterior pulsante
          var pulsingCircle = L.circle(currentLatLng, {
            radius: 20,
            color: '#5df171ff',
            fillColor: '#6df46bff',
            fillOpacity: 0.2,
            weight: 1
          }).addTo(map);

          // Mantener el mapa centrado en la ubicación actual
          map.setView(currentLatLng, 17);
        }
      </script>
    </body>
    </html>
    `;
  };

  if (!mapHtml) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a'
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent'
  }
});
