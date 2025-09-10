
import React, { useState, useEffect } from 'react'
import {Settings, Search, Plus, Calendar, DollarSign, Wrench, Filter, Eye, Edit, Trash2} from 'lucide-react'
import { lumi } from '../lib/lumi'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

interface ServiceRecord {
  _id: string
  vehicleId: string
  serviceType: string
  serviceDate: string
  mileageAtService: number
  cost: number
  serviceProvider: string
  serviceLocation: string
  description: string
  partsReplaced: Array<{
    partName: string
    partNumber: string
    quantity: number
    cost: number
  }>
  laborHours: number
  laborCost: number
  nextServiceDue: string
  nextServiceMileage: number
  warrantyInfo: {
    warrantyPeriod: number
    warrantyMileage: number
    warrantyExpiry: string
  }
  serviceReceipts: string[]
  technicianId: string
  serviceNotes: string
  creator: string
  createdAt: string
  updatedAt: string
}

interface Vehicle {
  _id: string
  vehicleId: string
  make: string
  model: string
  year: number
  licensePlate: string
  currentMileage: number
}

const ServiceRecords: React.FC = () => {
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [vehicleFilter, setVehicleFilter] = useState<string>('all')
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('all')
  const [selectedRecord, setSelectedRecord] = useState<ServiceRecord | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [recordsData, vehiclesData] = await Promise.all([
        lumi.entities.service_records.list(),
        lumi.entities.vehicles.list()
      ])
      setServiceRecords(recordsData || [])
      setVehicles(vehiclesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load service records')
    } finally {
      setLoading(false)
    }
  }

  const deleteServiceRecord = async (recordId: string) => {
    if (!window.confirm('Are you sure you want to delete this service record?')) return
    
    try {
      await lumi.entities.service_records.delete(recordId)
      toast.success('Service record deleted successfully')
      loadData()
    } catch (error) {
      console.error('Error deleting service record:', error)
      toast.error('Failed to delete service record')
    }
  }

  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.vehicleId === vehicleId)
    return vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})` : vehicleId
  }

  const filteredRecords = serviceRecords.filter(record => {
    const matchesSearch = 
      record.vehicleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.serviceProvider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getVehicleInfo(record.vehicleId).toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesVehicle = vehicleFilter === 'all' || record.vehicleId === vehicleFilter
    const matchesServiceType = serviceTypeFilter === 'all' || record.serviceType === serviceTypeFilter
    
    let matchesDate = true
    if (dateRange !== 'all') {
      const recordDate = new Date(record.serviceDate)
      const now = new Date()
      switch (dateRange) {
        case 'week':
          matchesDate = recordDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          matchesDate = recordDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'quarter':
          matchesDate = recordDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case 'year':
          matchesDate = recordDate >= new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
      }
    }
    
    return matchesSearch && matchesVehicle && matchesServiceType && matchesDate
  })

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

  const getServiceTypeColor = (type: string) => {
    switch (type) {
      case 'routine_maintenance': return 'bg-blue-100 text-blue-800'
      case 'repair': return 'bg-red-100 text-red-800'
      case 'tire_change': return 'bg-green-100 text-green-800'
      case 'oil_change': return 'bg-yellow-100 text-yellow-800'
      case 'inspection': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const totalCost = filteredRecords.reduce((sum, record) => sum + record.cost, 0)
  const averageCost = filteredRecords.length > 0 ? totalCost / filteredRecords.length : 0

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Service Records</h1>
            <p className="text-gray-600">Track vehicle maintenance and service history</p>
          </div>
          
          <button 
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Service Record
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{filteredRecords.length}</p>
            </div>
            <Settings className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Cost</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCost)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Cost</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(averageCost)}</p>
            </div>
            <Wrench className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {serviceRecords.filter(r => {
                  const recordDate = new Date(r.serviceDate)
                  const now = new Date()
                  return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear()
                }).length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Vehicles</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle._id} value={vehicle.vehicleId}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </option>
            ))}
          </select>
          
          <select
            value={serviceTypeFilter}
            onChange={(e) => setServiceTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Service Types</option>
            <option value="routine_maintenance">Routine Maintenance</option>
            <option value="repair">Repair</option>
            <option value="tire_change">Tire Change</option>
            <option value="oil_change">Oil Change</option>
            <option value="inspection">Inspection</option>
          </select>
          
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          
          <div className="text-sm text-gray-600 flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            {filteredRecords.length} records
          </div>
        </div>
      </div>

      {/* Service Records Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No service records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mileage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getVehicleInfo(record.vehicleId)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getServiceTypeColor(record.serviceType)}`}>
                        {record.serviceType.replace('_', ' ')}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(record.serviceDate)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.mileageAtService.toLocaleString()} km
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(record.cost)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.serviceProvider}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(record.nextServiceDue)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedRecord(record)
                            setShowModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteServiceRecord(record._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Service Record Detail Modal */}
      {showModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Service Record Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Service Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Vehicle</label>
                      <p className="text-gray-900">{getVehicleInfo(selectedRecord.vehicleId)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Service Type</label>
                      <p className="text-gray-900">{selectedRecord.serviceType.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Service Date</label>
                      <p className="text-gray-900">{formatDate(selectedRecord.serviceDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Mileage</label>
                      <p className="text-gray-900">{selectedRecord.mileageAtService.toLocaleString()} km</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Cost</label>
                      <p className="text-gray-900">{formatCurrency(selectedRecord.cost)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Provider Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Service Provider</label>
                      <p className="text-gray-900">{selectedRecord.serviceProvider}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Location</label>
                      <p className="text-gray-900">{selectedRecord.serviceLocation}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Labor Hours</label>
                      <p className="text-gray-900">{selectedRecord.laborHours} hours</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Labor Cost</label>
                      <p className="text-gray-900">{formatCurrency(selectedRecord.laborCost)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                <p className="text-gray-700">{selectedRecord.description}</p>
              </div>

              {selectedRecord.partsReplaced && selectedRecord.partsReplaced.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Parts Replaced</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Part Name</th>
                          <th className="px-4 py-2 text-left">Part Number</th>
                          <th className="px-4 py-2 text-left">Quantity</th>
                          <th className="px-4 py-2 text-left">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRecord.partsReplaced.map((part, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2">{part.partName}</td>
                            <td className="px-4 py-2">{part.partNumber}</td>
                            <td className="px-4 py-2">{part.quantity}</td>
                            <td className="px-4 py-2">{formatCurrency(part.cost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Service</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Due Date</label>
                    <p className="text-gray-900">{formatDate(selectedRecord.nextServiceDue)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Due Mileage</label>
                    <p className="text-gray-900">{selectedRecord.nextServiceMileage?.toLocaleString()} km</p>
                  </div>
                </div>
              </div>

              {selectedRecord.serviceNotes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Notes</h3>
                  <p className="text-gray-700">{selectedRecord.serviceNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ServiceRecords
