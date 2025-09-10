
import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {Car, MapPin, Calendar, Fuel, Settings, FileText, Camera, CheckCircle, AlertTriangle, ArrowLeft, Edit, Trash2, Phone, User, Clock, Activity} from 'lucide-react'
import { useVehicles } from '../hooks/useVehicles'
import LoadingSpinner from '../components/LoadingSpinner'
import { lumi } from '../lib/lumi'

interface Vehicle {
  _id: string
  vehicleId: string
  make: string
  model: string
  year: number
  licensePlate: string
  vin: string
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service'
  currentMileage: number
  fuelLevel: number
  lastServiceDate: string
  nextServiceDate: string
  serviceIntervalKm: number
  licenseDiskExpiry: string
  insuranceExpiry: string
  currentDriverId?: string
  location: {
    latitude: number
    longitude: number
    address: string
  }
  specifications: {
    engine: string
    transmission: string
    fuelType: string
    capacity: number
  }
  creator: string
  createdAt: string
  updatedAt: string
}

interface ServiceRecord {
  _id: string
  vehicleId: string
  serviceType: string
  serviceDate: string
  mileageAtService: number
  cost: number
  serviceProvider: string
  description: string
  nextServiceDue: string
  serviceNotes: string
}

interface VehicleInspection {
  _id: string
  vehicleId: string
  inspectionType: 'pre_trip' | 'post_trip' | 'scheduled'
  inspectionDate: string
  inspectorId: string
  mileageAtInspection: number
  fuelLevel: number
  overallCondition: 'excellent' | 'good' | 'fair' | 'poor'
  damageReported: boolean
  notes: string
}

const VehicleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { vehicles, loading, deleteVehicle } = useVehicles()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([])
  const [inspections, setInspections] = useState<VehicleInspection[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'service' | 'inspections' | 'documents'>('overview')
  const [loadingRecords, setLoadingRecords] = useState(false)

  useEffect(() => {
    if (vehicles.length > 0 && id) {
      const foundVehicle = vehicles.find(v => v._id === id)
      setVehicle(foundVehicle || null)
      
      if (foundVehicle) {
        loadServiceRecords(foundVehicle.vehicleId)
        loadInspections(foundVehicle.vehicleId)
      }
    }
  }, [vehicles, id])

  const loadServiceRecords = async (vehicleId: string) => {
    try {
      setLoadingRecords(true)
      const records = await lumi.entities.service_records.list({
        filter: { vehicleId }
      })
      setServiceRecords(records || [])
    } catch (error) {
      console.error('Error loading service records:', error)
    } finally {
      setLoadingRecords(false)
    }
  }

  const loadInspections = async (vehicleId: string) => {
    try {
      const inspectionData = await lumi.entities.vehicle_inspections.list({
        filter: { vehicleId }
      })
      setInspections(inspectionData || [])
    } catch (error) {
      console.error('Error loading inspections:', error)
    }
  }

  const handleDeleteVehicle = async () => {
    if (!vehicle || !window.confirm('Are you sure you want to delete this vehicle?')) return
    
    try {
      await deleteVehicle(vehicle._id)
      navigate('/vehicles')
    } catch (error) {
      console.error('Error deleting vehicle:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'in_use': return 'bg-blue-100 text-blue-800'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800'
      case 'out_of_service': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <Car className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vehicle Not Found</h2>
        <p className="text-gray-600 mb-6">The vehicle you're looking for doesn't exist or has been removed.</p>
        <Link
          to="/vehicles"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vehicles
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              to="/vehicles"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <p className="text-gray-600">{vehicle.licensePlate} • {vehicle.vehicleId}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(vehicle.status)}`}>
              {vehicle.status.replace('_', ' ').toUpperCase()}
            </span>
            <div className="flex space-x-2">
              <Link
                to={`/vehicles/${vehicle._id}/inspect`}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Camera className="h-4 w-4 mr-2" />
                Inspect
              </Link>
              {vehicle.status === 'available' && (
                <Link
                  to={`/vehicles/${vehicle._id}/checkout`}
                  className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Check Out
                </Link>
              )}
              {vehicle.status === 'in_use' && (
                <Link
                  to={`/vehicles/${vehicle._id}/checkin`}
                  className="inline-flex items-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Check In
                </Link>
              )}
              <button
                onClick={handleDeleteVehicle}
                className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Mileage</p>
                <p className="text-xl font-semibold text-gray-900">
                  {vehicle.currentMileage.toLocaleString()} km
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fuel Level</p>
                <p className="text-xl font-semibold text-gray-900">{vehicle.fuelLevel}%</p>
              </div>
              <Fuel className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last Service</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatDate(vehicle.lastServiceDate)}
                </p>
              </div>
              <Settings className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {vehicle.location.address}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: Car },
              { id: 'service', label: 'Service History', icon: Settings },
              { id: 'inspections', label: 'Inspections', icon: Camera },
              { id: 'documents', label: 'Documents', icon: FileText }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Vehicle Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Vehicle Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">VIN</span>
                      <span className="font-medium">{vehicle.vin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Engine</span>
                      <span className="font-medium">{vehicle.specifications.engine}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transmission</span>
                      <span className="font-medium">{vehicle.specifications.transmission}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fuel Type</span>
                      <span className="font-medium">{vehicle.specifications.fuelType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Capacity</span>
                      <span className="font-medium">{vehicle.specifications.capacity} passengers</span>
                    </div>
                  </div>
                </div>

                {/* Important Dates */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Important Dates</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">License Disk Expiry</span>
                      <span className="font-medium">{formatDate(vehicle.licenseDiskExpiry)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Insurance Expiry</span>
                      <span className="font-medium">{formatDate(vehicle.insuranceExpiry)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Next Service Due</span>
                      <span className="font-medium">{formatDate(vehicle.nextServiceDate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Service Interval</span>
                      <span className="font-medium">{vehicle.serviceIntervalKm.toLocaleString()} km</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Location */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Location</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">{vehicle.location.address}</p>
                      <p className="text-sm text-gray-600">
                        {vehicle.location.latitude}, {vehicle.location.longitude}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'service' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Service History</h3>
                <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Settings className="h-4 w-4 mr-2" />
                  Add Service Record
                </button>
              </div>
              
              {loadingRecords ? (
                <LoadingSpinner />
              ) : serviceRecords.length > 0 ? (
                <div className="space-y-4">
                  {serviceRecords.map((record) => (
                    <div key={record._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 capitalize">
                            {record.serviceType.replace('_', ' ')}
                          </h4>
                          <p className="text-sm text-gray-600">{record.serviceProvider}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(record.cost)}</p>
                          <p className="text-sm text-gray-600">{formatDate(record.serviceDate)}</p>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-3">{record.description}</p>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Mileage: {record.mileageAtService.toLocaleString()} km</span>
                        <span>Next Service: {formatDate(record.nextServiceDue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No service records found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'inspections' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Inspection History</h3>
                <Link
                  to={`/vehicles/${vehicle._id}/inspect`}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  New Inspection
                </Link>
              </div>
              
              {inspections.length > 0 ? (
                <div className="space-y-4">
                  {inspections.map((inspection) => (
                    <div key={inspection._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 capitalize">
                            {inspection.inspectionType.replace('_', ' ')} Inspection
                          </h4>
                          <p className="text-sm text-gray-600">
                            {formatDate(inspection.inspectionDate)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            inspection.overallCondition === 'excellent' ? 'bg-green-100 text-green-800' :
                            inspection.overallCondition === 'good' ? 'bg-blue-100 text-blue-800' :
                            inspection.overallCondition === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {inspection.overallCondition}
                          </span>
                          {inspection.damageReported && (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 mb-3">{inspection.notes}</p>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Mileage: {inspection.mileageAtInspection.toLocaleString()} km</span>
                        <span>Fuel: {inspection.fuelLevel}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No inspections found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Vehicle Documents</h3>
                <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <FileText className="h-4 w-4 mr-2" />
                  Upload Document
                </button>
              </div>
              
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No documents uploaded</p>
                <p className="text-sm text-gray-500">Upload vehicle registration, insurance, and other important documents</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VehicleDetail
