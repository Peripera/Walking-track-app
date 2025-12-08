// services/RouteService.ts
import { SavedRoute, ActivityLog, SessionStats, ActivityType } from '../models/ActivityModel';
import StorageService from './StorageService';

class RouteService {
  /**
   * Guarda una ruta completa con logs y estadísticas
   */
  async saveRoute(
    logs: ActivityLog[],
    stats: SessionStats,
    name?: string
  ): Promise<SavedRoute> {
    try {
      const route: SavedRoute = {
        id: `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name || `Ruta ${new Date(stats.startTime).toLocaleString()}`,
        date: stats.startTime,
        logs,
        stats
      };

      await StorageService.saveRoute(route);
      await StorageService.updateTotalStats(stats);

      return route;
    } catch (error) {
      console.error('Error guardando ruta:', error);
      throw new Error('No se pudo guardar la ruta');
    }
  }

  /**
   * Recupera todas las rutas guardadas
   */
  async getRoutes(): Promise<SavedRoute[]> {
    try {
      return await StorageService.readRoutes();
    } catch (error) {
      console.error('Error recuperando rutas:', error);
      return [];
    }
  }

  /**
   * Recupera una ruta específica
   */
  async getRoute(id: string): Promise<SavedRoute | null> {
    try {
      return await StorageService.readRoute(id);
    } catch (error) {
      console.error('Error recuperando ruta:', error);
      return null;
    }
  }

  /**
   * Elimina una ruta
   */
  async deleteRoute(id: string): Promise<void> {
    try {
      await StorageService.deleteRoute(id);
    } catch (error) {
      console.error('Error eliminando ruta:', error);
      throw new Error('No se pudo eliminar la ruta');
    }
  }

  /**
   * Genera el HTML del mapa con Leaflet
   */
  generateMapHTML(route: SavedRoute): string {
    const coordinates = route.logs.map(log => [
      log.location.latitude,
      log.location.longitude
    ]);

    if (coordinates.length === 0) {
      return this.generateEmptyMapHTML();
    }

    // Calcular el centro del mapa
    const centerLat = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
    const centerLon = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;

    // Generar marcadores por tipo de actividad con colores
    const activityColors: { [key in ActivityType]: string } = {
      [ActivityType.IDLE]: '#6B7280',
      [ActivityType.WALKING]: '#3B82F6',
      [ActivityType.RUNNING]: '#EF4444',
      [ActivityType.VEHICLE]: '#8B5CF6',
      [ActivityType.UNKNOWN]: '#9CA3AF'
    };

    const markers = route.logs
      .filter((log, index) => index % 10 === 0) // Mostrar cada 10 puntos para no saturar
      .map(log => `
        L.circleMarker([${log.location.latitude}, ${log.location.longitude}], {
          radius: 4,
          fillColor: '${activityColors[log.activity]}',
          color: '#fff',
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(map).bindPopup(\`
          <div style="font-family: system-ui; font-size: 12px;">
            <strong>${this.getActivityEmoji(log.activity)} ${log.activity}</strong><br/>
            Velocidad: ${log.speed.toFixed(2)} m/s<br/>
            Aceleración: ${log.acceleration.magnitude.toFixed(3)} g<br/>
            Confianza: ${(log.confidence * 100).toFixed(0)}%
          </div>
        \`);
      `)
      .join('\n');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${route.name}</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { 
      margin: 0; 
      padding: 0; 
      font-family: system-ui, -apple-system, sans-serif;
    }
    #map { 
      height: 100vh; 
      width: 100vw; 
    }
    .legend {
      background: white;
      padding: 10px;
      border-radius: 5px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .legend-item {
      display: flex;
      align-items: center;
      margin: 5px 0;
      font-size: 12px;
    }
    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      margin-right: 8px;
      border: 2px solid white;
      box-shadow: 0 1px 2px rgba(0,0,0,0.2);
    }
    .info-panel {
      background: white;
      padding: 12px;
      border-radius: 5px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      max-width: 250px;
    }
    .info-panel h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      font-weight: 600;
    }
    .info-panel p {
      margin: 4px 0;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    // Inicializar mapa
    const map = L.map('map').setView([${centerLat}, ${centerLon}], 15);
    
    // Agregar capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Dibujar la ruta
    const route = [${coordinates.map(c => `[${c[0]}, ${c[1]}]`).join(', ')}];
    const polyline = L.polyline(route, {
      color: '#3B82F6',
      weight: 4,
      opacity: 0.7,
      smoothFactor: 1
    }).addTo(map);

    // Ajustar vista al recorrido
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

    // Agregar marcadores
    ${markers}

    // Agregar marcador de inicio
    L.marker([${coordinates[0][0]}, ${coordinates[0][1]}], {
      icon: L.divIcon({
        className: 'custom-icon',
        html: '<div style="background: #10B981; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🏁</div>',
        iconSize: [30, 30]
      })
    }).addTo(map).bindPopup('<strong>Inicio</strong>');

    // Agregar marcador de fin
    L.marker([${coordinates[coordinates.length - 1][0]}, ${coordinates[coordinates.length - 1][1]}], {
      icon: L.divIcon({
        className: 'custom-icon',
        html: '<div style="background: #EF4444; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🏁</div>',
        iconSize: [30, 30]
      })
    }).addTo(map).bindPopup('<strong>Fin</strong>');

    // Panel de información
    const info = L.control({ position: 'topright' });
    info.onAdd = function() {
      const div = L.DomUtil.create('div', 'info-panel');
      div.innerHTML = \`
        <h3>📊 Estadísticas</h3>
        <p><strong>Distancia:</strong> ${(route.stats.distance / 1000).toFixed(2)} km</p>
        <p><strong>Duración:</strong> ${this.formatDuration(route.stats.duration)}</p>
        <p><strong>Pasos:</strong> ${route.stats.steps}</p>
        <p><strong>Calorías:</strong> ${route.stats.calories.toFixed(0)} kcal</p>
        <p><strong>Vel. Promedio:</strong> ${route.stats.averageSpeed.toFixed(2)} m/s</p>
        <p><strong>Vel. Máxima:</strong> ${route.stats.maxSpeed.toFixed(2)} m/s</p>
      \`;
      return div;
    };
    info.addTo(map);

    // Leyenda
    const legend = L.control({ position: 'bottomleft' });
    legend.onAdd = function() {
      const div = L.DomUtil.create('div', 'legend');
      div.innerHTML = \`
        <strong style="display: block; margin-bottom: 8px; font-size: 12px;">Actividades</strong>
        <div class="legend-item">
          <div class="legend-color" style="background: #6B7280;"></div>
          <span>Quieto</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: #3B82F6;"></div>
          <span>Caminando</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: #EF4444;"></div>
          <span>Corriendo</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: #8B5CF6;"></div>
          <span>Vehículo</span>
        </div>
      \`;
      return div;
    };
    legend.addTo(map);
  </script>
</body>
</html>
    `.trim();
  }

  /**
   * Genera un mapa vacío
   */
  private generateEmptyMapHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mapa Vacío</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-family: system-ui;
      background: #f3f4f6;
    }
    .message {
      text-align: center;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div class="message">
    <h2>📍 Sin datos de ubicación</h2>
    <p>No hay puntos de ubicación para mostrar en el mapa.</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Obtiene el emoji de la actividad
   */
  private getActivityEmoji(activity: ActivityType): string {
    const emojis: { [key in ActivityType]: string } = {
      [ActivityType.IDLE]: '🧍',
      [ActivityType.WALKING]: '🚶',
      [ActivityType.RUNNING]: '🏃',
      [ActivityType.VEHICLE]: '🚗',
      [ActivityType.UNKNOWN]: '❓'
    };
    return emojis[activity];
  }

  /**
   * Formatea la duración en formato legible
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

export default new RouteService();