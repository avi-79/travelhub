package com.travelhub.accommodation;
import java.util.List;
import org.springframework.data.jpa.repository.*; import org.springframework.data.repository.query.Param; import org.springframework.stereotype.Repository; import org.springframework.transaction.annotation.Transactional;
@Repository public interface AccommodationRepository extends JpaRepository<Accommodation,Long>{
 List<Accommodation> findByDestinationIgnoreCase(String destination);
 @Modifying @Transactional @Query(value="UPDATE accommodations SET rooms_available=rooms_available-:rooms WHERE id=:id AND rooms_available>=:rooms",nativeQuery=true) int reserve(@Param("id") Long id,@Param("rooms") int rooms);
 @Modifying @Transactional @Query(value="UPDATE accommodations SET rooms_available=rooms_available+:rooms WHERE id=:id",nativeQuery=true) int release(@Param("id") Long id,@Param("rooms") int rooms);
}
