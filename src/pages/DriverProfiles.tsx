
import React, { useState, useEffect } from 'react'
import {User, Search, Plus, Eye, Edit, Trash2, CheckCircle, XCircle, Calendar, Phone, Mail, AlertTriangle} from 'lucide-react'
import { lumi } from '../lib/lumi'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

interface DriverProfile {
  _id: string
  userId: string
  licenseNumber: string
  licenseClass: string
  licenseExpiry: string
  status: 'active' | 'inactive' | 'suspended'
  personalInfo: {
    firstName: string
    lastName: string
    dateOfBirth: string
    address: string
    phoneNumber: string
    email: string
  }
  emergencyContact: {
    name: string
    relationship: string
    phoneNumber: string
    email: string
  }
  companyInfo: {
    companyName: string
    department: string
    employeeId: string
    position: string
    supervisor: string
  }
  documents: Array<{
    type: string
    url: string
    expiryDate: string
    verified: boolean
  }>
  drivingHistory: {
    totalMileage: number
    accidentCount: number
    violationCount: number
    safetyRating: number
  }
  approvalStatus: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  approvalDate?: string
  creator: string
  createdAt: string
  updatedAt: string
}

const DriverProfiles: React.FC = () => {
  const [drivers, setDrivers] = useState<DriverProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [approvalFilter, setApprovalFilter] = useState<string>('all')
  const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadDrivers()
  }, [])

  const loadDrivers = async () => {
    try {
      setLoading(true)
      const driverData = await lumi.entities.driver_profiles.list()
      setDrivers(driverData || [])
    } catch (error) {
      console.error('Error loading drivers:', error)
      toast.error('Failed to load driver profiles')
    } finally {
      setLoading(false)
    }
  }

  const updateDriverApproval = async (driverId: string, status: 'approved' | 'rejected') => {
    try {
      await lumi.entities.driver_profiles.update(driverId, {
        approvalStatus: status,
        approvedBy: 'current_user', // This should come from auth context
        approvalDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      
      toast.success(`Driver ${status} successfully`)
      loadDrivers()
    } catch (error) {
      console.error('Error updating driver approval:', error)
      toast.error('Failed to update driver approval')
    }
  }

  const deleteDriver = async (driverId: string) => {
    if (!window.confirm('Are you sure you want to delete this driver profile?')) return
    
    try {
      await lumi.entities.driver_profiles.delete(driverId)
      toast.success('Driver profile deleted successfully')
      loadDrivers()
    } catch (error) {
      console.error('Error deleting driver:', error)
      toast.error('Failed to delete driver profile')
    }
  }

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = 
      driver.personalInfo.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.personalInfo.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.personalInfo.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter
    const matchesApproval = approvalFilter === 'all' || driver.approvalStatus === approvalFilter
    
    return matchesSearch && matchesStatus && matchesApproval
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getApprovalColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
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

  const isLicenseExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
  }

  const isLicenseExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date()
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Driver Profiles</h1>
            <p className="text-gray-600">Manage driver information and approvals</p>
          </div>
          
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Driver
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          
          <select
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Approvals</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <div className="text-sm text-gray-600 flex items-center">
            Total: {filteredDrivers.length} drivers
          </div>
        </div>
      </div>

      {/* Driver List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredDrivers.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No drivers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    License
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approval
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Safety Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDrivers.map((driver) => (
                  <tr key={driver._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {driver.personalInfo.firstName} {driver.personalInfo.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{driver.personalInfo.email}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{driver.licenseNumber}</div>
                          <div className="text-sm text-gray-500">{driver.licenseClass}</div>
                        </div>
                        {isLicenseExpired(driver.licenseExpiry) && (
                          <AlertTriangle className="h-4 w-4 text-red-500 ml-2" title="License Expired" />
                        )}
                        {isLicenseExpiringSoon(driver.licenseExpiry) && !isLicenseExpired(driver.licenseExpiry) && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500 ml-2" title="License Expiring Soon" />
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{driver.companyInfo.companyName}</div>
                      <div className="text-sm text-gray-500">{driver.companyInfo.position}</div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(driver.status)}`}>
                        {driver.status}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getApprovalColor(driver.approvalStatus)}`}>
                        {driver.approvalStatus}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {driver.drivingHistory.safetyRating.toFixed(1)}/5.0
                        </div>
                        <div className="ml-2 flex">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-2 w-2 rounded-full mr-1 ${
                                i < Math.floor(driver.drivingHistory.safetyRating)
                                  ? 'bg-green-400'
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedDriver(driver)
                            setShowModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {driver.approvalStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => updateDriverApproval(driver._id, 'approved')}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => updateDriverApproval(driver._id, 'rejected')}
                              className="text-red-600 hover:text-red-900"
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => deleteDriver(driver._id)}
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

      {/* Driver Detail Modal */}
      {showModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Driver Profile Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-gray-900">
                        {selectedDriver.personalInfo.firstName} {selectedDriver.personalInfo.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                      <p className="text-gray-900">{formatDate(selectedDriver.personalInfo.dateOfBirth)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <p className="text-gray-900">{selectedDriver.personalInfo.address}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-gray-900">{selectedDriver.personalInfo.phoneNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900">{selectedDriver.personalInfo.email}</p>
                    </div>
                  </div>
                </div>

                {/* License Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">License Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">License Number</label>
                      <p className="text-gray-900">{selectedDriver.licenseNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">License Class</label>
                      <p className="text-gray-900">{selectedDriver.licenseClass}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Expiry Date</label>
                      <p className={`${
                        isLicenseExpired(selectedDriver.licenseExpiry) ? 'text-red-600' :
                        isLicenseExpiringSoon(selectedDriver.licenseExpiry) ? 'text-yellow-600' :
                        'text-gray-900'
                      }`}>
                        {formatDate(selectedDriver.licenseExpiry)}
                        {isLicenseExpired(selectedDriver.licenseExpiry) && ' (Expired)'}
                        {isLicenseExpiringSoon(selectedDriver.licenseExpiry) && !isLicenseExpired(selectedDriver.licenseExpiry) && ' (Expiring Soon)'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-gray-900">{selectedDriver.emergencyContact.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Relationship</label>
                      <p className="text-gray-900">{selectedDriver.emergencyContact.relationship}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-gray-900">{selectedDriver.emergencyContact.phoneNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Company Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Company</label>
                      <p className="text-gray-900">{selectedDriver.companyInfo.companyName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Department</label>
                      <p className="text-gray-900">{selectedDriver.companyInfo.department}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Employee ID</label>
                      <p className="text-gray-900">{selectedDriver.companyInfo.employeeId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Position</label>
                      <p className="text-gray-900">{selectedDriver.companyInfo.position}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Driving History */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Driving History</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedDriver.drivingHistory.totalMileage.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Total Mileage</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedDriver.drivingHistory.accidentCount}
                    </p>
                    <p className="text-sm text-gray-600">Accidents</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedDriver.drivingHistory.violationCount}
                    </p>
                    <p className="text-sm text-gray-600">Violations</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedDriver.drivingHistory.safetyRating.toFixed(1)}
                    </p>
                    <p className="text-sm text-gray-600">Safety Rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DriverProfiles
