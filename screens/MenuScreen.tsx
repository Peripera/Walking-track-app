import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import type { SavedRoute } from '../models/ActivityModel';
import RouteService from '../services/Routeservice';
import { Feather, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';


export default function RoutesScreen() {
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<SavedRoute | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadRoutes = async () => {
    try {
      const loadedRoutes = await RouteService.getRoutes();
      // Ordenar por fecha (más recientes primero)
      const sortedRoutes = loadedRoutes.sort((a, b) => b.date - a.date);
      setRoutes(sortedRoutes);
    } catch (error) {
      console.error('Error cargando rutas:', error);
      Alert.alert('Error', 'No se pudieron cargar las rutas guardadas');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRoutes();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRoutes();
    setRefreshing(false);
  };

  const handleDeleteRoute = (route: SavedRoute) => {
    Alert.alert(
      'Eliminar Ruta',
      `¿Estás seguro de que deseas eliminar "${route.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await RouteService.deleteRoute(route.id);
              await loadRoutes();
              Alert.alert('Éxito', 'Ruta eliminada correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la ruta');
            }
          }
        }
      ]
    );
  };

  const handleViewMap = (route: SavedRoute) => {
    setSelectedRoute(route);
    setShowMapModal(true);
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  };

  const renderRouteItem = ({ item }: { item: SavedRoute }) => (
    <View style={styles.routeCard}>
      <View style={styles.routeHeader}>
        <Text style={styles.routeName}>{item.name}</Text>
        <Text style={styles.routeDate}>{formatDate(item.date)}</Text>
      </View>

      <View style={styles.routeStats}>
        <View style={styles.statItem}>
          
          <Feather name="map" size={20} color="#111827" />
          <Text style={styles.statValue}>
            {(item.stats.distance / 1000).toFixed(2)} km
          </Text>
        </View>

        <View style={styles.statItem}>
          <FontAwesome5 name="clock" size={20} color="#111827" />
          <Text style={styles.statLabel}>Duración</Text>
          <Text style={styles.statValue}>
            {formatDuration(item.stats.duration)}
          </Text>
        </View>

        <View style={styles.statItem}>
          <MaterialCommunityIcons name="walk" size={20} color="#34ea44ff" />
          <Text style={styles.statLabel}>Pasos</Text>
          <Text style={styles.statValue}>{item.stats.steps}</Text>
        </View>

        <View style={styles.statItem}>
          <MaterialCommunityIcons name="fire" size={20} color="#f17a03ff" />
          <Text style={styles.statLabel}>Calorías</Text>
          <Text style={styles.statValue}>
            {item.stats.calories.toFixed(0)}
          </Text>
        </View>
      </View>

      <View style={styles.routeActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => handleViewMap(item)}
        >
          <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
          <Feather name="map" size={18} color="#74bfddff" />
        <Text style={styles.actionButtonText}>Ver Mapa</Text>
        </View>

        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteRoute(item)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="trash-2" size={18} color="black" />
          <Text style={styles.actionButtonText}>Eliminar</Text>
          </View>

        </TouchableOpacity>
      </View>

      <View style={styles.routePoints}>
        <Text style={styles.routePointsText}>
          {item.logs.length} puntos registrados
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Feather name="folder" size={26} color="#111827" />
        <Text style={styles.headerTitle}>Rutas Guardadas</Text>
        </View>

        <Text style={styles.headerSubtitle}>
          {routes.length} {routes.length === 1 ? 'ruta' : 'rutas'}
        </Text>
      </View>

      <FlatList
        data={routes}
        renderItem={renderRouteItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📍</Text>
            <Text style={styles.emptyTitle}>No hay rutas guardadas</Text>
            <Text style={styles.emptyText}>
              Consulta aquí tu historial de rutas.
            </Text>
          </View>
        }
      />

      {/* Map Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        onRequestClose={() => {
          setShowMapModal(false);
          setSelectedRoute(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedRoute?.name || 'Mapa'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowMapModal(false);
                setSelectedRoute(null);
              }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {selectedRoute && (
            <WebView 
              originWhitelist={['*']}
              source={{
                html: RouteService.generateMapHTML(selectedRoute)
              }}
              style={styles.webview}
            />
          )}
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
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280'
  },
  listContent: {
    padding: 16,
    paddingBottom: 32
  },
  routeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  routeHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4
  },
  routeDate: {
    fontSize: 14,
    color: '#6B7280'
  },
  routeStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16
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
    fontSize: 20,
    marginBottom: 4
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827'
  },
  routeActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  viewButton: {
    backgroundColor: '#3B82F6'
  },
  deleteButton: {
    backgroundColor: '#EF4444'
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white'
  },
  routePoints: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6'
  },
  routePointsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center'
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center'
  },
  emptyText: {
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1
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
  },
  webview: {
    flex: 1
  }
});
