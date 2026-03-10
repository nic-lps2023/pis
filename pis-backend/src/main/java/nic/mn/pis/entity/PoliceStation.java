package nic.mn.pis.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "police_station")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PoliceStation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "police_station_id")
    private Long policeStationId;

    @Column(name = "police_station_name", nullable = false, length = 255)
    private String policeStationName;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subdivision_id", nullable = false, referencedColumnName = "subdivision_id")
    @JsonIgnoreProperties({"district", "hibernateLazyInitializer", "handler"})
    private Subdivision subdivision;
}
