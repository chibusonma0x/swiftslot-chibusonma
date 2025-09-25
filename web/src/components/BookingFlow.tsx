import { useState } from 'react'
import Spinner from './Spinner'

interface BookingFlowProps {
  vendorId: number
  vendorName: string
  selectedDate: string
  selectedSlotUtc: string
  onSuccess: () => void
  onError: (message: string) => void
}

interface BookingState {
  step: 'booking' | 'payment' | 'success' | 'error'
  bookingId: number | null
  paymentRef: string | null
  loading: boolean
  error: string | null
}

const BookingFlow = ({ 
  vendorId, 
  vendorName, 
  selectedDate, 
  selectedSlotUtc, 
  onSuccess, 
  onError 
}: BookingFlowProps) => {
  const [state, setState] = useState<BookingState>({
    step: 'booking',
    bookingId: null,
    paymentRef: null,
    loading: false,
    error: null
  })

  const formatTimeSlot = (utcTime: string) => {
    const date = new Date(utcTime)
    const lagosTime = new Date(date.getTime() + (1 * 60 * 60 * 1000))
    return lagosTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }
  const generateIdempotencyKey = () => {
    return `booking-${vendorId}-${selectedSlotUtc}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  const createBooking = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const slotStart = new Date(selectedSlotUtc)
      const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000)

      const response = await fetch('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': generateIdempotencyKey()
        },
        body: JSON.stringify({
          vendorId: vendorId,
          startISO: slotStart.toISOString(),
          endISO: slotEnd.toISOString()
        })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create booking')
      }
      const booking = await response.json()
      setState(prev => ({ 
        ...prev, 
        step: 'payment',
        bookingId: booking.id,
        loading: false 
      }))
      await initializePayment(booking.id)

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create booking'
      setState(prev => ({ 
        ...prev, 
        step: 'error', 
        error: message, 
        loading: false 
      }))
      onError(message)
    }
  }

  const initializePayment = async (bookingId: number) => {
    try {
      setState(prev => ({ ...prev, loading: true }))

      const response = await fetch('http://localhost:3000/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bookingId })
      })

      if (!response.ok) {
        throw new Error('Failed to initialize payment')
      }

      const payment = await response.json()
      setState(prev => ({ 
        ...prev, 
        paymentRef: payment.ref 
      }))

      await processPayment(payment.ref, bookingId)

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initialize payment'
      setState(prev => ({ 
        ...prev, 
        step: 'error', 
        error: message, 
        loading: false 
      }))
      onError(message)
    }
  }

  const processPayment = async (paymentRef: string, bookingId: number) => {
    try {
      const response = await fetch('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event: 'charge.success',
          data: { reference: paymentRef }
        })
      })

      if (!response.ok) {
        throw new Error('Payment processing failed')
      }
      await pollBookingStatus(bookingId)

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment failed'
      setState(prev => ({ 
        ...prev, 
        step: 'error', 
        error: message, 
        loading: false 
      }))
      onError(message)
    }
  }

  const pollBookingStatus = async (bookingId: number, attempts = 0) => {
    try {
      const response = await fetch(`http://localhost:3000/api/bookings/${bookingId}`)
      const booking = await response.json()

      if (booking.status === 'paid') {
        setState(prev => ({ 
          ...prev, 
          step: 'success', 
          loading: false 
        }))
        onSuccess()
        return
      }

      if (attempts < 10) {
        setTimeout(() => pollBookingStatus(bookingId, attempts + 1), 1000)
      } else {
        throw new Error('Payment confirmation timeout')
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to confirm payment'
      setState(prev => ({ 
        ...prev, 
        step: 'error', 
        error: message, 
        loading: false 
      }))
      onError(message)
    }
  }

  const handleBookAndPay = () => {
    createBooking()
  }

  if (state.step === 'success') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-600 mb-2">Booking Confirmed</h3>
          <div className="text-sm text-zinc-600 space-y-1">
            <p><strong>Vendor:</strong> {vendorName}</p>
            <p><strong>Date:</strong> {selectedDate}</p>
            <p><strong>Time:</strong> {formatTimeSlot(selectedSlotUtc)} (Lagos)</p>
            {state.bookingId && <p><strong>Booking ID:</strong> {state.bookingId}</p>}
          </div>
        </div>
      </div>
    )
  }

  if (state.step === 'error') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-600 mb-2">Booking Failed</h3>
          <p className="text-sm text-zinc-600 mb-4">{state.error}</p>
          <button 
            onClick={() => setState(prev => ({ ...prev, step: 'booking', error: null }))}
            className="text-sky-600 hover:text-sky-700 text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
      <h3 className="text-lg font-semibold text-zinc-700 mb-4">Review Booking</h3>
      
      <div className="space-y-3 text-sm">
        <div>
          <span className="text-zinc-600">Vendor:</span>
          <span className="ml-2 font-medium">{vendorName}</span>
        </div>
        <div>
          <span className="text-zinc-600">Date:</span>
          <span className="ml-2 font-medium">{selectedDate}</span>
        </div>
        <div>
          <span className="text-zinc-600">Lagos Time:</span>
          <span className="ml-2 font-medium">{formatTimeSlot(selectedSlotUtc)}</span>
        </div>
        <div>
          <span className="text-zinc-600">UTC Time:</span>
          <span className="ml-2 font-medium text-xs">
            {new Date(selectedSlotUtc).toISOString()}
          </span>
        </div>
        <div className="border-t pt-3">
          <span className="text-zinc-600">Price:</span>
          <span className="ml-2 font-medium text-lg">₦5,000</span>
        </div>
      </div>

      <button 
        onClick={handleBookAndPay}
        disabled={state.loading}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors mt-6 ${
          state.loading 
            ? 'bg-gray-400 text-white cursor-not-allowed' 
            : 'bg-sky-600 text-white hover:bg-sky-700'
        }`}
      >
       {state.loading ? (
  <div className="flex items-center justify-center">
    <Spinner size='large' color="#000" />
    <span className="ml-2">Processing...</span>
  </div>
) : (
  'Book & Pay'
)}
      </button>
    </div>
  )
}

export default BookingFlow