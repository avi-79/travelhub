package com.travelhub.booking;
import java.time.LocalDate; import java.util.*; import jakarta.validation.Valid; import jakarta.validation.constraints.*; import org.springframework.http.*; import org.springframework.web.bind.annotation.*; import org.springframework.web.client.RestClientResponseException; import org.springframework.web.server.ResponseStatusException;
@RestController @RequestMapping("/api/bookings") public class BookingController {
 private final BookingRepository repo; private final InventoryClient inventory; public BookingController(BookingRepository r,InventoryClient i){repo=r;inventory=i;}
 public record CreateBookingRequest(@NotNull Long accommodationId,@NotBlank @Size(max=120) String guestName,@NotNull LocalDate checkIn,@NotNull LocalDate checkOut,@Min(1) @Max(10) int rooms){}
 @GetMapping public List<Booking> list(){return repo.findAll();}
 @GetMapping("/{reference}") public Booking get(@PathVariable String reference){return repo.findById(reference).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Booking not found"));}
 @PostMapping public ResponseEntity<Booking> create(@Valid @RequestBody CreateBookingRequest r){
  if(!r.checkOut().isAfter(r.checkIn()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Check-out must be after check-in");
  String ref=UUID.randomUUID().toString();
  try{inventory.reserve(r.accommodationId(),r.rooms());}catch(RestClientResponseException e){throw new ResponseStatusException(HttpStatusCode.valueOf(e.getStatusCode().value()),"Inventory reservation failed: "+e.getStatusText());}
  try{return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(new Booking(ref,r.accommodationId(),r.guestName(),r.checkIn(),r.checkOut(),r.rooms())));}catch(RuntimeException e){try{inventory.release(r.accommodationId(),r.rooms());}catch(RuntimeException ignored){}throw e;}
 }
 @PostMapping("/{reference}/cancel") public Booking cancel(@PathVariable String reference){Booking b=get(reference);if("CANCELLED".equals(b.getStatus()))throw new ResponseStatusException(HttpStatus.CONFLICT,"Booking is already cancelled");inventory.release(b.getAccommodationId(),b.getRooms());b.cancel();return repo.save(b);}
}
