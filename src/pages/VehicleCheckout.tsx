
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {ArrowLeft, User, Fuel, MapPin, Save, Mic, MicOff, PenTool} from 'lucide-react'
import { useVehicles } from '../hooks/useVehicles'
import LoadingSpinner from '../components/LoadingSpinner'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'

const VehicleCheckout: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { vehicles, loading } = useVehicles()
  const [vehicle, setVehicle] = useState<any>(null)
  const [drivers, setDrivers] = useState<any[]>([])
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [startingMileage, setStartingMileage] = useState('')
  const [fuelLevel, setFuelLevel] = useState('')
  const [destination, setDestination] = useState('')
  const [tripPurpose, setTripPurpose] = useState('')
  const [estimatedReturn, setEstimatedReturn] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [voiceNotes, setVoiceNotes] = useState('')
  const [signature, setSignature] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (vehicles.length > 0 && id) {
      const foundVehicle = vehicles.find(v => v._id === id)
      setVehicle(foundVehicle || null)
      if (foundVehicle) {
        setStartingMileage(foundVehicle.currentMileage.toString())
        setFuelLevel(foundVehicle.fuelLevel.toString())
      }
    }
    loadDrivers()
  }, [vehicles, id])

  const loadDrivers = async () => {
    try {
      const driverData = await lumi.entities.driver_profiles.list({
        filter: { approvalStatus: 'approved', status: 'active' }
      })
      setDrivers(driverData || [])
    } catch (error) {
      console.error('Error loading drivers:', error)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false)
      toast.success('Voice recording stopped')
    } else {
      setIsRecording(true)
      toast.success('Voice recording started')
    }
  }

  const handleCheckout = async () => {
    if (!selectedDriverId || !startingMileage || !destination || !tripPurpose) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!signature) {
      toast.error('Digital signature is required')
      return
    }

    setSubmitting(true)
    try {
      // Create vehicle assignment record
      const assignmentData = {
        vehicleId: vehicle.vehicleId,
        driverId: selectedDriverId,
        assignmentType: 'checkout',
        assignmentDate: new Date().toISOString(),
        startingMileage: parseInt(startingMileage),
        fuelLevelStart: parseInt(fuelLevel),
        destination,
        tripPurpose,
        estimatedReturnDate: estimatedReturn ? new Date(estimatedReturn).toISOString() : '',
        voiceNotes,
        digitalSignature: signature,
        status: 'active',
        creator: 'current_user'
      }

      await lumi.entities.vehicle_assignments.create(assignmentData)

      // Update vehicle status
      await lumi.entities.vehicles.update(vehicle._id, {
        status: 'in_use',
        currentDriverId: selectedDriverId,
        currentMileage: parseInt(startingMileage),
        fuelLevel: parseInt(fuelLevel),
        updatedAt: new Date().toISOString()
      })

      toast.success('Vehicle checked out successfully')
      navigate(`/vehicles/${id}`)
    } catch (error) {
      console.error('Error checking out vehicle:', error)
      toast.error('Failed to check out vehicle')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <User className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vehicle Not Found</h2>
        <p className="text-gray-600 mb-6">Cannot checkout unknown vehicle.</p>
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

  if (vehicle.status !== 'available') {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <User className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vehicle Not Available</h2>
        <p className="text-gray-600 mb-6">This vehicle is currently {vehicle.status.replace('_', ' ')} and cannot be checked out.</p>
        <Link
          to={`/vehicles/${id}`}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vehicle
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to={`/vehicles/${id}`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vehicle Checkout</h1>
              <p className="text-gray-600">
                {vehicle.year} {vehicle.make} {vehicle.model} • {vehicle.licensePlate}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Selection */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Driver Assignment</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Driver *
          </label>
          <select
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Choose a driver...</option>
            {drivers.map((driver) => (
              <option key={driver._id} value={driver.userId}>
                {driver.personalInfo?.firstName} {driver.personalInfo?.lastName} - {driver.licenseNumber}
              </option>
            ))}
          </select>
          {drivers.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">No approved drivers available</p>
          )}
        </div>
      </div>

      {/* Vehicle Information */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Starting Mileage (km) *
            </label>
            <input
              type="number"
              value={startingMileage}
              onChange={(e) => setStartingMileage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter starting mileage"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fuel Level (%) *
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={fuelLevel}
              onChange={(e) => setFuelLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter fuel percentage"
              required
            />
          </div>
        </div>
      </div>

      {/* Trip Details */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Trip Details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destination *
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter destination address"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trip Purpose *
            </label>
            <textarea
              value={tripPurpose}
              onChange={(e) => setTripPurpose(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the purpose of this trip"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Return Date/Time
            </label>
            <input
              type="datetime-local"
              value={estimatedReturn}
              onChange={(e) => setEstimatedReturn(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Voice Notes */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleRecording}
              className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                isRecording
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Start Voice Note
                </>
              )}
            </button>
            {isRecording && (
              <span className="text-sm text-red-600 animate-pulse">Recording...</span>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Written Notes
            </label>
            <textarea
              value={voiceNotes}
              onChange={(e) => setVoiceNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any additional notes or voice transcription"
            />
          </div>
        </div>
      </div>

      {/* Digital Signature */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Digital Signature</h2>
        
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <PenTool className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Sign here to confirm vehicle checkout</p>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="w-full max-w-md mx-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Type your full name as signature"
              required
            />
          </div>
          
          <div className="text-sm text-gray-600">
            <p className="mb-2">By signing above, I acknowledge that:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>I have received the vehicle in the condition described</li>
              <li>I am authorized to operate this vehicle</li>
              <li>I will return the vehicle in the same condition</li>
              <li>I am responsible for any damage or loss during my use</li>
              <li>I will follow all traffic laws and company policies</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center">
          <Link
            to={`/vehicles/${id}`}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
          
          <button
            onClick={handleCheckout}
            disabled={submitting || !selectedDriverId || !startingMileage || !destination || !tripPurpose || !signature}
            className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                Processing...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Complete Checkout
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default VehicleCheckout
