// components/activity/ActivityLogList.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { ActivityLog, ActivityType } from '../../models/ActivityModel';

interface ActivityLogListProps {
  logs: ActivityLog[];
}

const ACTIVITY_CONFIG = {
  [ActivityType.IDLE]: { emoji: '🧍', color: '#6B7280' },
  [ActivityType.WALKING]: { emoji: '🚶', color: '#3B82F6' },
  [ActivityType.RUNNING]: { emoji: '🏃', color: '#EF4444' },
  [ActivityType.VEHICLE]: { emoji: '🚗', color: '#8B5CF6' },
  [ActivityType.UNKNOWN]: { emoji: '❓', color: '#9CA3AF' }
};

export function ActivityLogList({ logs }: ActivityLogListProps) {
  const renderItem = ({ item, index }: { item: ActivityLog; index: number }) => {
    const config = ACTIVITY_CONFIG[item.activity];
    const time = new Date(item.timestamp).toLocaleTimeString();

    return (
      <View style={styles.logItem}>
        <View style={styles.logHeader}>
          <View style={styles.logNumber}>
            <Text style={styles.logNumberText}>#{logs.length - index}</Text>
          </View>
          <Text style={styles.logEmoji}>{config.emoji}</Text>
          <Text style={[styles.logActivity, { color: config.color }]}>
            {item.activity}
          </Text>
          <Text style={styles.logTime}>{time}</Text>
        </View>
        
        <View style={styles.logDetails}>
          <View style={styles.logDetailItem}>
            <Text style={styles.logDetailLabel}>📍 Ubicación:</Text>
            <Text style={styles.logDetailValue}>
              {item.location.latitude.toFixed(6)}, {item.location.longitude.toFixed(6)}
            </Text>
          </View>
          
          <View style={styles.logDetailItem}>
            <Text style={styles.logDetailLabel}>⚡ Velocidad:</Text>
            <Text style={styles.logDetailValue}>{item.speed.toFixed(2)} m/s</Text>
          </View>
          
          <View style={styles.logDetailItem}>
            <Text style={styles.logDetailLabel}>📊 Aceleración:</Text>
            <Text style={styles.logDetailValue}>{item.acceleration.magnitude.toFixed(3)} g</Text>
          </View>
          
          <View style={styles.logDetailItem}>
            <Text style={styles.logDetailLabel}>✅ Confianza:</Text>
            <Text style={styles.logDetailValue}>{(item.confidence * 100).toFixed(0)}%</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📝 Registro de Actividades ({logs.length})</Text>
      <FlatList
        data={[...logs].reverse()} // Mostrar más recientes primero
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay logs registrados aún</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  listContent: {
    padding: 16,
    gap: 12
  },
  logItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6'
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8
  },
  logNumber: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  logNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280'
  },
  logEmoji: {
    fontSize: 20
  },
  logActivity: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1
  },
  logTime: {
    fontSize: 12,
    color: '#6B7280'
  },
  logDetails: {
    gap: 6
  },
  logDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logDetailLabel: {
    fontSize: 12,
    color: '#6B7280'
  },
  logDetailValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500'
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center'
  }
});
