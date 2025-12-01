import { io, Socket } from 'socket.io-client';

class RealtimeService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect() {
    if (this.socket) return;

    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to realtime server');
      this.emit('user_connected', { userId: 'user123' });
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from realtime server');
    });

    // Set up internal handlers that will notify all registered listeners
    this.socket.on('seat_status_update', (data: any) => {
      this.notifyListeners('seat_status_update', data);
    });

    this.socket.on('flight_status_update', (data: any) => {
      this.notifyListeners('flight_status_update', data);
    });

    this.socket.on('price_update', (data: any) => {
      this.notifyListeners('price_update', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  emit(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
      
      // Clean up empty arrays
      if (eventListeners.length === 0) {
        this.listeners.delete(event);
      }
    }
  }

  offAll(event: string) {
    this.listeners.delete(event);
  }

  private notifyListeners(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      // Create a copy to avoid issues if callbacks are removed during execution
      eventListeners.slice().forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Specific methods for our app
  subscribeToFlight(flightId: string) {
    this.emit('subscribe_flight', { flightId });
  }

  unsubscribeFromFlight(flightId: string) {
    this.emit('unsubscribe_flight', { flightId });
  }

  subscribeToSeats(flightId: string, seatIds: string[]) {
    this.emit('subscribe_seats', { flightId, seatIds });
  }
}

export const realtimeService = new RealtimeService();