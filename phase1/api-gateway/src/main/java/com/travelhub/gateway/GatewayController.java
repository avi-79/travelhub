package com.travelhub.gateway;
import java.util.Map; import org.springframework.beans.factory.annotation.Value; import org.springframework.http.*; import org.springframework.web.bind.annotation.*; import org.springframework.web.client.RestClient;
@RestController public class GatewayController {
 private final RestClient accommodation,booking;
 public GatewayController(RestClient.Builder b,@Value("${ACCOMMODATION_SERVICE_URL:http://localhost:8081}") String a,@Value("${BOOKING_SERVICE_URL:http://localhost:8082}") String k){accommodation=b.clone().baseUrl(a).build();booking=b.clone().baseUrl(k).build();}
 @GetMapping("/api") public Map<String,String> home(){return Map.of("application","TravelHub","message","Travel booking API is running","accommodations","/api/accommodations","bookings","/api/bookings");}
 @GetMapping("/api/accommodations") public ResponseEntity<String> accommodations(@RequestParam(required=false) String destination){return forward(accommodation.get().uri(u->{var x=u.path("/api/accommodations");if(destination!=null)x.queryParam("destination",destination);return x.build();}));}
 @GetMapping("/api/accommodations/{id}") public ResponseEntity<String> accommodation(@PathVariable Long id){return forward(accommodation.get().uri("/api/accommodations/{id}",id));}
 @PostMapping("/api/bookings") public ResponseEntity<String> create(@RequestBody String body){return forward(booking.post().uri("/api/bookings").contentType(MediaType.APPLICATION_JSON).body(body));}
 @GetMapping("/api/bookings") public ResponseEntity<String> bookings(){return forward(booking.get().uri("/api/bookings"));}
 @GetMapping("/api/bookings/{reference}") public ResponseEntity<String> booking(@PathVariable String reference){return forward(booking.get().uri("/api/bookings/{reference}",reference));}
 @PostMapping("/api/bookings/{reference}/cancel") public ResponseEntity<String> cancel(@PathVariable String reference){return forward(booking.post().uri("/api/bookings/{reference}/cancel",reference));}
 private ResponseEntity<String> forward(RestClient.RequestHeadersSpec<?> req){try{return req.retrieve().toEntity(String.class);}catch(org.springframework.web.client.RestClientResponseException e){return ResponseEntity.status(e.getStatusCode()).contentType(MediaType.APPLICATION_JSON).body(e.getResponseBodyAsString());}}
}
