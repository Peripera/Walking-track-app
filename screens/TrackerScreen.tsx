import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator as RNActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useActivityClassifier } from '../hooks/ActivityClassifier';
import { ActivityIndicator } from '../components/ActivityIndicator';
import { SessionStatsCard } from '../components/StatsCards';
import { ActivityLogList } from '../components/ActivityList';
import { LiveMapView } from '../components/LiveMapView';
import { Feather, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';


export default function TrackerScreen() {
  const {
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
  } = useActivityClassifier();

  const [showLogsModal, setShowLogsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Extraer ubicaciones de los logs para el mapa
  const mapLocations = useMemo(() => {
    return activityLogs
      .filter(log => log.location)
      .map(log => log.location);
  }, [activityLogs]);

  const handleStartStop = async () => {
    try {
      setIsLoading(true);
      
      if (isActive) {
        await stopTracking();
        Alert.alert(
          'Sesión Finalizada',
          `Distancia: ${(sessionStats.distance / 1000).toFixed(2)} km\n` +
          `Pasos: ${sessionStats.steps}\n` +
          `Calorías: ${sessionStats.calories.toFixed(0)} kcal\n\n` +
          'La ruta ha sido guardada.',
          [{ text: 'OK' }]
        );
      } else {
        if (!hasPermission) {
          Alert.alert(
            'Permisos Necesarios',
            'La aplicación necesita acceso a tu ubicación y sensores de movimiento para funcionar.'
          );
          return;
        }
        await startTracking();
      }
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Error al procesar la acción'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Walk Tracking</Text>
  
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {/* Permission Warning */}
        {!hasPermission && !isActive && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              ⚠️ Se necesitan permisos de ubicación y sensores
            </Text>
          </View>
        )}

        {/* Start/Stop Button */}
        <TouchableOpacity
          style={[
            styles.mainButton,
            isActive ? styles.stopButton : styles.startButton,
            isLoading && styles.disabledButton
          ]}
          onPress={handleStartStop}
          disabled={isLoading}
        >
          {isLoading ? (
            <RNActivityIndicator color="white" size="large" />
          ) : (
            <>
             {isActive ? (
            <Feather name="stop-circle" size={32} color="#fffbfbff" />) : (
            <Feather name="play-circle" size={32} color="#f8fff5ff" />)}

              <Text style={styles.mainButtonText}>
                {isActive ? 'DETENER' : 'INICIAR'}
              </Text>
            </>
          )}
        </TouchableOpacity>
     
        {isActive && (location || mapLocations.length > 0) && (
          <View style={styles.section}>
            <LiveMapView 
              locations={mapLocations} 
              currentLocation={location} 
            />
          </View>
        )}

  
        {isActive && location && acceleration && (
          <View style={styles.section}>
            <ActivityIndicator
              activity={currentActivity}
              speed={location.speed ?? 0}
              acceleration={acceleration.magnitude}
              confidence={confidence}
            />
          </View>
        )}

   
        {isActive && (
          <View style={styles.section}>
            <SessionStatsCard stats={sessionStats} />
          </View>
        )}

        {isActive && location && (
          <View style={styles.section}>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>📍 Última Ubicación</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Latitud:</Text>
                <Text style={styles.infoValue}>
                  {location.latitude.toFixed(6)}
                </Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Longitud:</Text>
                <Text style={styles.infoValue}>
                  {location.longitude.toFixed(6)}
                </Text>
              </View>
              {location.altitude !== null && (
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Altitud:</Text>
                  <Text style={styles.infoValue}>
                    {location.altitude?.toFixed(1)} m
                  </Text>
                </View>
              )}
              {location.accuracy !== null && (
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Precisión:</Text>
                  <Text style={styles.infoValue}>
                    ±{location.accuracy?.toFixed(1)} m
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* View Logs Button */}
        {isActive && activityLogs.length > 0 && (
          <TouchableOpacity
            style={styles.logsButton}
            onPress={() => setShowLogsModal(true)}
          >
            <View style={{ flexDirection:'row', gap:6, alignItems:'center' }}>
          <FontAwesome5 name="clipboard-list" size={18} color="#214aeeff" />
          <Text style={styles.logsButtonText}>
            Ver Logs ({activityLogs.length})
          </Text>
          </View>
          </TouchableOpacity>
        )}

        {/* Placeholder when not active */}
        {!isActive && (
          <View style={styles.placeholderContainer}>
            <MaterialCommunityIcons name="run" size={64} color="#6B7280" />

            <Text style={styles.placeholderTitle}>
              Comienza a Rastrear
            </Text>
            <Text style={styles.placeholderText}>
              Presiona "INICIAR" para comenzar un nuevo registro.
              La app utilizará GPS y acelerómetro para clasificar si estás
              quieto, caminando, corriendo o en un vehículo en movimineto.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Logs Modal */}
      <Modal
        visible={showLogsModal}
        animationType="slide"
        onRequestClose={() => setShowLogsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Registro de Actividades</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowLogsModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ActivityLogList logs={activityLogs} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32
  },
  header: {
    marginBottom: 24,
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 45,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    marginTop: 25
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center'
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
    textAlign: 'center'
  },
  warningContainer: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  warningText: {
    color: '#92400E',
    fontSize: 14,
    textAlign: 'center'
  },
  mainButton: {
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 80
  },
  startButton: {
    backgroundColor: '#10B981'
  },
  stopButton: {
    backgroundColor: '#EF4444'
  },
  disabledButton: {
    opacity: 0.6
  },
  mainButtonEmoji: {
    fontSize: 32,
    marginBottom: 8
  },
  mainButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 2
  },
  section: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12
  },
  infoContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280'
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600'
  },
  logsButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4
  },
  logsButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white'
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24
  },
  placeholderEmoji: {
    fontSize: 64,
    marginBottom: 16
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center'
  },
  placeholderText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white'
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827'
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: 'bold'
  }
});