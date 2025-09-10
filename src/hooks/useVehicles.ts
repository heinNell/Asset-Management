
import { useState, useEffect } from 'react'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'

interface Vehicle {
  _id: string
  vehicleId: string
  make: string
  model: string
  year: number
  licensePlate: string
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service'
  currentMileage: number
  fuelLevel: number
  lastServiceDate: string
  nextServiceDate: string
  currentDriverId?: string
  location?: {
    latitude: number
    longitude: number
    address: string
  }
}

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)

  const fetchVehicles = async () => {
    setLoading(true)
    try {
      const response = await lumi.entities.vehicles.list({
        sort: { createdAt: -1 }
      })
      setVehicles(response.list || [])
    } catch (error: any) {
      console.error('Failed to fetch vehicles:', error)
      toast.error('Failed to load vehicles')
    } finally {
      setLoading(false)
    }
  }

  const createVehicle = async (vehicleData: Omit<Vehicle, '_id'>) => {
    try {
      const newVehicle = await lumi.entities.vehicles.create({
        ...vehicleData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        creator: 'admin'
      })
      setVehicles(prev => [newVehicle, ...prev])
      toast.success('Vehicle created successfully')
      return newVehicle
    } catch (error: any) {
      console.error('Failed to create vehicle:', error)
      toast.error('Failed to create vehicle')
      throw error
    }
  }

  const updateVehicle = async (vehicleId: string, updates: Partial<Vehicle>) => {
    try {
      const updatedVehicle = await lumi.entities.vehicles.update(vehicleId, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
      setVehicles(prev => prev.map(v => v._id === vehicleId ? updatedVehicle : v))
      toast.success('Vehicle updated successfully')
      return updatedVehicle
    } catch (error: any) {
      console.error('Failed to update vehicle:', error)
      toast.error('Failed to update vehicle')
      throw error
    }
  }

  const deleteVehicle = async (vehicleId: string) => {
    try {
      await lumi.entities.vehicles.delete(vehicleId)
      setVehicles(prev => prev.filter(v => v._id !== vehicleId))
      toast.success('Vehicle deleted successfully')
    } catch (error: any) {
      console.error('Failed to delete vehicle:', error)
      toast.error('Failed to delete vehicle')
      throw error
    }
  }

  const getVehicleById = async (vehicleId: string) => {
    try {
      const vehicle = await lumi.entities.vehicles.get(vehicleId)
      return vehicle
    } catch (error: any) {
      console.error('Failed to get vehicle:', error)
      toast.error('Failed to load vehicle details')
      throw error
    }
  }

  const updateVehicleStatus = async (vehicleId: string, status: Vehicle['status']) => {
    return updateVehicle(vehicleId, { status })
  }

  const assignDriver = async (vehicleId: string, driverId: string) => {
    return updateVehicle(vehicleId, { 
      currentDriverId: driverId,
      status: 'in_use'
    })
  }

  const releaseVehicle = async (vehicleId: string) => {
    return updateVehicle(vehicleId, { 
      currentDriverId: '',
      status: 'available'
    })
  }

  useEffect(() => {
    fetchVehicles()
  }, [])

  return {
    vehicles,
    loading,
    fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    getVehicleById,
    updateVehicleStatus,
    assignDriver,
    releaseVehicle
  }
}
