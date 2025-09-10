
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, query, where, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import Toast from 'react-native-toast-message'

interface Vehicle {
  _id: string
  vehicleId: string
  make: string
  model: string
  year: number
  licensePlate: string
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service'
  fuelLevel: number
  currentMileage: number
  location?: {
    address: string
    latitude: number
    longitude: number
  }
  qrCode?: string
  nextServiceDate: string
  createdAt: string
  updatedAt: string
}

interface VehicleContextType {
  vehicles: Vehicle[]
  loading: boolean
  refreshVehicles: () => Promise<void>
  findVehicleByQR: (qrCode: string) => Vehicle | undefined
  updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<void>
  deleteVehicle: (id: string) => Promise<void>
  addVehicle: (vehicle: Omit<Vehicle, '_id' | 'createdAt' | 'updatedAt'>) => Promise<void>
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined)

export function VehicleProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const vehiclesQuery = query(
      collection(db, 'vehicles'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(vehiclesQuery, (snapshot) => {
      const vehicleData = snapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
      })) as Vehicle[]
      
      setVehicles(vehicleData)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching vehicles:', error)
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load vehicles'
      })
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const refreshVehicles = async () => {
    // Real-time updates handle this automatically
    return Promise.resolve()
  }

  const findVehicleByQR = (qrCode: string) => {
    return vehicles.find(vehicle => 
      vehicle.qrCode === qrCode || 
      vehicle.vehicleId === qrCode ||
      vehicle.licensePlate === qrCode
    )
  }

  const updateVehicle = async (id: string, updates: Partial<Vehicle>) => {
    try {
      const vehicleRef = doc(db, 'vehicles', id)
      await updateDoc(vehicleRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Vehicle updated successfully'
      })
    } catch (error: any) {
      console.error('Error updating vehicle:', error)
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update vehicle'
      })
      throw error
    }
  }

  const deleteVehicle = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'vehicles', id))
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Vehicle deleted successfully'
      })
    } catch (error: any) {
      console.error('Error deleting vehicle:', error)
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete vehicle'
      })
      throw error
    }
  }

  const addVehicle = async (vehicle: Omit<Vehicle, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString()
      await addDoc(collection(db, 'vehicles'), {
        ...vehicle,
        createdAt: now,
        updatedAt: now
      })
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Vehicle added successfully'
      })
    } catch (error: any) {
      console.error('Error adding vehicle:', error)
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add vehicle'
      })
      throw error
    }
  }

  const value = {
    vehicles,
    loading,
    refreshVehicles,
    findVehicleByQR,
    updateVehicle,
    deleteVehicle,
    addVehicle
  }

  return (
    <VehicleContext.Provider value={value}>
      {children}
    </VehicleContext.Provider>
  )
}

export function useVehicles() {
  const context = useContext(VehicleContext)
  if (context === undefined) {
    throw new Error('useVehicles must be used within a VehicleProvider')
  }
  return context
}
