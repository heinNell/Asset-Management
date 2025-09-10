import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TextInput
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface VehicleItem {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  currentOdometer: number;
  fuelLevel?: number;
}

export const VehiclesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleItem[]>([]);

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    filterVehicles();
  }, [searchQuery, vehicles]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      // Load vehicles from Firebase
      // For now, using placeholder data
      const mockVehicles: VehicleItem[] = [
        {
          id: 'AFG7557',
          make: 'HONDA',
          model: 'FIT RS',
          year: 2020,
          licensePlate: 'AFG7557',
          status: 'available',
          currentOdometer: 45680,
          fuelLevel: 75
        },
        {
          id: 'AGT4894',
          make: 'TOYOTA',
          model: 'HILUX 2.4 D/CAB',
          year: 2021,
          licensePlate: 'AGT4894',
          status: 'in_use',
          currentOdometer: 32450,
          fuelLevel: 60
        },
        {
          id: 'AAX2987',
          make: 'ISUZU',
          model: 'KB250',
          year: 2019,
          licensePlate: 'AAX2987',
          status: 'maintenance',
          currentOdometer: 78900
        }
      ];
      
      setVehicles(mockVehicles);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterVehicles = () => {
    if (!searchQuery) {
      setFilteredVehicles(vehicles);
      return;
    }

    const filtered = vehicles.filter(vehicle =>
      vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.licensePlate.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setFilteredVehicles(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadVehicles();
    setRefreshing(false);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'available': return '#10B981';
      case 'in_use': return '#3B82F6';
      case 'maintenance': return '#F59E0B';
      case 'out_of_service': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const renderVehicleItem = ({ item }: { item: VehicleItem }) => (
    <TouchableOpacity
      style={styles.vehicleCard}
      activeOpacity={0.7}
      onPress={() => {
        navigation.navigate('VehicleDetail' as never, {
          vehicleId: item.id,
          userId: 'demo-user'
        } as never);
      }}
    >
      <View style={styles.vehicleHeader}>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName}>
            {item.make} {item.model} ({item.year})
          </Text>
          <Text style={styles.licensePlate}>{item.licensePlate}</Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>
            {item.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.vehicleDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="speedometer-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {item.currentOdometer.toLocaleString()} km
          </Text>
        </View>
        
        {item.fuelLevel !== undefined && (
          <View style={styles.detailItem}>
            <Ionicons name="car" size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              Fuel: {item.fuelLevel}%
            </Text>
          </View>
        )}
      </View>

      <View style={styles.vehicleActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.inspectButton]}
          onPress={() => {
            navigation.navigate('Inspection' as never, {
              vehicleId: item.id,
              driverId: 'demo-user',
              inspectionType: 'check_in'
            } as never);
          }}
        >
          <Ionicons name="clipboard-outline" size={16} color="#3B82F6" />
          <Text style={styles.actionButtonText}>Inspect</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, styles.detailsButton]}>
          <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
          <Text style={[styles.actionButtonText, styles.detailsButtonText]}>Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading vehicles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fleet Vehicles</Text>
        <Text style={styles.headerSubtitle}>Available vehicles in your fleet</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vehicles..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {filteredVehicles.length > 0 ? (
          <FlatList
            data={filteredVehicles}
            keyExtractor={(item) => item.id}
            renderItem={renderVehicleItem}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#3B82F6']}
                tintColor="#3B82F6"
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No vehicles found' : 'No vehicles available'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery 
                ? `No vehicles match "${searchQuery}"`
                : 'Contact your fleet manager to assign vehicles'
              }
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  vehicleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  licensePlate: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  vehicleDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  vehicleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  inspectButton: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  detailsButton: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
    marginLeft: 4,
  },
  detailsButtonText: {
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default VehiclesScreen;