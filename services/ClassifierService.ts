// services/ActivityClassifierService.ts
import {
  ActivityType,
  AccelerometerData,
  ClassifierConfig,
  DEFAULT_CLASSIFIER_CONFIG
} from '../models/ActivityModel';

class ActivityClassifierService {
  private config: ClassifierConfig = DEFAULT_CLASSIFIER_CONFIG;
  private speedHistory: number[] = [];
  private accelerationHistory: number[] = [];

  setConfig(config: Partial<ClassifierConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): ClassifierConfig {
    return { ...this.config };
  }

  /**
   * Calcula la magnitud del vector de aceleración
   */
  calculateMagnitude(x: number, y: number, z: number): number {
    return Math.sqrt(x * x + y * y + z * z);
  }

  /**
   * Calcula el promedio móvil de un array
   */
  private calculateMovingAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  /**
   * Actualiza el historial con un nuevo valor
   */
  updateHistory(history: number[], newValue: number): number[] {
    const updated = [...history, newValue];
    if (updated.length > this.config.movingAverageWindow) {
      updated.shift();
    }
    return updated;
  }

  /**
   * Actualiza los historiales de velocidad y aceleración
   */
  updateHistories(speed: number, acceleration: number): void {
    this.speedHistory = this.updateHistory(this.speedHistory, speed);
    this.accelerationHistory = this.updateHistory(
      this.accelerationHistory,
      acceleration
    );
  }

  /**
   * Obtiene los promedios móviles actuales
   */
  getAverages(): { avgSpeed: number; avgAcceleration: number } {
    return {
      avgSpeed: this.calculateMovingAverage(this.speedHistory),
      avgAcceleration: this.calculateMovingAverage(this.accelerationHistory)
    };
  }

  /**
   * Clasifica la actividad basándose en velocidad y aceleración
   */
  getActivity(speed: number, acceleration: number): ActivityType {
    const { avgSpeed, avgAcceleration } = this.getAverages();

    // Usar promedios para clasificación más estable
    const effectiveSpeed = avgSpeed > 0 ? avgSpeed : speed;
    const effectiveAcceleration =
      avgAcceleration > 0 ? avgAcceleration : acceleration;

    // Reglas de clasificación
    if (effectiveSpeed < this.config.idleSpeedThreshold) {
      if (effectiveAcceleration < this.config.idleAccelerationThreshold) {
        return ActivityType.IDLE;
      }
      // Movimiento sin desplazamiento significativo
      return ActivityType.IDLE;
    }

    // Vehículo: velocidad muy alta
    if (effectiveSpeed >= this.config.vehicleSpeedThreshold) {
      return ActivityType.VEHICLE;
    }

    // Running: velocidad alta con aceleración significativa
    if (effectiveSpeed >= this.config.runningSpeedThreshold) {
      if (effectiveAcceleration >= this.config.runningAccelerationThreshold) {
        return ActivityType.RUNNING;
      }
      // Velocidad de running pero poca aceleración = vehículo lento
      return ActivityType.VEHICLE;
    }

    // Walking: velocidad media con aceleración moderada
    if (effectiveSpeed >= this.config.walkingSpeedThreshold) {
      if (effectiveAcceleration >= this.config.walkingAccelerationThreshold) {
        return ActivityType.RUNNING;
      }
      return ActivityType.WALKING;
    }

    // Velocidad baja con aceleración
    if (effectiveAcceleration >= this.config.walkingAccelerationThreshold) {
      return ActivityType.WALKING;
    }

    return ActivityType.IDLE;
  }

  /**
   * Calcula el nivel de confianza de la clasificación
   */
  getConfidence(
    speed: number,
    acceleration: number,
    activity: ActivityType
  ): number {
    let confidence = 0.5; // Confianza base

    const { avgSpeed, avgAcceleration } = this.getAverages();
    
    // Más datos históricos = mayor confianza
    const historyFactor = Math.min(
      this.speedHistory.length / this.config.movingAverageWindow,
      1
    );
    confidence += historyFactor * 0.2;

    // Consistencia entre velocidad y aceleración
    switch (activity) {
      case ActivityType.IDLE:
        if (speed < this.config.idleSpeedThreshold && 
            acceleration < this.config.idleAccelerationThreshold) {
          confidence += 0.3;
        }
        break;
      
      case ActivityType.WALKING:
        if (speed >= this.config.idleSpeedThreshold && 
            speed < this.config.runningSpeedThreshold &&
            acceleration >= this.config.walkingAccelerationThreshold) {
          confidence += 0.25;
        }
        break;
      
      case ActivityType.RUNNING:
        if (speed >= this.config.runningSpeedThreshold && 
            acceleration >= this.config.runningAccelerationThreshold) {
          confidence += 0.3;
        }
        break;
      
      case ActivityType.VEHICLE:
        if (speed >= this.config.vehicleSpeedThreshold) {
          confidence += 0.3;
        }
        break;
    }

    // Bonus por estabilidad en el promedio móvil
    if (this.speedHistory.length >= this.config.movingAverageWindow) {
      const speedVariance = this.calculateVariance(this.speedHistory);
      if (speedVariance < 0.5) {
        confidence += 0.1;
      }
    }

    return Math.min(Math.max(confidence, 0), 1); // Clamp entre 0 y 1
  }

  /**
   * Calcula la varianza de un array de números
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = this.calculateMovingAverage(values);
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    return this.calculateMovingAverage(squareDiffs);
  }

  /**
   * Detecta pasos basándose en picos de aceleración
   */
  detectStep(acceleration: number): boolean {
    if (this.accelerationHistory.length < 2) return false;
    
    const prevAcceleration = this.accelerationHistory[this.accelerationHistory.length - 1];
    const isPeak = 
      acceleration > prevAcceleration + this.config.stepDetectionThreshold &&
      acceleration > this.config.walkingAccelerationThreshold;
    
    return isPeak;
  }

  /**
   * Reinicia los historiales
   */
  reset(): void {
    this.speedHistory = [];
    this.accelerationHistory = [];
  }
}

export default new ActivityClassifierService();