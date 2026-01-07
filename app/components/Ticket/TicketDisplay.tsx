import React from 'react';
import { format } from 'date-fns';
import { 
  FaPlane, 
  FaUser, 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaTicketAlt,
  FaClock,
  FaShieldAlt,
  FaInfoCircle
} from 'react-icons/fa';
import { MdAirlineSeatReclineExtra, MdFlightTakeoff } from 'react-icons/md';

interface Ticket {
  id: string;
  ticket_number: string;
  passenger_name: string;
  passenger_email: string;
  departure_location: string;
  destination_location: string;
  departure_date: string | Date;
  arrival_date: string | Date;
  flight_number: string;
  seat_number: string;
  gate: string;
  booking_reference?: string;
  ticket_class?: string;
  price?: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  qr_code_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface TicketDisplayProps {
  ticket: Ticket;
}

const TicketDisplay: React.FC<TicketDisplayProps> = ({ ticket }) => {
  const formatDate = (date: string | Date) => {
    try {
      return format(new Date(date), 'EEE, MMM d, yyyy • h:mm a');
    } catch (error) {
      return 'Date not available';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' };
      case 'pending': return { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' };
      case 'cancelled': return { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' };
      case 'completed': return { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' };
    }
  };

  const statusColors = getStatusColor(ticket.status);

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200 hover:shadow-3xl transition-shadow duration-300">
      {/* Header with Branding */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-8 text-white">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center mb-4">
              <MdFlightTakeoff className="text-3xl mr-3" />
              <div>
                <h1 className="text-4xl font-bold tracking-tight">TripGo</h1>
                <p className="text-indigo-200 text-lg">Digital Boarding Pass</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <FaShieldAlt className="mr-2" />
                <span>100% Secure</span>
              </div>
              <div className="flex items-center">
                <FaClock className="mr-2" />
                <span>Instant Confirmation</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold tracking-wider mb-2">{ticket.ticket_number}</div>
            <div className="text-sm text-indigo-200">Booking Ref: {ticket.booking_reference || 'N/A'}</div>
            <div className={`inline-flex items-center px-4 py-2 rounded-full mt-3 ${statusColors.bg} ${statusColors.text}`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${statusColors.dot}`}></div>
              <span className="font-semibold">{ticket.status.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Passenger & Flight Details */}
      <div className="p-8">
        {/* Passenger Info */}
        <div className="mb-10 p-6 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center mb-6">
            <FaUser className="text-2xl text-indigo-500 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">Passenger Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
              <p className="text-xl font-semibold text-gray-900">{ticket.passenger_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
              <p className="text-lg text-gray-700">{ticket.passenger_email}</p>
            </div>
          </div>
        </div>

        {/* Flight Route */}
        <div className="mb-10">
          <div className="flex items-center mb-6">
            <FaMapMarkerAlt className="text-2xl text-indigo-500 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">Flight Route</h2>
          </div>
          
          <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
            {/* Visual Flight Path */}
            <div className="relative mb-10">
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gradient-to-r from-green-400 via-blue-500 to-red-400"></div>
              <div className="relative flex justify-between items-center z-10">
                {/* Departure */}
                <div className="text-center">
                  <div className="w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-lg mx-auto"></div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">Departure</p>
                    <p className="text-2xl font-bold text-gray-900">{ticket.departure_location}</p>
                    <div className="flex items-center justify-center mt-2 text-gray-600">
                      <FaCalendarAlt className="mr-2 text-sm" />
                      <span className="font-medium">{formatDate(ticket.departure_date)}</span>
                    </div>
                  </div>
                </div>

                {/* Flight Icon */}
                <div className="relative">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl border-2 border-indigo-200">
                    <FaPlane className="text-3xl text-indigo-600 transform rotate-45" />
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2">
                    <span className="text-sm font-semibold text-indigo-600">{ticket.flight_number}</span>
                  </div>
                </div>

                {/* Arrival */}
                <div className="text-center">
                  <div className="w-6 h-6 bg-red-500 rounded-full border-4 border-white shadow-lg mx-auto"></div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">Arrival</p>
                    <p className="text-2xl font-bold text-gray-900">{ticket.destination_location}</p>
                    <div className="flex items-center justify-center mt-2 text-gray-600">
                      <FaCalendarAlt className="mr-2 text-sm" />
                      <span className="font-medium">{formatDate(ticket.arrival_date)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Duration Info */}
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow">
                <FaClock className="text-indigo-500 mr-2" />
                <span className="font-medium text-gray-700">
                  Flight Duration: {calculateDuration(ticket.departure_date, ticket.arrival_date)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Flight Details Grid */}
        <div className="mb-10">
          <div className="flex items-center mb-6">
            <FaTicketAlt className="text-2xl text-indigo-500 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">Flight Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-2xl font-bold text-blue-600">{ticket.flight_number}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Flight Number</p>
                  <p className="text-lg font-bold text-gray-900">{ticket.flight_number}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                  <MdAirlineSeatReclineExtra className="text-2xl text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Seat Number</p>
                  <p className="text-2xl font-bold text-gray-900">{ticket.seat_number}</p>
                </div>
              </div>
              {ticket.ticket_class && (
                <div className="mt-3">
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {ticket.ticket_class}
                  </span>
                </div>
              )}
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-2xl font-bold text-purple-600">{ticket.gate}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gate</p>
                  <p className="text-2xl font-bold text-gray-900">{ticket.gate}</p>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                <FaInfoCircle className="inline mr-1" />
                Check gate monitors for updates
              </div>
            </div>
          </div>
        </div>

        {/* QR Code and Additional Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Code Section */}
          <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Boarding QR Code</h3>
            <div className="flex flex-col items-center">
              <div className="relative p-4 bg-white rounded-2xl shadow-lg border border-gray-300">
                {ticket.qr_code_url ? (
                  <img 
                    src={ticket.qr_code_url} 
                    alt="Boarding QR Code" 
                    className="w-48 h-48 mx-auto"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center rounded-xl">
                    <div className="text-6xl mb-2">✈️</div>
                    <span className="text-gray-500 font-medium">QR Code</span>
                  </div>
                )}
              </div>
              <div className="mt-6 text-center">
                <p className="text-gray-600 mb-2">Scan this QR code at:</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>✓ Check-in counters</li>
                  <li>✓ Security checkpoints</li>
                  <li>✓ Boarding gates</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-2xl border border-indigo-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Travel Information</h3>
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-blue-100">
                <h4 className="font-semibold text-blue-700 mb-3 flex items-center">
                  <FaShieldAlt className="mr-2" />
                  Check-in Information
                </h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    Online check-in opens 24 hours before departure
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    Airport check-in closes 45 minutes before departure
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    Have valid ID/passport ready
                  </li>
                </ul>
              </div>

              <div className="bg-white p-5 rounded-xl border border-green-100">
                <h4 className="font-semibold text-green-700 mb-3">Baggage Allowance</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">7kg</div>
                    <div className="text-sm text-gray-600">Cabin Baggage</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">23kg</div>
                    <div className="text-sm text-gray-600">Checked Baggage</div>
                  </div>
                </div>
              </div>

              {ticket.price && (
                <div className="bg-white p-5 rounded-xl border border-purple-100">
                  <h4 className="font-semibold text-purple-700 mb-2">Fare Summary</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="text-2xl font-bold text-purple-600">
                      ${ticket.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="mt-10 pt-8 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              <FaInfoCircle className="inline mr-1" />
              Please arrive at the airport at least 2 hours before departure. Have this e-ticket ready on your mobile device or printed.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-gray-400">
              <span>Ticket ID: {ticket.id.substring(0, 8)}...</span>
              <span>•</span>
              <span>Issued: {ticket.created_at ? formatDate(ticket.created_at) : 'N/A'}</span>
              <span>•</span>
              <span>Last Updated: {ticket.updated_at ? formatDate(ticket.updated_at) : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate duration
const calculateDuration = (departure: string | Date, arrival: string | Date) => {
  try {
    const dep = new Date(departure);
    const arr = new Date(arrival);
    const diff = arr.getTime() - dep.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  } catch (error) {
    return 'N/A';
  }
};

export default TicketDisplay;