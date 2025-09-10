import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Animated,
  Easing,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useNavigation } from '@react-navigation/native';

// Import services
import { useAuthService } from '../services/AuthService';

interface BarcodeLoginScreenProps {
  navigation?: any;
}

export const BarcodeLoginScreen: React.FC<BarcodeLoginScreenProps> = () => {
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const { loginWithBarcode, loading } = useAuthService();
  
  // Animation values
  const scanAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(0)).current;
  const fadeInAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();

    // Start animations
    Animated.timing(fadeInAnimation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    startScanAnimation();
    startPulseAnimation();
  }, []);

  const startScanAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnimation, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1500,
          easing: Easing.bezier(0.4, 0.0, 0.6, 1.0),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 1500,
          easing: Easing.bezier(0.4, 0.0, 0.6, 1.0),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleBarCodeScanned = async ({ type, data }: any) => {
    if (scanned || scanning) return;
    
    setScanned(true);
    setScanning(true);

    try {
      // Validate barcode format
      if (!isValidVehicleBarcode(data)) {
        Alert.alert(
          'Invalid Barcode',
          'Please scan a valid vehicle barcode.',
          [{ text: 'OK', onPress: () => resetScanner() }]
        );
        return;
      }

      // Extract vehicle information from barcode
      const vehicleInfo = parseVehicleBarcode(data);
      
      // Attempt login with barcode
      const result = await loginWithBarcode(vehicleInfo.vehicleId, vehicleInfo.checksum);
      
      if (result.success) {
        // Navigate to main app with user context
        navigation.navigate('MainTabs' as never, {
          user: result.user,
          profile: result.profile,
          vehicleId: vehicleInfo.vehicleId
        } as never);
      } else if (result.requiresApproval) {
        Alert.alert(
          'Approval Required',
          'Your registration is incomplete or pending approval. Please ensure all required documents are submitted and verified.',
          [
            { text: 'Contact Admin', onPress: () => navigation.navigate('ContactSupport' as never) },
            { text: 'OK', onPress: () => resetScanner() }
          ]
        );
      } else {
        Alert.alert(
          'Login Failed',
          result.error || 'Unable to authenticate. Please ensure you are registered and approved for vehicle access.',
          [{ text: 'OK', onPress: () => resetScanner() }]
        );
      }
    } catch (error) {
      console.error('Barcode scan error:', error);
      Alert.alert(
        'Error',
        'An error occurred during login. Please check your connection and try again.',
        [{ text: 'OK', onPress: () => resetScanner() }]
      );
    } finally {
      setScanning(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setScanning(false);
  };

  const isValidVehicleBarcode = (data: string): boolean => {
    // Vehicle barcode format: VMS-{vehicleId}-{timestamp}-{checksum}
    const pattern = /^VMS-[A-Z0-9]{6,}-\d{10}-[A-F0-9]{8}$/;
    return pattern.test(data);
  };

  const parseVehicleBarcode = (data: string) => {
    const parts = data.split('-');
    return {
      prefix: parts[0], // VMS
      vehicleId: parts[1],
      timestamp: parseInt(parts[2]),
      checksum: parts[3]
    };
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.permissionText}>Requesting camera permissions...</Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#1E3A8A', '#3B82F6', '#60A5FA']}
          style={styles.permissionContainer}
        >
          <Ionicons name="camera-outline" size={80} color="#FFFFFF" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionDescription}>
            To scan vehicle barcodes and access the system, we need permission to use your camera.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={async () => {
              const { status } = await BarCodeScanner.requestPermissionsAsync();
              setHasPermission(status === 'granted');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
            <Ionicons name="arrow-forward" size={20} color="#1E3A8A" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const screenData = Dimensions.get('window');
  const scanLinePosition = scanAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, screenData.height * 0.3],
  });

  const pulseScale = pulseAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const pulseOpacity = pulseAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0.8],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeInAnimation }]}>
        <LinearGradient
          colors={['#1E3A8A', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Ionicons name="car-sport" size={32} color="#FFFFFF" />
              <Text style={styles.headerTitle}>Fleet Manager</Text>
            </View>
            <Text style={styles.headerSubtitle}>Scan Vehicle Barcode</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={styles.camera}
        >
          {/* Scanning Overlay */}
          <View style={styles.overlay}>
            
            {/* Top Overlay */}
            <View style={styles.overlayTop} />
            
            {/* Middle Section with Scan Area */}
            <View style={styles.overlayMiddle}>
              <View style={styles.overlaySide} />
              
              {/* Scan Area */}
              <View style={styles.scanArea}>
                {/* Corner Guides */}
                <View style={[styles.cornerGuide, styles.topLeft]} />
                <View style={[styles.cornerGuide, styles.topRight]} />
                <View style={[styles.cornerGuide, styles.bottomLeft]} />
                <View style={[styles.cornerGuide, styles.bottomRight]} />
                
                {/* Animated Scan Line */}
                {!scanned && !scanning && (
                  <Animated.View
                    style={[
                      styles.scanLine,
                      {
                        transform: [{ translateY: scanLinePosition }],
                      },
                    ]}
                  />
                )}
                
                {/* Scanning Indicator */}
                {scanning && (
                  <Animated.View
                    style={[
                      styles.scanningIndicator,
                      {
                        transform: [{ scale: pulseScale }],
                        opacity: pulseOpacity,
                      },
                    ]}
                  >
                    <Ionicons name="checkmark-circle" size={60} color="#10B981" />
                  </Animated.View>
                )}
              </View>
              
              <View style={styles.overlaySide} />
            </View>
            
            {/* Bottom Overlay */}
            <View style={styles.overlayBottom} />
          </View>
        </BarCodeScanner>
      </View>

      {/* Instructions */}
      <Animated.View style={[styles.instructionsContainer, { opacity: fadeInAnimation }]}>
        <View style={styles.instructions}>
          <Ionicons 
            name="qr-code-outline" 
            size={48} 
            color="#3B82F6" 
            style={styles.instructionIcon}
          />
          <Text style={styles.instructionTitle}>
            {scanning ? 'Authenticating...' : scanned ? 'Processing...' : 'Position Barcode'}
          </Text>
          <Text style={styles.instructionText}>
            {scanning 
              ? 'Verifying your access credentials'
              : scanned 
                ? 'Please wait while we process your request'
                : 'Align the vehicle barcode within the frame above'
            }
          </Text>
          
          {/* Security Note */}
          <View style={styles.securityNote}>
            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
            <Text style={styles.securityText}>Secure Authentication</Text>
          </View>
        </View>
      </Animated.View>

      {/* Manual Entry Button */}
      {!scanning && (
        <Animated.View style={[styles.manualEntryContainer, { opacity: fadeInAnimation }]}>
          <TouchableOpacity
            style={styles.manualEntryButton}
            onPress={() => navigation.navigate('ManualLogin' as never)}
            activeOpacity={0.7}
          >
            <Text style={styles.manualEntryText}>Manual Entry</Text>
            <Ionicons name="keypad-outline" size={16} color="#6B7280" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  permissionText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#6B7280',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: 16,
    color: '#E5E7EB',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  header: {
    height: 120,
  },
  headerGradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E5E7EB',
    marginLeft: 44,
  },
  cameraContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: 200,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  scanArea: {
    width: 250,
    height: 200,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerGuide: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#3B82F6',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  scanningIndicator: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  instructions: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  instructionIcon: {
    marginBottom: 16,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  securityText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '500',
    marginLeft: 4,
  },
  manualEntryContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  manualEntryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  manualEntryText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginRight: 8,
  },
});

export default BarcodeLoginScreen;