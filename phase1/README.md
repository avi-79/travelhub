# TravelHub Phase 1

Standalone travel accommodation/booking learning project. It is inspired by the travel business domain only; it is not TUI software and contains no TUI code, data or internal design.

## Components
- Accommodation Service (Spring Boot, 8081): catalogue and room inventory.
- Booking Service (Spring Boot, 8082): create/list/get/cancel bookings.
- API Gateway (Spring Boot, 8080): public API and simple web page.
- PostgreSQL 16: separate database per service. Flyway creates tables.

## Requirements
JDK 21, Maven 3.9+, Docker with Compose. Check `java -version`, `mvn -version`, `docker compose version`.

## Start database
From this directory: `docker compose up -d postgres` then `docker compose ps`. Wait until healthy. Local lab credentials: `traveluser` / `travelpass`; do not use outside this machine.

## Build
`mvn clean package`

## Run (three terminals from project root)
1. `mvn -pl accommodation-service spring-boot:run`
2. `mvn -pl booking-service spring-boot:run`
3. `mvn -pl api-gateway spring-boot:run`
Open http://localhost:8080/. Health: `/actuator/health` on ports 8080, 8081 and 8082.

## APIs via gateway
- `GET /api/accommodations`
- `GET /api/accommodations?destination=Spain`
- `GET /api/bookings`
- `POST /api/bookings` JSON: `{"accommodationId":1001,"guestName":"Alex Morgan","checkIn":"2027-05-10","checkOut":"2027-05-14","rooms":2}`
- `GET /api/bookings/{reference}`
- `POST /api/bookings/{reference}/cancel`

Example search: `curl -i 'http://localhost:8080/api/accommodations?destination=Spain'`
Example booking: `curl -i -X POST http://localhost:8080/api/bookings -H 'Content-Type: application/json' -d '{"accommodationId":1001,"guestName":"Alex Morgan","checkIn":"2027-05-10","checkOut":"2027-05-14","rooms":2}'`

## Data verification
`docker compose exec postgres psql -U traveluser -d travel_accommodation -c 'select * from accommodations;'`
`docker compose exec postgres psql -U traveluser -d travel_booking -c 'select * from bookings;'`

## Design explanation
The gateway is the browser-facing entry point. It forwards requests to the owning service. Accommodation Service owns its catalogue and inventory database; Booking Service owns booking records. Booking Service calls the inventory API; it never queries the other service's database directly. Inventory is decremented with a conditional SQL update (`rooms_available >= requested`) so concurrent requests cannot drive the count below zero.

Booking workflow: validate dates and guest fields -> reserve inventory through Accommodation Service -> persist booking -> return reference. Cancellation releases inventory and changes status. This is an educational distributed workflow, not a complete production saga: a crash/network failure across services can require reconciliation. Production hardening (idempotency, durable outbox/saga, retries, auth, audit, monitoring) comes later.

## Troubleshooting
- DB not ready: `docker compose ps`, `docker compose logs postgres`, `docker compose exec postgres pg_isready -U traveluser`.
- DB missing/credentials: check `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`. Init scripts run only on an empty volume. For disposable lab data only, `docker compose down -v` then `docker compose up -d postgres` (this deletes DB data).
- Port conflict: Linux `ss -lntp | grep -E '8080|8081|8082|5432'`; Windows `netstat -ano | findstr "8080 8081 8082 5432"`.
- Gateway 502: check backend health on 8081/8082 and configured service URLs.
- Booking 409: insufficient room stock or booking already cancelled.
- Flyway failure: inspect first SQL error in service logs; do not modify an already-applied migration.

No authentication, payment processing or public deployment is included. Do not expose this demo to the internet. AWS/EKS, Dockerfiles, Kubernetes, Helm, Ingress, OpenLens, Jenkins and Argo CD are later stages.
