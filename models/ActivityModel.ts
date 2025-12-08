export enum ActivityType {
  IDLE = 'idle',
  WALKING = 'walking',
  RUNNING = 'running',
  VEHICLE = 'vehicle',
  UNKNOWN = 'unknown'
}

export interface LocationData {
  latitude: number;
  longitude: number;
  speed: number | null;
  timestamp: number;
  altitude?: number | null;
  accuracy?: number | null;
  heading?: number | null;
}

export interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  magnitude: number;
  timestamp: number;
}

export interface ActivityLog {
  id: string;
  activity: ActivityType;
  confidence: number;
  location: LocationData;
  acceleration: AccelerometerData;
  timestamp: number;
  speed: number;
}

export interface SessionStats {
  sessionId: string;
  startTime: number;
  endTime: number | null;
  duration: number;
  distance: number;
  steps: number;
  calories: number;
  averageSpeed: number;
  maxSpeed: number;
  activities: {
    [key in ActivityType]?: number;
  };
}

export interface SavedRoute {
  id: string;
  name: string;
  date: number;
  logs: ActivityLog[];
  stats: SessionStats;
}

export interface ClassifierConfig {
  idleSpeedThreshold: number;
  walkingSpeedThreshold: number;
  runningSpeedThreshold: number;
  vehicleSpeedThreshold: number;
  idleAccelerationThreshold: number;
  walkingAccelerationThreshold: number;
  runningAccelerationThreshold: number;
  movingAverageWindow: number;
  confidenceThreshold: number;
  stepDetectionThreshold: number;
  caloriesPerStep: number;
  caloriesPerKmRunning: number;
  caloriesPerKmVehicle: number;
}

export const DEFAULT_CLASSIFIER_CONFIG: ClassifierConfig = {
  idleSpeedThreshold: 0.5, // m/s
  walkingSpeedThreshold: 2.5, // m/s
  runningSpeedThreshold: 5.0, // m/s
  vehicleSpeedThreshold: 8.0, // m/s
  idleAccelerationThreshold: 0.15, // g
  walkingAccelerationThreshold: 0.3, // g
  runningAccelerationThreshold: 0.6, // g
  movingAverageWindow: 5,
  confidenceThreshold: 0.7,
  stepDetectionThreshold: 0.25,
  caloriesPerStep: 0.04,
  caloriesPerKmRunning: 62,
  caloriesPerKmVehicle: 0
};

export interface TotalStats {
  totalDistance: number;
  totalSteps: number;
  totalCalories: number;
  totalSessions: number;
  totalDuration: number;
  lastUpdated: number;
}