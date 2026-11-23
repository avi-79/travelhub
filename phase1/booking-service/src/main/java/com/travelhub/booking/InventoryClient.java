package com.travelhub.booking;
import org.springframework.beans.factory.annotation.Value; import org.springframework.http.MediaType; import org.springframework.stereotype.Component; import org.springframework.web.client.RestClient;
@Component public class InventoryClient {
 private final RestClient client;
 public InventoryClient(RestClient.Builder builder,@Value("${ACCOMMODATION_SERVICE_URL:http://localhost:8081}") String url){client=builder.baseUrl(url).build();}
 public void reserve(Long id,int rooms){client.post().uri("/api/accommodations/{id}/reserve",id).contentType(MediaType.APPLICATION_JSON).body(new InventoryRequest(rooms)).retrieve().toBodilessEntity();}
 public void release(Long id,int rooms){client.post().uri("/api/accommodations/{id}/release",id).contentType(MediaType.APPLICATION_JSON).body(new InventoryRequest(rooms)).retrieve().toBodilessEntity();}
 private record InventoryRequest(int rooms){}
}
