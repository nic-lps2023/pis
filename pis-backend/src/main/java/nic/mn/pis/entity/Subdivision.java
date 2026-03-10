package nic.mn.pis.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "subdivision")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Subdivision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "subdivision_id")
    private Long subdivisionId;

    @Column(name = "subdivision_name", nullable = false, length = 255)
    private String subdivisionName;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "district_id", nullable = false, referencedColumnName = "district_id")
    private District district;
}
