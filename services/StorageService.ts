import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityLog, SessionStats, SavedRoute, TotalStats } from '../models/ActivityModel';

const KEYS = {
  LOGS: '@activity_logs',
  SESSION_STATS: '@session_stats',
  TOTAL_STATS: '@total_stats',
  ROUTES: '@saved_routes'
};

class StorageService {
  /**
   * Guarda logs de actividad
   */
  async saveLogs(logs: ActivityLog[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(logs);
      await AsyncStorage.setItem(KEYS.LOGS, jsonValue);
    } catch (error) {
      console.error('Error guardando logs:', error);
      throw new Error('No se pudieron guardar los logs de actividad');
    }
  }

  /**
   * Lee logs de actividad
   */
  async readLogs(): Promise<ActivityLog[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(KEYS.LOGS);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error leyendo logs:', error);
      return [];
    }
  }

  /**
   * Guarda estadísticas de sesión
   */
  async saveSessionStats(stats: SessionStats): Promise<void> {
    try {
      const jsonValue = JSON.stringify(stats);
      await AsyncStorage.setItem(KEYS.SESSION_STATS, jsonValue);
    } catch (error) {
      console.error('Error guardando estadísticas de sesión:', error);
      throw new Error('No se pudieron guardar las estadísticas de sesión');
    }
  }

  /**
   * Lee estadísticas de sesión
   */
  async readSessionStats(): Promise<SessionStats | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(KEYS.SESSION_STATS);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error leyendo estadísticas de sesión:', error);
      return null;
    }
  }

  /**
   * Guarda estadísticas totales
   */
  async saveTotalStats(stats: TotalStats): Promise<void> {
    try {
      const jsonValue = JSON.stringify(stats);
      await AsyncStorage.setItem(KEYS.TOTAL_STATS, jsonValue);
    } catch (error) {
      console.error('Error guardando estadísticas totales:', error);
      throw new Error('No se pudieron guardar las estadísticas totales');
    }
  }

  /**
   * Lee estadísticas totales
   */
  async readTotalStats(): Promise<TotalStats | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(KEYS.TOTAL_STATS);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error leyendo estadísticas totales:', error);
      return null;
    }
  }

  /**
   * Actualiza estadísticas totales con los datos de una sesión
   */
  async updateTotalStats(sessionStats: SessionStats): Promise<void> {
    try {
      const currentStats = await this.readTotalStats();
      
      const updatedStats: TotalStats = {
        totalDistance: (currentStats?.totalDistance || 0) + sessionStats.distance,
        totalSteps: (currentStats?.totalSteps || 0) + sessionStats.steps,
        totalCalories: (currentStats?.totalCalories || 0) + sessionStats.calories,
        totalSessions: (currentStats?.totalSessions || 0) + 1,
        totalDuration: (currentStats?.totalDuration || 0) + sessionStats.duration,
        lastUpdated: Date.now()
      };

      await this.saveTotalStats(updatedStats);
    } catch (error) {
      console.error('Error actualizando estadísticas totales:', error);
      throw new Error('No se pudieron actualizar las estadísticas totales');
    }
  }

  /**
   * Guarda una ruta completa
   */
  async saveRoute(route: SavedRoute): Promise<void> {
    try {
      const routes = await this.readRoutes();
      routes.push(route);
      const jsonValue = JSON.stringify(routes);
      await AsyncStorage.setItem(KEYS.ROUTES, jsonValue);
    } catch (error) {
      console.error('Error guardando ruta:', error);
      throw new Error('No se pudo guardar la ruta');
    }
  }

  /**
   * Lee todas las rutas guardadas
   */
  async readRoutes(): Promise<SavedRoute[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(KEYS.ROUTES);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error leyendo rutas:', error);
      return [];
    }
  }

  /**
   * Lee una ruta específica por ID
   */
  async readRoute(id: string): Promise<SavedRoute | null> {
    try {
      const routes = await this.readRoutes();
      return routes.find(route => route.id === id) || null;
    } catch (error) {
      console.error('Error leyendo ruta:', error);
      return null;
    }
  }

  /**
   * Elimina una ruta por ID
   */
  async deleteRoute(id: string): Promise<void> {
    try {
      const routes = await this.readRoutes();
      const filteredRoutes = routes.filter(route => route.id !== id);
      const jsonValue = JSON.stringify(filteredRoutes);
      await AsyncStorage.setItem(KEYS.ROUTES, jsonValue);
    } catch (error) {
      console.error('Error eliminando ruta:', error);
      throw new Error('No se pudo eliminar la ruta');
    }
  }

  /**
   * Limpia todos los datos almacenados
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        KEYS.LOGS,
        KEYS.SESSION_STATS,
        KEYS.TOTAL_STATS,
        KEYS.ROUTES
      ]);
    } catch (error) {
      console.error('Error limpiando datos:', error);
      throw new Error('No se pudieron limpiar los datos');
    }
  }

  /**
   * Obtiene el tamaño de almacenamiento usado (aproximado)
   */
  async getStorageSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      
      for (const key of keys) {
        if (Object.values(KEYS).includes(key)) {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            totalSize += new Blob([value]).size;
          }
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Error calculando tamaño de almacenamiento:', error);
      return 0;
    }
  }
}

export default new StorageService();
