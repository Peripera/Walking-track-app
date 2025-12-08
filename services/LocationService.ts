// services/LocationService.ts
import * as Location from 'expo-location';
import { LocationData } from '../models/ActivityModel';

class LocationService {
  private subscription: Location.LocationSubscription | null = null;
  private hasPermission: boolean = false;

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.error('Permiso de ubicación denegado');
        this.hasPermission = false;
        return false;
      }

      // Solicitar permisos de ubicación en segundo plano (opcional pero recomendado)
      try {
        await Location.requestBackgroundPermissionsAsync();
      } catch (error) {
        console.warn('Permisos de segundo plano no disponibles:', error);
      }

      this.hasPermission = true;
      return true;
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      this.hasPermission = false;
      return false;
    }
  }

  async startTracking(
    callback: (location: LocationData) => void,
    options?: Location.LocationOptions
  ): Promise<void> {
    if (!this.hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) {
        throw new Error('Permisos de ubicación no otorgados');
      }
    }

    try {
      this.subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000, // Actualizar cada segundo
          distanceInterval: 1, // Actualizar cada metro
          ...options
        },
        (location) => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            speed: location.coords.speed,
            timestamp: location.timestamp,
            altitude: location.coords.altitude,
            accuracy: location.coords.accuracy,
            heading: location.coords.heading
          };
          callback(locationData);
        }
      );
    } catch (error) {
      console.error('Error iniciando tracking de ubicación:', error);
      throw error;
    }
  }

  stopTracking(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
  }

  /**
   * Calcula la distancia entre dos puntos usando la fórmula de Haversine
   * @param lat1 Latitud del punto 1
   * @param lon1 Longitud del punto 1
   * @param lat2 Latitud del punto 2
   * @param lon2 Longitud del punto 2
   * @returns Distancia en metros
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en metros
  }

  getHasPermission(): boolean {
    return this.hasPermission;
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      if (!this.hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        speed: location.coords.speed,
        timestamp: location.timestamp,
        altitude: location.coords.altitude,
        accuracy: location.coords.accuracy,
        heading: location.coords.heading
      };
    } catch (error) {
      console.error('Error obteniendo ubicación actual:', error);
      return null;
    }
  }
}

export default new LocationService();
