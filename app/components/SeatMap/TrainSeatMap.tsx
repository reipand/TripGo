// 'use client';

// import React, { useState, useEffect } from 'react';
// import { Train, Seat } from '@/types';

// // Define Wagon type used within this component (aligns with Train.wagons structure)
// interface Wagon {
//   number: string;
//   name: string;
//   class: 'executive' | 'business' | 'economy' | string;
//   facilities: string[];
//   availableSeats: number;
//   totalSeats: number;
//   seats: Seat[];
// }

// interface TrainSeatMapProps {
//   train: Train;
//   selectedSeats: Seat[];
//   onSeatSelect: (seat: Seat) => void;
//   onSeatDeselect: (seatId: string) => void;
//   maxSeats?: number;
// }

// export const TrainSeatMap: React.FC<TrainSeatMapProps> = ({
//   train,
//   selectedSeats,
//   onSeatSelect,
//   onSeatDeselect,
//   maxSeats = 4,
// }) => {
//   const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);
//   const [selectedWagon, setSelectedWagon] = useState<string>(train.wagons[0]?.number || '');
//   const [selectedClass, setSelectedClass] = useState<string>('all');

//   // Filter wagon berdasarkan kelas yang dipilih
//   const filteredWagons = train.wagons.filter((wagon: { class: string; }) => 
//     selectedClass === 'all' || wagon.class === selectedClass
//   );

//   // Inisialisasi selectedWagon jika belum ada
//   useEffect(() => {
//     if (train.wagons.length > 0 && !selectedWagon) {
//       setSelectedWagon(train.wagons[0].number);
//     }
//   }, [train.wagons, selectedWagon]);

//   const getSeatColor = (seat: Seat, wagonClass: string) => {
//     if (selectedSeats.some(s => s.id === seat.id)) {
//       return 'bg-green-500 border-green-600 text-white';
//     }
//     if (!seat.available) {
//       return 'bg-gray-300 border-gray-400 cursor-not-allowed text-gray-500';
//     }
//     if (wagonClass === 'executive') {
//       return seat.windowSeat 
//         ? 'bg-blue-100 border-blue-300 hover:bg-blue-200 text-blue-700' 
//         : 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-600';
//     }
//     if (wagonClass === 'business') {
//       return seat.windowSeat 
//         ? 'bg-purple-100 border-purple-300 hover:bg-purple-200 text-purple-700' 
//         : 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-600';
//     }
//     if (wagonClass === 'economy') {
//       return seat.windowSeat 
//         ? 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-700' 
//         : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600';
//     }
//     return 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600';
//   };

//   const getSeatPrice = (seat: Seat, wagonClass: string) => {
//     let basePrice = train.price;
    
//     // Multiplier berdasarkan kelas gerbong
//     if (wagonClass === 'executive') basePrice *= 1.5;
//     if (wagonClass === 'business') basePrice *= 1.2;
    
//     // Tambahan untuk kursi dekat jendela
//     if (seat.windowSeat) basePrice *= 1.1;
    
//     // Tambahan untuk kursi menghadap depan
//     if (seat.forwardFacing) basePrice *= 1.05;
    
//     return Math.round(basePrice);
//   };

//   const renderWagon = (wagonNumber: string) => {
//     const foundWagon: Wagon | undefined = train.wagons.find((w: { number: string; }) => w.number === wagonNumber);
//     if (!foundWagon) {
//       return (
//         <div className="wagon-container bg-white rounded-xl shadow-lg p-6 mb-6">
//           <div className="text-center py-8 text-gray-500">
//             Gerbong tidak ditemukan
//           </div>
//         </div>
//       );
//     }

//     // Kelompokkan kursi berdasarkan row
//     const rows = foundWagon.seats.reduce((acc: {[key: number]: Seat[]}, seat) => {
//       if (!acc[seat.row]) {
//         acc[seat.row] = [];
//       }
//       acc[seat.row].push(seat);
//       return acc;
//     }, {});

//     const totalRows = Object.keys(rows).length;

//     // Determine seat columns and split by aisle to match wagon configuration (e.g., 2-2, 3-2)
//     const allColumns = Array.from(new Set(foundWagon.seats.map(s => s.column))).sort();
//     const getAisleSplit = (cols: string[]) => {
//       const normalized = cols.sort();
//       // Common KAI patterns
//       if (normalized.length === 4) {
//         // Executive/Business 2-2: A B | C D
//         return { left: ['A', 'B'], right: ['C', 'D'] };
//       }
//       if (normalized.length === 5) {
//         // Economy 3-2: A B C | D E
//         return { left: ['A', 'B', 'C'], right: ['D', 'E'] };
//       }
//       if (normalized.length === 3) {
//         // 2-1: A B | C
//         return { left: ['A', 'B'], right: ['C'] };
//       }
//       if (normalized.length === 2) {
//         // 1-1: A | B
//         return { left: [normalized[0]], right: [normalized[1]] };
//       }
//       // Fallback: split by half
//       const half = Math.ceil(normalized.length / 2);
//       return { left: normalized.slice(0, half), right: normalized.slice(half) };
//     };
//     const { left: leftCols, right: rightCols } = getAisleSplit(allColumns);

//     return (
//       <div className="wagon-container bg-white rounded-xl shadow-lg p-6 mb-6">
//         <div className="wagon-header mb-6">
//           <div className="flex items-center justify-between mb-4">
//             <div>
//               <h4 className="text-xl font-bold text-gray-800">
//                 {foundWagon.name} - {foundWagon.number}
//               </h4>
//               <p className="text-sm text-gray-600 capitalize">
//                 Kelas {foundWagon.class} • {foundWagon.facilities.join(' • ')}
//               </p>
//             </div>
//             <div className="text-right">
//               <div className="text-sm text-gray-600">Kapasitas</div>
//               <div className="text-lg font-bold text-blue-600">
//                 {foundWagon.availableSeats} / {foundWagon.totalSeats} kursi tersedia
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Wagon Layout Visualization */}
//         <div className="relative mb-8">
//           <div className="wagon-body border-2 border-gray-300 rounded-lg p-4">
//             {/* Walkway */}
//             <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gray-200"></div>
            
//             {/* Seats Grid */}
//             <div className="grid grid-cols-2 gap-4 relative">
//               {/* Left side seats */}
//               <div className="space-y-2">
//                 {Object.entries(rows).map(([rowNumber, seatsInRow]) => {
//                   const leftSeats = seatsInRow.filter(seat => 
//                     leftCols.includes(seat.column)
//                   );
                  
//                   return (
//                     <div key={`left-row-${rowNumber}`} className="flex space-x-2">
//                       {leftSeats.map((seat) => (
//                         <SeatButton
//                           key={seat.id}
//                           seat={seat}
//                           wagon={foundWagon}
//                           isSelected={selectedSeats.some(s => s.id === seat.id)}
//                           onSelect={onSeatSelect}
//                           onDeselect={onSeatDeselect}
//                           getSeatColor={getSeatColor}
//                           getSeatPrice={getSeatPrice}
//                           hoveredSeat={hoveredSeat}
//                           setHoveredSeat={setHoveredSeat}
//                           selectedSeatsCount={selectedSeats.length}
//                           maxSeats={maxSeats}
//                         />
//                       ))}
//                     </div>
//                   );
//                 })}
//               </div>
              
//               {/* Right side seats */}
//               <div className="space-y-2">
//                 {Object.entries(rows).map(([rowNumber, seatsInRow]) => {
//                   const rightSeats = seatsInRow.filter(seat => 
//                     rightCols.includes(seat.column)
//                   );
                  
//                   return (
//                     <div key={`right-row-${rowNumber}`} className="flex space-x-2 justify-end">
//                       {rightSeats.map((seat) => (
//                         <SeatButton
//                           key={seat.id}
//                           seat={seat}
//                           wagon={foundWagon}
//                           isSelected={selectedSeats.some(s => s.id === seat.id)}
//                           onSelect={onSeatSelect}
//                           onDeselect={onSeatDeselect}
//                           getSeatColor={getSeatColor}
//                           getSeatPrice={getSeatPrice}
//                           hoveredSeat={hoveredSeat}
//                           setHoveredSeat={setHoveredSeat}
//                           selectedSeatsCount={selectedSeats.length}
//                           maxSeats={maxSeats}
//                         />
//                       ))}
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
            
//             {/* Row Numbers */}
//             <div className="flex justify-between mt-4 px-4">
//               {Object.keys(rows).map((rowNumber) => (
//                 <div key={`row-${rowNumber}`} className="text-xs text-gray-500 w-8 text-center">
//                   {rowNumber}
//                 </div>
//               ))}
//             </div>
//           </div>
          
//           {/* Wagon Facilities Icons */}
//           <div className="flex justify-center space-x-4 mt-4">
//             {foundWagon.facilities.map((facility, index) => (
//               <div key={index} className="flex items-center space-x-1 text-sm text-gray-600">
//                 {facility === 'AC' && '❄️'}
//                 {facility === 'Toilet' && '🚽'}
//                 {facility === 'Power Outlet' && '🔌'}
//                 {facility === 'WiFi' && '📶'}
//                 {facility === 'Food Service' && '🍱'}
//                 {facility === 'Luggage Rack' && '🧳'}
//                 <span>{facility}</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const renderWagonSelector = () => {
//     return (
//       <div className="mb-6 bg-white rounded-xl shadow-lg p-4">
//         <div className="flex items-center justify-between mb-4">
//           <div>
//             <h4 className="text-lg font-bold text-gray-800">Pilih Gerbong</h4>
//             <p className="text-sm text-gray-600">
//               {selectedSeats.length} dari {maxSeats} kursi terpilih
//             </p>
//           </div>
          
//           <div className="flex space-x-2">
//             <select
//               value={selectedClass}
//               onChange={(e) => setSelectedClass(e.target.value)}
//               className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="all">Semua Kelas</option>
//               <option value="executive">Eksekutif</option>
//               <option value="business">Bisnis</option>
//               <option value="economy">Ekonomi</option>
//             </select>
            
//             <select
//               value={selectedWagon}
//               onChange={(e) => setSelectedWagon(e.target.value)}
//               className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               {filteredWagons.map((wagon: Wagon) => (
//                 <option key={wagon.number} value={wagon.number}>
//                   {wagon.name} - {wagon.class}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>
        
//         {/* Wagon Tabs */}
//         <div className="flex space-x-2 overflow-x-auto pb-2">
//           {filteredWagons.map((wagon: Wagon) => (
//             <button
//               key={wagon.number}
//               onClick={() => setSelectedWagon(wagon.number)}
//               className={`flex-shrink-0 px-4 py-2 rounded-lg border transition-colors ${
//                 selectedWagon === wagon.number
//                   ? 'bg-blue-500 text-white border-blue-500'
//                   : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
//               }`}
//             >
//               <div className="text-center">
//                 <div className="font-medium">{wagon.name}</div>
//                 <div className="text-xs capitalize">{wagon.class}</div>
//               </div>
//             </button>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   const renderTrainDiagram = () => {
//     if (train.wagons.length === 0) {
//       return (
//         <div className="mb-8 text-center text-gray-500">
//           Tidak ada gerbong tersedia
//         </div>
//       );
//     }

//     return (
//       <div className="mb-8">
//         <div className="flex items-center justify-center space-x-2 mb-4 overflow-x-auto pb-2">
//           {/* Lokomotif Depan */}
//           <div className="w-16 h-10 bg-red-500 rounded-l-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
//             LOKO
//           </div>
          
//           {/* Gerbong */}
//           {train.wagons.map((wagon: Wagon) => (
//             <button
//               key={wagon.number}
//               onClick={() => setSelectedWagon(wagon.number)}
//               className={`w-20 h-12 rounded flex flex-col items-center justify-center border-2 transition-all flex-shrink-0 ${
//                 selectedWagon === wagon.number
//                   ? 'border-blue-500 bg-blue-50 scale-105'
//                   : 'border-gray-300 bg-white hover:border-gray-400'
//               }`}
//             >
//               <span className="text-xs font-medium">{wagon.name}</span>
//               <span className="text-xs text-gray-500">
//                 {wagon.availableSeats}/{wagon.totalSeats}
//               </span>
//               <div className={`w-3 h-3 rounded-full mt-1 ${
//                 wagon.class === 'executive' ? 'bg-blue-500' :
//                 wagon.class === 'business' ? 'bg-purple-500' :
//                 'bg-gray-500'
//               }`}></div>
//             </button>
//           ))}
          
//           {/* Lokomotif Belakang (jika ada) */}
//           <div className="w-16 h-10 bg-red-500 rounded-r-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
//             LOKO
//           </div>
//         </div>
        
//         <div className="text-center text-sm text-gray-600">
//           Klik pada gerbong untuk melihat kursi yang tersedia
//         </div>
//       </div>
//     );
//   };

//   if (train.wagons.length === 0) {
//     return (
//       <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
//         <h3 className="text-2xl font-bold text-gray-800 mb-4">Tidak Ada Kursi Tersedia</h3>
//         <p className="text-gray-600 mb-4">
//           Maaf, tidak ada gerbong atau kursi yang tersedia untuk kereta ini.
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full max-w-6xl mx-auto">
//       {/* Header */}
//       <div className="text-center mb-8">
//         <h3 className="text-2xl font-bold text-gray-800">Pilih Kursi Kereta Api</h3>
//         <p className="text-gray-600">
//           {train.operator} - {train.trainNumber} • {train.trainName}
//         </p>
//         <div className="mt-2 text-sm text-gray-500">
//           {train.originStation} → {train.destinationStation}
//         </div>
//       </div>

//       {/* Train Diagram */}
//       {renderTrainDiagram()}

//       {/* Wagon Selector */}
//       {renderWagonSelector()}

//       {/* Selected Wagon */}
//       {selectedWagon && renderWagon(selectedWagon)}

//       {/* Legend */}
//       <div className="mt-8 p-6 bg-white rounded-xl shadow-lg">
//         <h4 className="font-semibold text-lg mb-4 text-gray-800">Keterangan Kursi:</h4>
//         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
//           <div className="flex flex-col items-center space-y-1">
//             <div className="w-12 h-12 bg-green-500 border-2 border-green-600 rounded-lg flex items-center justify-center text-white font-bold">
//               A1
//             </div>
//             <span className="text-center">Terpilih</span>
//           </div>
//           <div className="flex flex-col items-center space-y-1">
//             <div className="w-12 h-12 bg-gray-300 border-2 border-gray-400 rounded-lg flex items-center justify-center text-gray-500 font-bold">
//               A2
//             </div>
//             <span className="text-center">Tidak Tersedia</span>
//           </div>
//           <div className="flex flex-col items-center space-y-1">
//             <div className="w-12 h-12 bg-blue-100 border-2 border-blue-300 rounded-lg flex items-center justify-center text-blue-700 font-bold">
//               A3
//             </div>
//             <span className="text-center">Kursi Jendela</span>
//           </div>
//           <div className="flex flex-col items-center space-y-1">
//             <div className="w-12 h-12 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-center justify-center text-blue-600 font-bold">
//               B1
//             </div>
//             <span className="text-center">Kursi Lorong</span>
//           </div>
//           <div className="flex flex-col items-center space-y-1">
//             <div className="w-12 h-12 bg-purple-100 border-2 border-purple-300 rounded-lg flex items-center justify-center text-purple-700 font-bold">
//               C1
//             </div>
//             <span className="text-center">Kelas Bisnis</span>
//           </div>
//           <div className="flex flex-col items-center space-y-1">
//             <div className="w-12 h-12 bg-gray-100 border-2 border-gray-300 rounded-lg flex items-center justify-center text-gray-700 font-bold">
//               D1
//             </div>
//             <span className="text-center">Kelas Ekonomi</span>
//           </div>
//         </div>
        
//         {/* Additional Info */}
//         <div className="mt-6 pt-6 border-t border-gray-200">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
//             <div>
//               <h5 className="font-medium text-gray-800 mb-2">Catatan Penting:</h5>
//               <ul className="list-disc list-inside space-y-1">
//                 <li>Kursi yang menghadap depan ditandai dengan panah ↗</li>
//                 <li>Kursi jendela memiliki view lebih baik</li>
//                 <li>Kursi lorong memudahkan akses ke toilet</li>
//                 <li>Maksimal {maxSeats} kursi yang dapat dipilih</li>
//               </ul>
//             </div>
//             <div>
//               <h5 className="font-medium text-gray-800 mb-2">Fasilitas Gerbong:</h5>
//               <ul className="list-disc list-inside space-y-1">
//                 <li>❄️ AC: Pendingin ruangan</li>
//                 <li>🚽 Toilet: Tersedia di setiap gerbong</li>
//                 <li>🔌 Power Outlet: Charger per kursi</li>
//                 <li>📶 WiFi: Internet gratis</li>
//                 <li>🍱 Food Service: Makanan tersedia</li>
//               </ul>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Komponen Seat Button Terpisah
// interface SeatButtonProps {
//   seat: Seat;
//   wagon: Wagon;
//   isSelected: boolean;
//   onSelect: (seat: Seat) => void;
//   onDeselect: (seatId: string) => void;
//   getSeatColor: (seat: Seat, wagonClass: string) => string;
//   getSeatPrice: (seat: Seat, wagonClass: string) => number;
//   hoveredSeat: string | null;
//   setHoveredSeat: (seatId: string | null) => void;
//   selectedSeatsCount: number;
//   maxSeats: number;
// }

// const SeatButton: React.FC<SeatButtonProps> = ({
//   seat,
//   wagon,
//   isSelected,
//   onSelect,
//   onDeselect,
//   getSeatColor,
//   getSeatPrice,
//   hoveredSeat,
//   setHoveredSeat,
//   selectedSeatsCount,
//   maxSeats,
// }) => {
//   const seatPrice = getSeatPrice(seat, wagon.class);
  
//   const handleClick = () => {
//     if (!seat.available) return;
    
//     if (isSelected) {
//       onDeselect(seat.id);
//     } else {
//       if (selectedSeatsCount >= maxSeats) {
//         alert(`Maksimal ${maxSeats} kursi yang dapat dipilih`);
//         return;
//       }
//       onSelect({ 
//         ...seat, 
//         price: seatPrice,
//         wagonNumber: wagon.number,
//         wagonClass: wagon.class
//       });
//     }
//   };

//   return (
//     <button
//       className={`w-12 h-12 border-2 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all ${
//         getSeatColor(seat, wagon.class)
//       } ${hoveredSeat === seat.id ? 'ring-2 ring-yellow-400' : ''} ${
//         !seat.available ? 'cursor-not-allowed' : 'hover:scale-105'
//       }`}
//       onClick={handleClick}
//       onMouseEnter={() => setHoveredSeat(seat.id)}
//       onMouseLeave={() => setHoveredSeat(null)}
//       disabled={!seat.available}
//       title={`${seat.column}${seat.row} - ${wagon.class} - Rp ${seatPrice.toLocaleString()} ${
//         seat.windowSeat ? '(Jendela)' : '(Lorong)'
//       } ${seat.forwardFacing ? '↗ Menghadap depan' : ''}`}
//     >
//       <div className="font-bold">{seat.column}{seat.row}</div>
//       {seat.forwardFacing && <div className="text-xs">↗</div>}
//       {seat.windowSeat && <div className="text-xs">🪟</div>}
//     </button>
//   );
// };