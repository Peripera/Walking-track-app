// components/activity/SessionStatsCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SessionStats } from '../../models/ActivityModel';

interface SessionStatsCardProps {
  stats: SessionStats;
}

export function SessionStatsCard({ stats }: SessionStatsCardProps) {
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${meters.toFixed(0)} m`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Estadísticas de Sesión</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>⏱️</Text>
          <Text style={styles.statLabel}>Duración</Text>
          <Text style={styles.statValue}>{formatDuration(stats.duration)}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>📍</Text>
          <Text style={styles.statLabel}>Distancia</Text>
          <Text style={styles.statValue}>{formatDistance(stats.distance)}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>👣</Text>
          <Text style={styles.statLabel}>Pasos</Text>
          <Text style={styles.statValue}>{stats.steps}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>🔥</Text>
          <Text style={styles.statLabel}>Calorías</Text>
          <Text style={styles.statValue}>{stats.calories.toFixed(0)}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>⚡</Text>
          <Text style={styles.statLabel}>Vel. Promedio</Text>
          <Text style={styles.statValue}>{stats.averageSpeed.toFixed(2)} m/s</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>🚀</Text>
          <Text style={styles.statLabel}>Vel. Máxima</Text>
          <Text style={styles.statValue}>{stats.maxSpeed.toFixed(2)} m/s</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center'
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center'
  }
});
