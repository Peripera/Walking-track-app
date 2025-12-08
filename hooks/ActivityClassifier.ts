// hooks/ActivityClassifier.ts
import { useState, useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';
import {
  ActivityType,
  ActivityLog,
  SessionStats,
  LocationData,
  AccelerometerData
} from '../models/ActivityModel';
import LocationService from '../services/LocationService';
import ActivityClassifierService from '../services/ClassifierService';
import RouteService from '../services/Routeservice';

export interface UseActivityClassifierReturn {
  currentActivity: ActivityType;
  confidence: number;
  activityLogs: ActivityLog[];
  sessionStats: SessionStats;
  isActive: boolean;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  location: LocationData | null;
  acceleration: AccelerometerData | null;
  hasPermission: boolean;
  error: string | null;
}

export function useActivityClassifier(): UseActivityClassifierReturn {
  const [isActive, setIsActive] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(ActivityType.UNKNOWN);
  const [confidence, setConfidence] = useState(0);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [acceleration, setAcceleration] = useState<AccelerometerData | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para sessionStats
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    sessionId: '',
    startTime: 0,
    endTime: null,
    duration: 0,
    distance: 0,
    steps: 0,
    calories: 0,
    averageSpeed: 0,
    maxSpeed: 0,
    activities: {}
  });

  const lastLocationRef = useRef<LocationData | null>(null);
  const accelerometerSubscriptionRef = useRef<{ remove: () => void } | null>(null);

  // Solicitar permisos al montar
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const granted = await LocationService.requestPermissions();
        setHasPermission(granted);
        if (!granted) {
          setError('Permisos de ubicación no otorgados');
        }
      } catch (err) {
        setError('Error solicitando permisos');
        console.error('Error en permisos:', err);
      }
    };

    requestPermissions();
  }, []);

  // Iniciar tracking
  const startTracking = async () => {
    try {
      setError(null);
      
      if (!hasPermission) {
        const granted = await LocationService.requestPermissions();
        setHasPermission(granted);
        if (!granted) {
          throw new Error('Permisos de ubicación no otorgados');
        }
      }

      // Inicializar sesión
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionStats({
        sessionId,
        startTime: Date.now(),
        endTime: null,
        duration: 0,
        distance: 0,
        steps: 0,
        calories: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        activities: {}
      });

      lastLocationRef.current = null;
      setActivityLogs([]);
      ActivityClassifierService.reset();

      setIsActive(true);

  
      await LocationService.startTracking((gps) => {
        const now = Date.now();

        const newLoc: LocationData = {
          latitude: gps.latitude,
          longitude: gps.longitude,
          accuracy: gps.accuracy ?? null,
          timestamp: gps.timestamp,
          altitude: gps.altitude ?? null,
          heading: gps.heading ?? null,
          speed: 0
        };

        // Calcular velocidad MANUALMENTE
        if (lastLocationRef.current) {
          const dt = (now - lastLocationRef.current.timestamp) / 1000;
          const dist = LocationService.calculateDistance(
            lastLocationRef.current.latitude,
            lastLocationRef.current.longitude,
            newLoc.latitude,
            newLoc.longitude
          );

          const speed = dist / dt;
          newLoc.speed = isFinite(speed) ? speed : 0;

          // Actualizar distancia
          setSessionStats(prev => ({
            ...prev,
            distance: prev.distance + (isFinite(dist) ? dist : 0),
            maxSpeed: Math.max(prev.maxSpeed, newLoc.speed ?? 0)
          }));
        }

        lastLocationRef.current = newLoc;
        setLocation(newLoc);
      }, {
        accuracy: 6,
        timeInterval: 1000,
        distanceInterval: 1
      });


      Accelerometer.setUpdateInterval(1000); 
      
      accelerometerSubscriptionRef.current = Accelerometer.addListener(({ x, y, z }) => {
        const magnitude = ActivityClassifierService.calculateMagnitude(x, y, z);
        
        const accelData: AccelerometerData = {
          x,
          y,
          z,
          magnitude,
          timestamp: Date.now()
        };
        
        setAcceleration(accelData);


        if (location?.latitude && location?.longitude) {
          // Clasificar actividad
          const speed = location.speed ?? 0;
          
          ActivityClassifierService.updateHistories(speed, magnitude);
          
          const activity = ActivityClassifierService.getActivity(speed, magnitude);
          const activityConfidence = ActivityClassifierService.getConfidence(
            speed,
            magnitude,
            activity
          );

          setCurrentActivity(activity);
          setConfidence(activityConfidence);

          // Crear log
          const log: ActivityLog = {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            activity,
            confidence: activityConfidence,
            location,
            acceleration: accelData,
            timestamp: Date.now(),
            speed
          };

          setActivityLogs(prev => [...prev, log]);

    
          setSessionStats(prev => {
            const now = Date.now();
            const duration = now - prev.startTime;
            const durationInSeconds = duration / 1000;
            
            let steps = prev.steps;
            let calories = prev.calories;

            // Incrementar pasos cada segundo si está caminando o corriendo
            if (activity === ActivityType.WALKING || activity === ActivityType.RUNNING) {
              steps += 1;
            }

            // Calcular calorías
            if (activity === ActivityType.RUNNING) {
              calories += 0.1;
            } else if (activity === ActivityType.WALKING) {
              calories += 0.05;
            }

            // Velocidad promedio
            const averageSpeed = durationInSeconds > 0 
              ? prev.distance / durationInSeconds 
              : 0;

            return {
              ...prev,
              duration,
              steps,
              calories,
              averageSpeed,
              activities: {
                ...prev.activities,
                [activity]: (prev.activities[activity] || 0) + 1
              }
            };
          });
        }
      });

    } catch (err) {
      console.error('Error iniciando tracking:', err);
      setError(err instanceof Error ? err.message : 'Error iniciando tracking');
      setIsActive(false);
      throw err;
    }
  };

  // Detener tracking
  const stopTracking = async () => {
    try {
      // Detener servicios
      LocationService.stopTracking();
      
      if (accelerometerSubscriptionRef.current) {
        accelerometerSubscriptionRef.current.remove();
        accelerometerSubscriptionRef.current = null;
      }

      // Finalizar sesión
      const finalStats: SessionStats = {
        ...sessionStats,
        endTime: Date.now(),
        duration: Date.now() - sessionStats.startTime
      };

      setSessionStats(finalStats);

      // Guardar ruta si hay logs
      if (activityLogs.length > 0) {
        await RouteService.saveRoute(activityLogs, finalStats);
      }

      setIsActive(false);
      ActivityClassifierService.reset();
    } catch (err) {
      console.error('Error deteniendo tracking:', err);
      setError('Error guardando datos de sesión');
      throw err;
    }
  };

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (isActive) {
        LocationService.stopTracking();
        if (accelerometerSubscriptionRef.current) {
          accelerometerSubscriptionRef.current.remove();
        }
      }
    };
  }, [isActive]);

  return {
    currentActivity,
    confidence,
    activityLogs,
    sessionStats,
    isActive,
    startTracking,
    stopTracking,
    location,
    acceleration,
    hasPermission,
    error
  };
}