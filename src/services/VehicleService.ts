import { 
    doc, 
    getDoc, 
    collection, 
    query, 
    where, 
    orderBy, 
    limit, 
    getDocs,
    Timestamp 
  } from 'firebase/firestore';
  import { db } from '../config/firebase';
  import { Vehicle, Trip, ServiceRecord, User, TelemetryEvent } from '../types/models';
  
  export interface VehicleHistoryData {
    vehicle: Vehicle;
    lastServiceRecord?: ServiceRecord;
    recentTrips: Trip[];
    previousDriver?: User;
    currentLocation?: [number, number];
    totalTrips: number;
    totalDistance: number;
    averageFuelEfficiency: number;
  }
  
  export interface TripWithDriver extends Trip {
    driverName: string;
    driverEmail: string;
  }
  
  /**
   * Get comprehensive vehicle data including history
   */
  export const getVehicleHistory = async (vehicleId: string): Promise<VehicleHistoryData | null> => {
    try {
      // Get vehicle basic information
      const vehicleDoc = await getDoc(doc(db, 'vehicles', vehicleId));
      
      if (!vehicleDoc.exists()) {
        console.error('Vehicle not found:', vehicleId);
        return null;
      }
  
      const vehicle = { id: vehicleDoc.id, ...vehicleDoc.data() } as Vehicle;
  
      // Get service records
      const serviceRecords = await getServiceRecords(vehicleId, 1);
      const lastServiceRecord = serviceRecords.length > 0 ? serviceRecords[0] : undefined;
  
      // Get recent trips
      const trips = await getRecentTrips(vehicleId, 10);
  
      // Get previous driver from most recent completed trip
      let previousDriver: User | undefined;
      if (trips.length > 0) {
        const lastTrip = trips[0];
        if (lastTrip.driverId) {
          previousDriver = await getDriverInfo(lastTrip.driverId);
        }
      }
  
      // Get current location from latest telemetry
      const currentLocation = await getCurrentLocation(vehicleId);
  
      // Calculate statistics
      const totalTrips = trips.length;
      const totalDistance = trips.reduce((sum, trip) => sum + (trip.route?.totalDistance || 0), 0);
      const totalFuelConsumed = trips.reduce((sum, trip) => sum + (trip.fuel?.consumedLiters || 0), 0);
      const averageFuelEfficiency = totalFuelConsumed > 0 ? totalDistance / totalFuelConsumed : 0;
  
      return {
        vehicle,
        lastServiceRecord,
        recentTrips: trips,
        previousDriver,
        currentLocation,
        totalTrips,
        totalDistance,
        averageFuelEfficiency
      };
  
    } catch (error) {
      console.error('Error fetching vehicle history:', error);
      return null;
    }
  };
  
  /**
   * Get service records for a vehicle
   */
  export const getServiceRecords = async (vehicleId: string, limitCount: number = 25): Promise<ServiceRecord[]> => {
    try {
      const serviceRecordsRef = collection(db, 'serviceRecords');
      const q = query(
        serviceRecordsRef,
        where('vehicleId', '==', vehicleId),
        orderBy('serviceDate', 'desc'),
        limit(limitCount)
      );
  
      const querySnapshot = await getDocs(q);
      const serviceRecords: ServiceRecord[] = [];
  
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        serviceRecords.push({
          id: doc.id,
          ...data,
          serviceDate: data.serviceDate?.toDate ? data.serviceDate.toDate() : new Date(data.serviceDate)
        } as ServiceRecord);
      });
  
      return serviceRecords;
    } catch (error) {
      console.error('Error fetching service records:', error);
      return [];
    }
  };
  
  /**
   * Get recent trips for a vehicle
   */
  export const getRecentTrips = async (vehicleId: string, limitCount: number = 10): Promise<Trip[]> => {
    try {
      const tripsRef = collection(db, 'trips');
      const q = query(
        tripsRef,
        where('vehicleId', '==', vehicleId),
        orderBy('startTime', 'desc'),
        limit(limitCount)
      );
  
      const querySnapshot = await getDocs(q);
      const trips: Trip[] = [];
  
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        trips.push({
          id: doc.id,
          ...data,
          startTime: data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime),
          endTime: data.endTime?.toDate ? data.endTime.toDate() : data.endTime ? new Date(data.endTime) : undefined,
          scheduledReturn: data.scheduledReturn?.toDate ? data.scheduledReturn.toDate() : new Date(data.scheduledReturn),
          actualReturn: data.actualReturn?.toDate ? data.actualReturn.toDate() : data.actualReturn ? new Date(data.actualReturn) : undefined
        } as Trip);
      });
  
      return trips;
    } catch (error) {
      console.error('Error fetching recent trips:', error);
      return [];
    }
  };
  
  /**
   * Get trips with driver information
   */
  export const getTripsWithDrivers = async (vehicleId: string, limitCount: number = 10): Promise<TripWithDriver[]> => {
    try {
      const trips = await getRecentTrips(vehicleId, limitCount);
      const tripsWithDrivers: TripWithDriver[] = [];
  
      for (const trip of trips) {
        const driver = await getDriverInfo(trip.driverId);
        tripsWithDrivers.push({
          ...trip,
          driverName: driver?.displayName || 'Unknown Driver',
          driverEmail: driver?.email || ''
        });
      }
  
      return tripsWithDrivers;
    } catch (error) {
      console.error('Error fetching trips with drivers:', error);
      return [];
    }
  };
  
  /**
   * Get driver information
   */
  export const getDriverInfo = async (driverId: string): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', driverId));
      
      if (!userDoc.exists()) {
        return null;
      }
  
      return {
        uid: userDoc.id,
        ...userDoc.data(),
        createdAt: userDoc.data().createdAt?.toDate ? userDoc.data().createdAt.toDate() : new Date(userDoc.data().createdAt),
        updatedAt: userDoc.data().updatedAt?.toDate ? userDoc.data().updatedAt.toDate() : new Date(userDoc.data().updatedAt),
        lastLoginAt: userDoc.data().lastLoginAt?.toDate ? userDoc.data().lastLoginAt.toDate() : userDoc.data().lastLoginAt ? new Date(userDoc.data().lastLoginAt) : undefined,
        approvedAt: userDoc.data().approvedAt?.toDate ? userDoc.data().approvedAt.toDate() : userDoc.data().approvedAt ? new Date(userDoc.data().approvedAt) : undefined
      } as User;
    } catch (error) {
      console.error('Error fetching driver info:', error);
      return null;
    }
  };
  
  /**
   * Get current vehicle location from latest telemetry
   */
  export const getCurrentLocation = async (vehicleId: string): Promise<[number, number] | undefined> => {
    try {
      const telemetryRef = collection(db, 'telemetryEvents');
      const q = query(
        telemetryRef,
        where('vehicleId', '==', vehicleId),
        where('eventType', '==', 'location'),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
  
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const latestEvent = querySnapshot.docs[0].data() as TelemetryEvent;
        return latestEvent.location;
      }
  
      return undefined;
    } catch (error) {
      console.error('Error fetching current location:', error);
      return undefined;
    }
  };
  
  /**
   * Get route points for a specific trip
   */
  export const getTripRoute = async (tripId: string): Promise<Array<{ coordinates: [number, number]; timestamp: Date }>> => {
    try {
      const tripDoc = await getDoc(doc(db, 'trips', tripId));
      
      if (!tripDoc.exists()) {
        return [];
      }
  
      const trip = tripDoc.data() as Trip;
      const actualRoute = trip.route?.actualRoute || [];
      
      return actualRoute.map(point => ({
        coordinates: point.coordinates,
        timestamp: point.timestamp instanceof Timestamp ? point.timestamp.toDate() : new Date(point.timestamp)
      }));
    } catch (error) {
      console.error('Error fetching trip route:', error);
      return [];
    }
  };
  
  /**
   * Get vehicle maintenance alerts
   */
  export const getVehicleAlerts = async (vehicleId: string): Promise<Array<{
    id: string;
    type: string;
    priority: string;
    title: string;
    description: string;
    dueDate: Date;
  }>> => {
    try {
      const alertsRef = collection(db, 'maintenanceAlerts');
      const q = query(
        alertsRef,
        where('vehicleId', '==', vehicleId),
        where('status', '==', 'active'),
        orderBy('priority', 'desc')
      );
  
      const querySnapshot = await getDocs(q);
      const alerts: any[] = [];
  
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        alerts.push({
          id: doc.id,
          type: data.type,
          priority: data.priority,
          title: data.title,
          description: data.description,
          dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : new Date(data.dueDate)
        });
      });
  
      return alerts;
    } catch (error) {
      console.error('Error fetching vehicle alerts:', error);
      return [];
    }
  };
  
  /**
   * Calculate next service date based on odometer and service interval
   */
  export const getNextServiceInfo = (vehicle: Vehicle): {
    kmUntilService: number;
    isOverdue: boolean;
    daysUntilService?: number;
  } => {
    const kmUntilService = vehicle.nextServiceOdometer - vehicle.currentOdometer;
    const isOverdue = kmUntilService <= 0;
    
    // Estimate days until service based on average daily usage (rough estimate)
    const avgDailyKm = 50; // Rough estimate - could be calculated from historical data
    const daysUntilService = isOverdue ? 0 : Math.ceil(kmUntilService / avgDailyKm);
    
    return {
      kmUntilService,
      isOverdue,
      daysUntilService
    };
  };