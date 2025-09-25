import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

interface Vendor {
  id: number
  name: string
  timezone: string
}

const VendorsListPage = () => {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/vendors')
      if (!response.ok) {
        throw new Error('Failed to fetch vendors')
      }
      const data = await response.json()
      setVendors(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-zinc-700">Loading vendors...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error: {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-zinc-700 ">Available Vendors</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.map((vendor) => (
          <div
            key={vendor.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center font-semibold text-lg">
                {getInitials(vendor.name)}
              </div>
              <div>
                <h3 className="font-bold text-lg text-zinc-700">{vendor.name}</h3>
                <span className="inline-block bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full">
                  {vendor.timezone}
                </span>
              </div>
            </div>
            
            <Link
              to={`/vendor/${vendor.id}`}
              className="inline-block w-full text-center bg-sky-600 text-white py-2 px-4 rounded-lg hover:bg-sky-700 transition-colors font-medium"
            >
              See availability
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

export default VendorsListPage