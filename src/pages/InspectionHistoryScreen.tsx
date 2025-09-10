import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface InspectionRecord {
  id: string;
  vehicleId: string;
  type: 'check_in' | 'check_out' | 'periodic';
  timestamp: Date;
  status: 'completed' | 'in_progress' | 'requires_attention';
  overallCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
}

export const InspectionHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);

  useEffect(() => {
    loadInspectionHistory();
  }, []);

  const loadInspectionHistory = async () => {
    setLoading(true);
    try {
      // Load inspection history from Firebase
      // For now, using placeholder data
      const mockInspections: InspectionRecord[] = [
        {
          id: '1',
          vehicleId: 'AFG7557',
          type: 'check_in',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          status: 'completed',
          overallCondition: 'good'
        },
        {
          id: '2',
          vehicleId: 'AFG7557',
          type: 'check_out',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          status: 'completed',
          overallCondition: 'excellent'
        }
      ];
      
      setInspections(mockInspections);
    } catch (error) {
      console.error('Error loading inspection history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInspectionHistory();
    setRefreshing(false);
  };

  const getConditionColor = (condition: string): string => {
    switch (condition) {
      case 'excellent': return '#10B981';
      case 'good': return '#3B82F6';
      case 'fair': return '#F59E0B';
      case 'poor': return '#EF4444';
      case 'damaged': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#F59E0B';
      case 'requires_attention': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const renderInspectionItem = ({ item }: { item: InspectionRecord }) => (
    <TouchableOpacity
      style={styles.inspectionCard}
      activeOpacity={0.7}
      onPress={() => {
        // Navigate to inspection details
        console.log('View inspection:', item.id);
      }}
    >
      <View style={styles.inspectionHeader}>
        <View style={styles.inspectionType}>
          <Ionicons 
            name={item.type === 'check_in' ? 'log-in' : item.type === 'check_out' ? 'log-out' : 'clipboard'} 
            size={20} 
            color="#3B82F6" 
          />
          <Text style={styles.inspectionTypeText}>
            {item.type.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>
            {item.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.inspectionDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Vehicle:</Text>
          <Text style={styles.detailValue}>{item.vehicleId}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>{formatDate(item.timestamp)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Condition:</Text>
          <View style={styles.conditionContainer}>
            <View style={[styles.conditionDot, { backgroundColor: getConditionColor(item.overallCondition) }]} />
            <Text style={[styles.conditionText, { color: getConditionColor(item.overallCondition) }]}>
              {item.overallCondition.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.inspectionFooter}>
        <Ionicons name="chevron-forward" size={16} color="#6B7280" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading inspection history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inspection History</Text>
        <Text style={styles.headerSubtitle}>Your recent vehicle inspections</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {inspections.length > 0 ? (
          <FlatList
            data={inspections}
            keyExtractor={(item) => item.id}
            renderItem={renderInspectionItem}
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
            <Ionicons name="clipboard-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>No inspections yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Complete your first vehicle inspection to see history here
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
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  inspectionCard: {
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
  inspectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inspectionType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inspectionTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  inspectionDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  conditionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conditionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inspectionFooter: {
    alignItems: 'flex-end',
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

export default InspectionHistoryScreen;