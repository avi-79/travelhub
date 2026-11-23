package com.travelhub.booking;
import java.time.*; import jakarta.persistence.*;
@Entity @Table(name="bookings") public class Booking {
 @Id @Column(length=36) private String reference; @Column(nullable=false) private Long accommodationId; @Column(nullable=false) private String guestName; @Column(nullable=false) private LocalDate checkIn; @Column(nullable=false) private LocalDate checkOut; @Column(nullable=false) private int rooms; @Column(nullable=false) private String status; @Column(nullable=false) private Instant createdAt;
 protected Booking(){}
 public Booking(String ref,Long id,String guest,LocalDate in,LocalDate out,int rooms){this.reference=ref;this.accommodationId=id;this.guestName=guest;this.checkIn=in;this.checkOut=out;this.rooms=rooms;this.status="CONFIRMED";this.createdAt=Instant.now();}
 public String getReference(){return reference;} public Long getAccommodationId(){return accommodationId;} public String getGuestName(){return guestName;} public LocalDate getCheckIn(){return checkIn;} public LocalDate getCheckOut(){return checkOut;} public int getRooms(){return rooms;} public String getStatus(){return status;} public Instant getCreatedAt(){return createdAt;} public void cancel(){status="CANCELLED";}
}
