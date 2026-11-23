package com.travelhub.accommodation;
import java.util.List; import jakarta.validation.Valid; import jakarta.validation.constraints.Min; import org.springframework.http.*; import org.springframework.web.bind.annotation.*; import org.springframework.web.server.ResponseStatusException;
@RestController @RequestMapping("/api/accommodations") public class AccommodationController {
 private final AccommodationRepository repo; public AccommodationController(AccommodationRepository repo){this.repo=repo;}
 @GetMapping public List<Accommodation> list(@RequestParam(required=false) String destination){return destination==null||destination.isBlank()?repo.findAll():repo.findByDestinationIgnoreCase(destination);}
 @GetMapping("/{id}") public Accommodation get(@PathVariable Long id){return repo.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Accommodation not found"));}
 public record InventoryRequest(@Min(1) int rooms){}
 @PostMapping("/{id}/reserve") public ResponseEntity<Void> reserve(@PathVariable Long id,@Valid @RequestBody InventoryRequest r){if(repo.reserve(id,r.rooms())==0){if(!repo.existsById(id))throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Accommodation not found");throw new ResponseStatusException(HttpStatus.CONFLICT,"Insufficient rooms available");}return ResponseEntity.noContent().build();}
 @PostMapping("/{id}/release") public ResponseEntity<Void> release(@PathVariable Long id,@Valid @RequestBody InventoryRequest r){if(repo.release(id,r.rooms())==0)throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Accommodation not found");return ResponseEntity.noContent().build();}
}
