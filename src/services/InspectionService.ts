import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { VehicleInspection, DamageReport, InspectionPhoto } from '../types/models';

export interface InspectionData {
  vehicleId: string;
  driverId: string;
  type: 'check_in' | 'check_out' | 'periodic' | 'incident' | 'maintenance';
  location?: {
    coordinates: [number, number];
    address: string;
    accuracy: number;
  };
  odometer: {
    reading: number;
    photo?: string;
    isValid: boolean;
    validationErrors?: string[];
  };
  fuelLevel: {
    percentage: number;
    photo: string;
    visualGaugeReading: number;
    refueled: boolean;
    refuelAmount?: number;
    refuelCost?: number;
    refuelReceipt?: string;
  };
  damages: DamageReport[];
  checklistItems: Array<{
    item: string;
    status: 'pass' | 'fail' | 'needs_attention';
    notes?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  }>;
  voiceNotes: Array<{
    audioFile: string;
    duration: number;
    quality: 'low' | 'medium' | 'high';
  }>;
  plannedTrip?: {
    purpose: string;
    destination: string;
    waypoints: string[];
    estimatedDistance: number;
    estimatedDuration: number;
    passengers: number;
    cargoDetails?: string;
  };
}

export interface InspectionSubmissionResult {
  success: boolean;
  inspectionId?: string;
  error?: string;
}

/**
 * Submit a new vehicle inspection
 */
export const submitInspection = async (inspectionData: InspectionData): Promise<InspectionSubmissionResult> => {
  try {
    // Validate required fields
    if (!inspectionData.vehicleId || !inspectionData.driverId) {
      return {
        success: false,
        error: 'Vehicle ID and Driver ID are required'
      };
    }

    // Get current location (simplified - in production you'd use actual geolocation)
    const defaultLocation = {
      coordinates: [-17.8216, 31.0492] as [number, number], // Harare, Zimbabwe
      address: 'Current Location',
      accuracy: 10
    };

    // Construct the inspection document
    const inspectionDoc: Omit<VehicleInspection, 'id'> = {
      vehicleId: inspectionData.vehicleId,
      driverId: inspectionData.driverId,
      type: inspectionData.type,
      timestamp: new Date(),
      location: inspectionData.location || defaultLocation,
      weather: {
        condition: 'Unknown',
        temperature: 22,
        humidity: 60,
        windSpeed: 5,
        source: 'default'
      },
      odometer: {
        reading: inspectionData.odometer.reading,
        photo: inspectionData.odometer.photo || '',
        isValid: inspectionData.odometer.isValid,
        validationErrors: inspectionData.odometer.validationErrors || []
      },
      fuelLevel: {
        percentage: inspectionData.fuelLevel.percentage,
        estimatedLiters: Math.round((inspectionData.fuelLevel.percentage / 100) * 60), // Assuming 60L tank
        photo: inspectionData.fuelLevel.photo,
        visualGaugeReading: inspectionData.fuelLevel.visualGaugeReading,
        refueled: inspectionData.fuelLevel.refueled,
        refuelAmount: inspectionData.fuelLevel.refuelAmount,
        refuelCost: inspectionData.fuelLevel.refuelCost,
        refuelReceipt: inspectionData.fuelLevel.refuelReceipt
      },
      damageInspection: {
        overallCondition: determinOverallCondition(inspectionData.damages, inspectionData.checklistItems),
        damages: inspectionData.damages,
        photos: [], // Photos are embedded in damage reports
        completedChecklist: inspectionData.checklistItems
      },
      voiceNotes: inspectionData.voiceNotes.map((note, index) => ({
        id: `voice_${Date.now()}_${index}`,
        audioFile: note.audioFile,
        duration: note.duration,
        transcript: '', // Will be populated by transcription service
        summary: '',
        category: 'general',
        nlpTags: [],
        confidence: 0
      })),
      plannedTrip: inspectionData.plannedTrip,
      status: 'completed',
      submittedAt: new Date()
    };

    // Add document to Firestore
    const docRef = await addDoc(collection(db, 'inspections'), {
      ...inspectionDoc,
      timestamp: serverTimestamp(),
      submittedAt: serverTimestamp()
    });

    return {
      success: true,
      inspectionId: docRef.id
    };

  } catch (error) {
    console.error('Error submitting inspection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit inspection'
    };
  }
};

/**
 * Get vehicle inspections for a specific vehicle
 */
export const getVehicleInspections = async (vehicleId: string, limit: number = 10): Promise<VehicleInspection[]> => {
  try {
    const inspectionsRef = collection(db, 'inspections');
    const q = query(
      inspectionsRef,
      where('vehicleId', '==', vehicleId),
      orderBy('timestamp', 'desc'),
      // Note: Firestore limit would be applied here in a real implementation
    );

    const querySnapshot = await getDocs(q);
    const inspections: VehicleInspection[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      inspections.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
        submittedAt: data.submittedAt?.toDate() || new Date(),
        reviewedAt: data.reviewedAt?.toDate()
      } as VehicleInspection);
    });

    return inspections.slice(0, limit);
  } catch (error) {
    console.error('Error getting vehicle inspections:', error);
    return [];
  }
};

/**
 * Get user's recent inspections
 */
export const getUserInspections = async (driverId: string, limit: number = 10): Promise<VehicleInspection[]> => {
  try {
    const inspectionsRef = collection(db, 'inspections');
    const q = query(
      inspectionsRef,
      where('driverId', '==', driverId),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const inspections: VehicleInspection[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      inspections.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
        submittedAt: data.submittedAt?.toDate() || new Date(),
        reviewedAt: data.reviewedAt?.toDate()
      } as VehicleInspection);
    });

    return inspections.slice(0, limit);
  } catch (error) {
    console.error('Error getting user inspections:', error);
    return [];
  }
};

/**
 * Update inspection status
 */
export const updateInspectionStatus = async (
  inspectionId: string, 
  status: VehicleInspection['status'],
  reviewNotes?: string
): Promise<boolean> => {
  try {
    const inspectionRef = doc(db, 'inspections', inspectionId);
    const updateData: any = {
      status,
      updatedAt: serverTimestamp()
    };

    if (reviewNotes) {
      updateData.reviewNotes = reviewNotes;
      updateData.reviewedAt = serverTimestamp();
    }

    await updateDoc(inspectionRef, updateData);
    return true;
  } catch (error) {
    console.error('Error updating inspection status:', error);
    return false;
  }
};

/**
 * Validate odometer reading against previous reading
 */
export const validateOdometerReading = async (
  vehicleId: string,
  newReading: number
): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> => {
  try {
    // Get vehicle's current odometer reading
    const vehicleDoc = await getDoc(doc(db, 'vehicles', vehicleId));
    
    if (!vehicleDoc.exists()) {
      return {
        isValid: false,
        errors: ['Vehicle not found'],
        warnings: []
      };
    }

    const vehicleData = vehicleDoc.data();
    const currentOdometer = vehicleData.currentOdometer || 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if new reading is lower than current (invalid)
    if (newReading < currentOdometer) {
      errors.push(`Reading cannot be lower than current reading (${currentOdometer} km)`);
    }

    // Check for unusually high increase (warning)
    const difference = newReading - currentOdometer;
    if (difference > 1000) {
      warnings.push(`Unusually high mileage increase detected (${difference} km)`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  } catch (error) {
    console.error('Error validating odometer reading:', error);
    return {
      isValid: false,
      errors: ['Failed to validate odometer reading'],
      warnings: []
    };
  }
};

/**
 * Helper function to determine overall vehicle condition
 */
function determinOverallCondition(
  damages: DamageReport[], 
  checklistItems: Array<{ status: 'pass' | 'fail' | 'needs_attention'; severity?: string }>
): 'excellent' | 'good' | 'fair' | 'poor' | 'damaged' {
  // Check for critical damages
  const hasCriticalDamage = damages.some(damage => damage.severity === 'critical');
  if (hasCriticalDamage) return 'damaged';

  // Check for major damages
  const hasMajorDamage = damages.some(damage => damage.severity === 'major');
  if (hasMajorDamage) return 'poor';

  // Check checklist failures
  const failedItems = checklistItems.filter(item => item.status === 'fail');
  const criticalFailures = failedItems.filter(item => item.severity === 'critical');
  
  if (criticalFailures.length > 0) return 'poor';
  if (failedItems.length > 3) return 'fair';

  // Check for moderate damages
  const hasModerateNeedsAttention = damages.some(damage => damage.severity === 'moderate') ||
                                   checklistItems.some(item => item.status === 'needs_attention');
  
  if (hasModerateNeedsAttention) return 'fair';
  
  // Check for minor issues
  const hasMinorIssues = damages.some(damage => damage.severity === 'minor') ||
                         failedItems.length > 0;
  
  if (hasMinorIssues) return 'good';
  
  return 'excellent';
}

/**
 * Create a damage report
 */
export const createDamageReport = (
  component: DamageReport['component'],
  hasDamage: boolean,
  severity?: DamageReport['severity'],
  description?: string,
  photos?: string[]
): DamageReport => {
  return {
    id: `damage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    component,
    hasDamage,
    severity,
    description: description || '',
    photos: photos || [],
    annotations: [],
    estimatedCost: 0,
    repairRequired: hasDamage && (severity === 'major' || severity === 'critical'),
    reportedAt: new Date()
  };
};