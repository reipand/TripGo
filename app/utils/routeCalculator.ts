// utils/routeCalculator.ts


export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius bumi dalam km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance);
}

export function calculateFlightTime(distanceKm: number): {
  hours: number;
  minutes: number;
  totalHours: number;
} {

  const averageSpeed = 850; // km/jam
  const totalHours = distanceKm / averageSpeed;
  
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);
  
  return {
    hours,
    minutes,
    totalHours
  };
}

export function getTimeZone(longitude: number): string {
  // Indonesia memiliki 3 zona waktu:
  // WIB (UTC+7): 105°E - 120°E (Sumatra, Java, Kalimantan Barat/Tengah)
  // WITA (UTC+8): 120°E - 135°E (Kalimantan Timur/Selatan, Sulawesi, Bali, Nusa Tenggara)
  // WIT (UTC+9): 135°E - 150°E (Maluku, Papua)
  
  if (longitude >= 105 && longitude < 120) {
    return 'WIB';
  } else if (longitude >= 120 && longitude < 135) {
    return 'WITA';
  } else if (longitude >= 135) {
    return 'WIT';
  } else {
    return 'WIB';
  }
}


export function getRouteInfo(
  originLat: number,
  originLon: number,
  destLat: number,
  destLon: number,
  flightCount?: number
) {
  const distance = calculateDistance(originLat, originLon, destLat, destLon);
  const flightTime = calculateFlightTime(distance);
  const originTimezone = getTimeZone(originLon);
  const destTimezone = getTimeZone(destLon);
  
  // Tentukan apakah ada perubahan zona waktu
  const timezoneChange = originTimezone !== destTimezone;
  
  return {
    distance,
    flightTime,
    originTimezone,
    destTimezone,
    timezoneChange,
    timezoneInfo: timezoneChange ? 
      `${originTimezone} → ${destTimezone}` : 
      originTimezone,
    // Estimasi CO2 emissions (rata-rata 115g CO2 per km per penumpang)
    co2Emissions: Math.round(distance * 0.115),
    // Estimasi konsumsi bahan bakar (rata-rata 3.5L per km)
    fuelConsumption: Math.round(distance * 3.5),
    // Informasi tambahan berdasarkan jumlah penerbangan
    availableFlights: flightCount || 0
  };
}