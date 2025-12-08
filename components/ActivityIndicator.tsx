import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ActivityType } from '../models/ActivityModel';

interface ActivityIndicatorProps {
  activity: ActivityType;
  speed: number;
  acceleration: number;
  confidence: number;
}

const ACTIVITY_CONFIG = {
  [ActivityType.IDLE]: { emoji: '🧍', name: 'Quieto', color: '#6B7280' },
  [ActivityType.WALKING]: { emoji: '🚶', name: 'Caminando', color: '#3B82F6' },
  [ActivityType.RUNNING]: { emoji: '🏃', name: 'Corriendo', color: '#EF4444' },
  [ActivityType.VEHICLE]: { emoji: '🚗', name: 'Vehículo', color: '#8B5CF6' },
  [ActivityType.UNKNOWN]: { emoji: '❓', name: 'Desconocido', color: '#9CA3AF' }
};

export function ActivityIndicator({
  activity,
  speed,
  acceleration,
  confidence
}: ActivityIndicatorProps) {
  const config = ACTIVITY_CONFIG[activity];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: config.color }]}>
        <Text style={styles.emoji}>{config.emoji}</Text>
        <Text style={styles.activityName}>{config.name}</Text>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Velocidad:</Text>
          <Text style={styles.detailValue}>{speed.toFixed(2)} m/s</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Aceleración:</Text>
          <Text style={styles.detailValue}>{acceleration.toFixed(3)} g</Text>
        </View>
        
        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceLabel}>Confianza:</Text>
          <View style={styles.confidenceBarContainer}>
            <View 
              style={[
                styles.confidenceBar, 
                { 
                  width: `${confidence * 100}%`,
                  backgroundColor: config.color
                }
              ]} 
            />
          </View>
          <Text style={styles.confidenceValue}>{(confidence * 100).toFixed(0)}%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden'
  },
  header: {
    padding: 20,
    alignItems: 'center'
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8
  },
  activityName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white'
  },
  details: {
    padding: 16,
    gap: 12
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500'
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600'
  },
  confidenceContainer: {
    marginTop: 8
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8
  },
  confidenceBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4
  },
  confidenceBar: {
    height: '100%',
    borderRadius: 4
  },
  confidenceValue: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right'
  }
});