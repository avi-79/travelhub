# Holidays — Phase 1

**Holidays** is a TUI-inspired holiday accommodation discovery and booking application. Developed by Avinesh. It uses original branding and implementation, with React, Spring Boot microservices and PostgreSQL.

A full-stack travel accommodation and booking learning application built with React, Spring Boot microservices and PostgreSQL. The frontend talks only to the API Gateway; each business service owns its own database.

## Architecture

```text
Browser :3000 (React/Vite)
   | /api/*
   v
Nginx frontend container
   |
   v
API Gateway :8080
   |----------------------------|
   v                            v
Accommodation Service :8081   Booking Service :8082
   |                            |  reserve/release inventory over HTTP
   v                            v
accommodation_db              booking_db
           PostgreSQL 16 :5432
```

## Features

- Responsive Holidays accommodation discovery UI with original TUI-inspired styling.
- Live accommodation catalogue and destination search from PostgreSQL.
- Sort stays by nightly rate or available inventory.
- Create a booking with guest name, check-in, check-out and room count.
- Booking Service validates dates and reserves inventory through Accommodation Service.
- View booking references and statuses.
- Cancel a confirmed booking; inventory is released by the backend.
- Flyway-managed schemas and sample accommodation data.
- Docker Compose deployment with an Nginx frontend reverse proxy.

## Requirements

- Docker Engine and Docker Compose v2 (recommended)
- For local development: Node.js 20+, JDK 21 and Maven 3.9+

## Run the complete application

From this directory:

```bash
docker compose up --build
```

Open **http://localhost:3000**. API Gateway is available at http://localhost:8080 and PostgreSQL at localhost:5432.

Useful commands:

```bash
docker compose ps
docker compose logs -f frontend api-gateway accommodation-service booking-service
docker compose down
```

The PostgreSQL data is stored in the `travelhub-postgres-data` named volume. To reset this disposable learning database and rerun initialization from scratch:

```bash
docker compose down -v
docker compose up --build
```

**Warning:** `docker compose down -v` permanently deletes the local database volume and all bookings in it.

## Local development

Start PostgreSQL and the backend containers:

```bash
docker compose up -d postgres accommodation-service booking-service api-gateway
```

Then in a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` calls to the API Gateway on port 8080.

Build the frontend:

```bash
cd frontend
npm install
npm run build
```

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/accommodations` | List accommodations |
| GET | `/api/accommodations?destination=Spain` | Filter by destination |
| GET | `/api/accommodations/{id}` | Accommodation details |
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings` | List bookings |
| GET | `/api/bookings/{reference}` | Booking details |
| POST | `/api/bookings/{reference}/cancel` | Cancel booking |

Example booking request:

```json
{
  "accommodationId": 1001,
  "guestName": "Alex Morgan",
  "checkIn": "2027-05-10",
  "checkOut": "2027-05-14",
  "rooms": 2
}
```

## Database ownership

- `accommodation_db` is owned by Accommodation Service.
- `booking_db` is owned by Booking Service.
- Booking Service never queries the accommodation database directly. It calls the inventory API to reserve/release rooms.

## Scope and production considerations

This is a learning application, not a production-ready travel marketplace. It currently does not implement user authentication, payment processing, date-specific inventory, price snapshots, idempotency keys, durable saga/outbox processing, or production secrets management. Do not expose it publicly or use it for real customer bookings. These are suitable follow-on engineering milestones.

Kubernetes, Helm, Ingress, OpenLens, Jenkins, Argo CD and monitoring are planned for subsequent DevOps phases.