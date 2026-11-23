# TravelHub — Phase 1: Spring Boot microservices

Phase 1 is a local learning project with an API Gateway, Accommodation Service, Booking Service and PostgreSQL. Each business service owns its own database. The gateway routes client requests; Booking Service calls the Accommodation Service inventory API rather than accessing its database directly.

## Architecture

```text
Client -> API Gateway :8080 -> Accommodation Service :8081 -> accommodation_db
                           -> Booking Service :8082 -> booking_db
                                            |-- HTTP reserve/release --> Accommodation Service
PostgreSQL :5432 (two separate databases)
```

## Requirements
- JDK 21
- Maven 3.9+
- Docker Engine and Docker Compose v2

## Start the full application
From this directory:

```bash
docker compose up --build
```

The first startup creates both databases; Flyway creates the tables and sample accommodation records. Endpoints:
- Gateway: http://localhost:8080
- Accommodations: http://localhost:8080/api/accommodations
- Health: http://localhost:8080/actuator/health (also available on ports 8081 and 8082)

Create a sample booking:

```bash
curl -X POST http://localhost:8080/api/bookings \\
  -H 'Content-Type: application/json' \\
  -d '{"accommodationId":1001,"guestName":"Alex Morgan","checkIn":"2027-05-10","checkOut":"2027-05-14","rooms":2}'
```

Use `GET /api/bookings`, `GET /api/bookings/{reference}`, and `POST /api/bookings/{reference}/cancel`. Search destinations with `GET /api/accommodations?destination=Spain`.

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
- Inventory reservation uses a conditional SQL update, preventing concurrent requests from reserving more rooms than are available.
- Booking validates dates, reserves inventory, then persists the booking. If persistence fails, it attempts to compensate by releasing inventory.
- Cancellation releases inventory and marks the booking cancelled; a repeated cancellation returns HTTP 409.
- Flyway owns schema changes; Hibernate uses `ddl-auto: validate`.
- Actuator exposes health and info.

## Troubleshooting
- Check database startup: `docker compose logs postgres`; readiness: `docker compose exec postgres pg_isready -U traveluser`.
- Postgres initialization scripts run only when the data volume is first created.
- Reset this disposable lab database with `docker compose down -v` (this deletes the local database volume).
- If the gateway returns a 5xx response, inspect `docker compose logs accommodation-service booking-service api-gateway`.
- HTTP 409 when booking usually means insufficient inventory; cancellation conflicts if already cancelled.

## Scope and next phases
This is an educational starter, not a production booking platform. Authentication, payments, durable saga/outbox, idempotency keys, and production-grade retry handling are not included. Keep it local and do not expose it publicly. Kubernetes, Helm, Ingress, OpenLens, CI/CD and Argo CD are planned for later phases.
