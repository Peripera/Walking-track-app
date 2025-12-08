// hooks/useActivityClassifier.ts
import { useState, useEffect, useCallback, useRef } from 'react';
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

  const sessionStatsRef = useRef<SessionStats>({
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
  const lastAccelerationRef = useRef<number>(0);
  const accelerometerSubscriptionRef = useRef<{ remove: () => void } | null>(null);
  const stepCountRef = useRef<number>(0);
  const speedSumRef = useRef<number>(0);
  const speedCountRef = useRef<number>(0);

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

  // Callback para actualizar ubicación
  const handleLocationUpdate = useCallback((newLocation: LocationData) => {
    setLocation(newLocation);

    if (!isActive || !acceleration) return;

    try {
      // Calcular velocidad efectiva
      const speed = newLocation.speed ?? 0;
      const effectiveSpeed = Math.abs(speed);

      // Actualizar historial del clasificador
      ActivityClassifierService.updateHistory(effectiveSpeed, acceleration.magnitude);

      // Clasificar actividad
      const activity = ActivityClassifierService.getActivity(
        effectiveSpeed,
        acceleration.magnitude
      );
      const activityConfidence = ActivityClassifierService.getConfidence(
        effectiveSpeed,
        acceleration.magnitude,
        activity
      );

      setCurrentActivity(activity);
      setConfidence(activityConfidence);

      // Calcular distancia si hay ubicación previa
      let distanceIncrement = 0;
      if (lastLocationRef.current) {
        distanceIncrement = LocationService.calculateDistance(
          lastLocationRef.current.latitude,
          lastLocationRef.current.longitude,
          newLocation.latitude,
          newLocation.longitude
        );
      }

      // Detectar pasos
      if (ActivityClassifierService.detectStep(acceleration.magnitude)) {
        if (activity === ActivityType.WALKING || activity === ActivityType.RUNNING) {
          stepCountRef.current += 1;
        }
      }

      // Calcular calorías
      const config = ActivityClassifierService.getConfig();
      let caloriesIncrement = 0;
      
      if (activity === ActivityType.WALKING) {
        caloriesIncrement = config.caloriesPerStep;
      } else if (activity === ActivityType.RUNNING) {
        caloriesIncrement = config.caloriesPerStep + (distanceIncrement / 1000) * config.caloriesPerKmRunning;
      }

      // Actualizar velocidad promedio
      speedSumRef.current += effectiveSpeed;
      speedCountRef.current += 1;

      // Crear log de actividad
      const activityLog: ActivityLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        activity,
        confidence: activityConfidence,
        location: newLocation,
        acceleration,
        timestamp: Date.now(),
        speed: effectiveSpeed
      };

      // Actualizar logs
      setActivityLogs(prev => [...prev, activityLog]);

      // Actualizar stats de sesión
      const currentStats = sessionStatsRef.current;
      const now = Date.now();
      const duration = now - currentStats.startTime;

      sessionStatsRef.current = {
        ...currentStats,
        duration,
        distance: currentStats.distance + distanceIncrement,
        steps: stepCountRef.current,
        calories: currentStats.calories + caloriesIncrement,
        averageSpeed: speedCountRef.current > 0 
          ? speedSumRef.current / speedCountRef.current 
          : 0,
        maxSpeed: Math.max(currentStats.maxSpeed, effectiveSpeed),
        activities: {
          ...currentStats.activities,
          [activity]: (currentStats.activities[activity] || 0) + 1
        }
      };

      lastLocationRef.current = newLocation;
    } catch (err) {
      console.error('Error procesando ubicación:', err);
      setError('Error procesando datos de ubicación');
    }
  }, [isActive, acceleration]);

  // Iniciar tracking
  const startTracking = useCallback(async () => {
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
      sessionStatsRef.current = {
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
      };

      // Reiniciar contadores
      stepCountRef.current = 0;
      speedSumRef.current = 0;
      speedCountRef.current = 0;
      lastLocationRef.current = null;
      setActivityLogs([]);
      ActivityClassifierService.reset();

      // Iniciar acelerómetro
      Accelerometer.setUpdateInterval(100); // 10 Hz
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
        lastAccelerationRef.current = magnitude;
      });

      // Iniciar GPS
      await LocationService.startTracking(handleLocationUpdate, {
        accuracy: 6, // High accuracy
        timeInterval: 1000,
        distanceInterval: 1
      });

      setIsActive(true);
    } catch (err) {
      console.error('Error iniciando tracking:', err);
      setError(err instanceof Error ? err.message : 'Error iniciando tracking');
      throw err;
    }
  }, [hasPermission, handleLocationUpdate]);

  // Detener tracking
  const stopTracking = useCallback(async () => {
    try {
      // Detener servicios
      LocationService.stopTracking();
      
      if (accelerometerSubscriptionRef.current) {
        accelerometerSubscriptionRef.current.remove();
        accelerometerSubscriptionRef.current = null;
      }

      // Finalizar sesión
      const finalStats: SessionStats = {
        ...sessionStatsRef.current,
        endTime: Date.now(),
        duration: Date.now() - sessionStatsRef.current.startTime
      };

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
  }, [activityLogs]);

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
    sessionStats: sessionStatsRef.current,
    isActive,
    startTracking,
    stopTracking,
    location,
    acceleration,
    hasPermission,
    error
  };
}
