CREATE TABLE bookings (reference VARCHAR(36) PRIMARY KEY,accommodation_id BIGINT NOT NULL,guest_name VARCHAR(120) NOT NULL,check_in DATE NOT NULL,check_out DATE NOT NULL,rooms INTEGER NOT NULL CHECK(rooms>0),status VARCHAR(20) NOT NULL,created_at TIMESTAMP WITH TIME ZONE NOT NULL,CHECK(check_out>check_in));
CREATE INDEX idx_bookings_created_at ON bookings(created_at);
