import React from 'react';
import { FaPlane, FaUser, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import { MdFlightTakeoff, MdFlightLand } from 'react-icons/md';
import { format } from 'date-fns';

interface TicketCardProps {
  ticket: {
    id: string;
    ticket_number: string;
    passenger_name: string;
    departure_location: string;
    destination_location: string;
    departure_date: string;
    arrival_date: string;
    flight_number: string;
    seat_number: string;
    gate: string;
    status: 'active' | 'cancelled' | 'used' | 'expired';
    checkin_status: boolean;
    boarding_status: boolean;
    qr_code_url?: string;
  };
  onViewTicket: () => void;
  onDownloadTicket: () => void;
  onCheckIn: () => void;
}

const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onViewTicket,
  onDownloadTicket,
  onCheckIn
}) => {
  const formatDate = (date: string) => {
    return format(new Date(date), 'MMM d, yyyy • h:mm a');
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { color: 'text-green-600 bg-green-50', icon: FaCheckCircle, text: 'Active' };
      case 'cancelled':
        return { color: 'text-red-600 bg-red-50', icon: FaTimesCircle, text: 'Cancelled' };
      case 'used':
        return { color: 'text-blue-600 bg-blue-50', icon: FaCheckCircle, text: 'Used' };
      case 'expired':
        return { color: 'text-gray-600 bg-gray-50', icon: FaClock, text: 'Expired' };
      default:
        return { color: 'text-gray-600 bg-gray-50', icon: FaClock, text: 'Unknown' };
    }
  };

  const statusInfo = getStatusInfo(ticket.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div className="mb-3 md:mb-0">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${statusInfo.color} mr-3`}>
              <StatusIcon className="text-lg" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{ticket.ticket_number}</h4>
              <p className="text-sm text-gray-600">{ticket.passenger_name}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
          {ticket.checkin_status && (
            <span className="ml-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Checked In
            </span>
          )}
        </div>
      </div>

      {/* Flight Route */}
      <div className="mb-5">
        <div className="relative">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <MdFlightTakeoff className="text-green-500 mr-2" />
              <div>
                <p className="font-semibold">{ticket.departure_location}</p>
                <p className="text-sm text-gray-500">{formatDate(ticket.departure_date)}</p>
              </div>
            </div>
            
            <div className="flex-1 mx-4 relative">
              <div className="h-0.5 bg-gray-300">
                <div className="h-full w-1/2 bg-blue-500"></div>
              </div>
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <FaPlane className="text-blue-500" />
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="text-right">
                <p className="font-semibold">{ticket.destination_location}</p>
                <p className="text-sm text-gray-500">{formatDate(ticket.arrival_date)}</p>
              </div>
              <MdFlightLand className="text-red-500 ml-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Flight Details */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Flight</p>
          <p className="font-bold text-gray-900">{ticket.flight_number}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Seat</p>
          <p className="font-bold text-gray-900">{ticket.seat_number || 'TBA'}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Gate</p>
          <p className="font-bold text-gray-900">{ticket.gate || 'TBA'}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onViewTicket}
          className="flex-1 min-w-[120px] flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <FaUser className="mr-2" />
          View Ticket
        </button>
        
        <button
          onClick={onDownloadTicket}
          className="flex-1 min-w-[120px] flex items-center justify-center px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:border-indigo-500 hover:text-indigo-600 transition"
        >
          <FaCalendarAlt className="mr-2" />
          Download
        </button>
        
        {ticket.status === 'active' && !ticket.checkin_status && (
          <button
            onClick={onCheckIn}
            className="flex-1 min-w-[120px] flex items-center justify-center px-4 py-2.5 border border-green-300 text-green-700 rounded-lg hover:border-green-500 hover:bg-green-50 transition"
          >
            <FaCheckCircle className="mr-2" />
            Check-in
          </button>
        )}
      </div>
    </div>
  );
};

export default TicketCard;