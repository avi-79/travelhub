# TravelHub — Phase 1: Microservices travel booking website

TravelHub is a browser-based travel booking learning project built with HTML, CSS and JavaScript, backed by Spring Boot microservices and PostgreSQL.

## Architecture

```text
Browser (HTML / CSS / JavaScript)
              |
              v
       API Gateway :8080
          /         \
         v           v
Accommodation     Booking
Service :8081     Service :8082
      |                |
      v                v
accommodation_db   booking_db
          PostgreSQL :5432
```

The frontend is served by the API Gateway from Spring Boot static resources. The browser calls only the gateway on port 8080. The gateway forwards accommodation and booking requests to their respective services. Booking Service reserves/releases inventory through the Accommodation Service API; it never reads or writes the accommodation database directly.

## Features in the website
- Browse the accommodation catalogue and filter by destination.
- View room availability and nightly rates.
- Create a booking with guest name, check-in, check-out and room count.
- View saved bookings and cancel an active booking.
- Responsive layout for desktop and mobile.

The destination search currently filters the accommodation catalogue by destination. A separate Destination Service and source-city/route search are future enhancements, not part of this three-service Phase 1.

## Requirements
- JDK 21
- Maven 3.9+
- Docker Engine and Docker Compose v2

## Start the full application
From this directory:

```bash
docker compose up --build
```

Open the website:
- TravelHub website: http://localhost:8080/
- API Gateway health: http://localhost:8080/actuator/health
- Accommodation API through gateway: http://localhost:8080/api/accommodations
- Booking API through gateway: http://localhost:8080/api/bookings
- Service health: http://localhost:8081/actuator/health and http://localhost:8082/actuator/health

The first startup creates `accommodation_db` and `booking_db`. Flyway creates the tables and sample accommodation records.

## Create a sample booking using the API

```bash
curl -X POST http://localhost:8080/api/bookings \
  -H 'Content-Type: application/json' \
  -d '{"accommodationId":1001,"guestName":"Alex Morgan","checkIn":"2027-05-10","checkOut":"2027-05-14","rooms":2}'
```

## Run with Maven
Start PostgreSQL first using `docker compose up -d postgres`. Then run each command in a separate terminal from this directory:

```bash
mvn clean package
mvn -pl accommodation-service spring-boot:run
mvn -pl booking-service spring-boot:run
mvn -pl api-gateway spring-boot:run
```

## Implementation notes
- Accommodation Service owns catalogue and inventory; Booking Service owns bookings.
- Inventory reservation uses a conditional SQL update to prevent overbooking under concurrent requests.
- Booking validates dates, reserves inventory, then persists the booking. If persistence fails, it attempts to release inventory.
- Cancellation releases inventory and marks the booking cancelled; a repeated cancellation returns HTTP 409.
- Flyway owns schema changes; Hibernate uses `ddl-auto: validate`.
- Actuator exposes health and info endpoints.

## Troubleshooting
- Check database startup: `docker compose logs postgres`; readiness: `docker compose exec postgres pg_isready -U traveluser`.
- Postgres initialization scripts run only when the data volume is first created.
- Reset this disposable lab database with `docker compose down -v` (this deletes the local database volume).
- If the gateway returns a 5xx response, inspect `docker compose logs accommodation-service booking-service api-gateway`.
- HTTP 409 when booking usually means insufficient inventory; cancellation conflicts if already cancelled.
- If the page opens but cannot load stays, check that all three application containers are healthy and inspect gateway/service logs.

## Scope and next phases
This is an educational starter, not a production booking platform. Authentication, a separate Destination Service, Payment Service (simulated only), durable saga/outbox, idempotency keys and production-grade retry handling are not included in this phase. Kubernetes, Helm, Ingress, OpenLens, CI/CD and Argo CD are planned for later phases.
