package com.travelhub.accommodation;
import jakarta.persistence.*;
@Entity @Table(name="accommodations") public class Accommodation {
 @Id private Long id; private String name; private String destination;
 @Column(name="rooms_available",nullable=false) private int roomsAvailable; private int nightlyRate;
 protected Accommodation(){}
 public Long getId(){return id;} public String getName(){return name;} public String getDestination(){return destination;} public int getRoomsAvailable(){return roomsAvailable;} public int getNightlyRate(){return nightlyRate;}
}
