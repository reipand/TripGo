# TripGo API Documentation

## Overview
TripGo API provides comprehensive flight search and booking functionality with advanced filtering, comparison, and analytics features.

## Base URL
```
/api
```

## Authentication
Most endpoints require user authentication. Include user session in requests.

---

## Flight Search API

### GET /api/search/flights

Search for flights with advanced filtering and sorting options.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `origin` | string | Yes | - | Origin city/airport name |
| `destination` | string | Yes | - | Destination city/airport name |
| `departureDate` | string | Yes | - | Departure date (YYYY-MM-DD) |
| `returnDate` | string | No | - | Return date for round trips |
| `passengers` | string | No | "1" | Number of passengers |
| `sortBy` | string | No | "price" | Sort by: price, departure, duration |
| `sortOrder` | string | No | "asc" | Sort order: asc, desc |
| `page` | number | No | 1 | Page number for pagination |
| `limit` | number | No | 20 | Results per page |
| `minPrice` | number | No | - | Minimum price filter |
| `maxPrice` | number | No | - | Maximum price filter |
| `airline` | string | No | - | Filter by airline name |
| `timeOfDay` | string | No | - | Filter by time: morning, afternoon, evening, night |

#### Example Request
```bash
GET /api/search/flights?origin=Jakarta&destination=Bali&departureDate=2024-01-15&sortBy=price&sortOrder=asc&limit=10
```

#### Response Format
```json
{
  "success": true,
  "data": [
    {
      "id": "flight_123",
      "waktu_berangkat": "2024-01-15T08:30:00",
      "waktu_tiba": "2024-01-15T10:00:00",
      "harga": 1500000,
      "kursi_tersedia": 45,
      "duration": "1j 30m",
      "stops": 0,
      "transportasi": {
        "nama": "Garuda Indonesia",
        "tipe": "Pesawat",
        "logo": "https://example.com/garuda-logo.png"
      },
      "origin": {
        "name": "Jakarta",
        "code": "CGK"
      },
      "destination": {
        "name": "Bali",
        "code": "DPS"
      },
      "aircraft_type": "Boeing 737",
      "baggage_allowance": "20kg",
      "meal_included": true,
      "wifi_available": true,
      "entertainment": true
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

---

## Airlines API

### GET /api/airlines

Get list of all available airlines.

#### Response Format
```json
{
  "success": true,
  "data": [
    {
      "name": "Garuda Indonesia",
      "code": "GA",
      "logo_url": "https://example.com/garuda-logo.png",
      "country": "Indonesia",
      "fleet_size": 142,
      "founded_year": 1949,
      "hub_airports": ["CGK", "DPS", "SUB"]
    }
  ]
}
```

---

## Airports API

### GET /api/airports

Search for airports with autocomplete functionality.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | No | - | Search query for airport name/code/city |
| `limit` | number | No | 10 | Maximum results to return |

#### Example Request
```bash
GET /api/airports?q=jakarta&limit=5
```

#### Response Format
```json
{
  "success": true,
  "data": [
    {
      "name": "Soekarno-Hatta International Airport",
      "code": "CGK",
      "city": "Jakarta",
      "country": "Indonesia",
      "timezone": "Asia/Jakarta",
      "coordinates": {
        "latitude": -6.1256,
        "longitude": 106.6558
      }
    }
  ]
}
```

---

## Price Alerts API

### POST /api/flights/price-alerts

Create a new price alert for a specific route.

#### Request Body
```json
{
  "origin": "Jakarta",
  "destination": "Bali",
  "target_price": 1000000,
  "user_id": "user_123"
}
```

#### Response Format
```json
{
  "success": true,
  "data": {
    "id": "alert_123",
    "origin": "Jakarta",
    "destination": "Bali",
    "target_price": 1000000,
    "current_price": 1500000,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### GET /api/flights/price-alerts

Get all price alerts for a user.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | Yes | User ID to get alerts for |

---

## Flight Trends API

### GET /api/flights/trends

Get flight price trends and analytics for a specific route.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `origin` | string | Yes | - | Origin city/airport |
| `destination` | string | Yes | - | Destination city/airport |
| `days` | number | No | 30 | Number of days to analyze |

#### Example Request
```bash
GET /api/flights/trends?origin=Jakarta&destination=Bali&days=30
```

#### Response Format
```json
{
  "success": true,
  "data": {
    "route": "Jakarta → Bali",
    "average_price": 1200000,
    "price_trend": "increasing",
    "cheapest_price": 800000,
    "most_expensive_price": 2000000,
    "flight_count": 150,
    "popular_times": [
      { "hour": 8, "count": 25 },
      { "hour": 14, "count": 20 },
      { "hour": 18, "count": 15 }
    ],
    "popular_airlines": [
      {
        "name": "Garuda Indonesia",
        "count": 60,
        "average_price": 1300000
      },
      {
        "name": "Lion Air",
        "count": 45,
        "average_price": 900000
      }
    ]
  }
}
```

---

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (authentication required)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

---

## Rate Limiting

- **Search endpoints**: 100 requests per minute per IP
- **Data endpoints**: 50 requests per minute per IP
- **Alert endpoints**: 10 requests per minute per user

---

## Caching

- Flight search results are cached for 5 minutes
- Airport and airline data are cached for 1 hour
- Price trends are cached for 30 minutes

---

## Webhooks

### Price Alert Notifications

When a price alert is triggered, a webhook is sent to the user's registered endpoint:

```json
{
  "event": "price_alert_triggered",
  "data": {
    "alert_id": "alert_123",
    "origin": "Jakarta",
    "destination": "Bali",
    "target_price": 1000000,
    "current_price": 950000,
    "savings": 50000
  }
}
```
