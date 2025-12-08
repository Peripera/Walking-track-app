// controllers/ActivityController.ts
import { ActivityLog, SessionStats, SavedRoute, ActivityType } from '../models/ActivityModel';
import LocationService from '../services/LocationService';
import ActivityClassifierService from '../services/ClassifierService';
import StorageService from '../services/StorageService';
import RouteService from '../services/Routeservice';

/**
 * Controlador principal para gestionar la lógica de actividad física
 * Implementa el patrón MVC como capa intermedia entre la vista y los servicios
 */
class ActivityController {
  /**
   * Inicia una nueva sesión de tracking
   */
  async startSession(): Promise<boolean> {
    try {
      const hasPermission = await LocationService.requestPermissions();
      if (!hasPermission) {
        throw new Error('Permisos de ubicación no otorgados');
      }
      return true;
    } catch (error) {
      console.error('Error iniciando sesión:', error);
      throw error;
    }
  }

  /**
   * Finaliza una sesión y guarda los datos
   */
  async endSession(
    logs: ActivityLog[],
    stats: SessionStats
  ): Promise<SavedRoute> {
    try {
      // Validar que haya datos para guardar
      if (logs.length === 0) {
        throw new Error('No hay datos para guardar');
      }

      // Guardar la ruta
      const savedRoute = await RouteService.saveRoute(logs, stats);

      // Guardar logs y estadísticas
      await StorageService.saveLogs(logs);
      await StorageService.saveSessionStats(stats);

      return savedRoute;
    } catch (error) {
      console.error('Error finalizando sesión:', error);
      throw error;
    }
  }

  /**
   * Procesa un nuevo punto de ubicación y aceleración
   */
  processActivityData(
    location: { latitude: number; longitude: number; speed: number | null },
    acceleration: { x: number; y: number; z: number },
    lastLocation: { latitude: number; longitude: number } | null
  ): {
    activity: ActivityType;
    confidence: number;
    distance: number;
  } {
    try {
      // Calcular magnitud de aceleración
      const magnitude = ActivityClassifierService.calculateMagnitude(
        acceleration.x,
        acceleration.y,
        acceleration.z
      );

      // Obtener velocidad efectiva
      const speed = Math.abs(location.speed ?? 0);

      // Actualizar historial
      ActivityClassifierService.updateHistories(speed, magnitude);

      // Clasificar actividad
      const activity = ActivityClassifierService.getActivity(speed, magnitude);
      const confidence = ActivityClassifierService.getConfidence(
        speed,
        magnitude,
        activity
      );

      // Calcular distancia si hay ubicación previa
      let distance = 0;
      if (lastLocation) {
        distance = LocationService.calculateDistance(
          lastLocation.latitude,
          lastLocation.longitude,
          location.latitude,
          location.longitude
        );
      }

      return { activity, confidence, distance };
    } catch (error) {
      console.error('Error procesando datos de actividad:', error);
      return {
        activity: ActivityType.UNKNOWN,
        confidence: 0,
        distance: 0
      };
    }
  }

  /**
   * Calcula estadísticas de una sesión
   */
  calculateSessionStats(
    logs: ActivityLog[],
    sessionId: string,
    startTime: number
  ): SessionStats {
    if (logs.length === 0) {
      return {
        sessionId,
        startTime,
        endTime: Date.now(),
        duration: 0,
        distance: 0,
        steps: 0,
        calories: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        activities: {}
      };
    }

    // Calcular distancia total
    let totalDistance = 0;
    for (let i = 1; i < logs.length; i++) {
      const prev = logs[i - 1];
      const current = logs[i];
      totalDistance += LocationService.calculateDistance(
        prev.location.latitude,
        prev.location.longitude,
        current.location.latitude,
        current.location.longitude
      );
    }

    // Calcular pasos (aproximación basada en detección de picos)
    let steps = 0;
    for (let i = 1; i < logs.length; i++) {
      if (ActivityClassifierService.detectStep(logs[i].acceleration.magnitude)) {
        const activity = logs[i].activity;
        if (activity === ActivityType.WALKING || activity === ActivityType.RUNNING) {
          steps++;
        }
      }
    }

    // Calcular calorías
    const config = ActivityClassifierService.getConfig();
    let calories = steps * config.caloriesPerStep;
    
    // Agregar calorías por distancia para running
    const runningDistance = logs
      .filter(log => log.activity === ActivityType.RUNNING)
      .reduce((sum, log, index, arr) => {
        if (index === 0) return sum;
        const prev = arr[index - 1];
        return sum + LocationService.calculateDistance(
          prev.location.latitude,
          prev.location.longitude,
          log.location.latitude,
          log.location.longitude
        );
      }, 0);
    
    calories += (runningDistance / 1000) * config.caloriesPerKmRunning;

    // Calcular velocidades
    const speeds: number[] = logs
      .map(log => log.speed)
      .filter((s): s is number => s > 0);
    const averageSpeed = speeds.length > 0
      ? speeds.reduce((sum, s) => sum + s, 0) / speeds.length
      : 0;
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;

    // Contar actividades
    const activities: { [key in ActivityType]?: number } = {};
    logs.forEach(log => {
      activities[log.activity] = (activities[log.activity] || 0) + 1;
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    return {
      sessionId,
      startTime,
      endTime,
      duration,
      distance: totalDistance,
      steps,
      calories,
      averageSpeed,
      maxSpeed,
      activities
    };
  }

  /**
   * Obtiene todas las rutas guardadas
   */
  async getSavedRoutes(): Promise<SavedRoute[]> {
    try {
      return await RouteService.getRoutes();
    } catch (error) {
      console.error('Error obteniendo rutas guardadas:', error);
      return [];
    }
  }

  /**
   * Elimina una ruta guardada
   */
  async deleteRoute(routeId: string): Promise<void> {
    try {
      await RouteService.deleteRoute(routeId);
    } catch (error) {
      console.error('Error eliminando ruta:', error);
      throw error;
    }
  }

  /**
   * Obtiene el HTML del mapa para una ruta
   */
  getRouteMapHTML(route: SavedRoute): string {
    try {
      return RouteService.generateMapHTML(route);
    } catch (error) {
      console.error('Error generando HTML del mapa:', error);
      return '<html><body><h1>Error generando mapa</h1></body></html>';
    }
  }

  /**
   * Obtiene las estadísticas totales
   */
  async getTotalStats() {
    try {
      return await StorageService.readTotalStats();
    } catch (error) {
      console.error('Error obteniendo estadísticas totales:', error);
      return null;
    }
  }

  /**
   * Limpia todos los datos almacenados
   */
  async clearAllData(): Promise<void> {
    try {
      await StorageService.clearAll();
      ActivityClassifierService.reset();
    } catch (error) {
      console.error('Error limpiando datos:', error);
      throw error;
    }
  }

  /**
   * Reinicia el clasificador de actividad
   */
  resetClassifier(): void {
    ActivityClassifierService.reset();
  }
}

export default new ActivityController();