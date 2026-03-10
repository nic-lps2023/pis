package nic.mn.pis.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "authority_action_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthorityActionHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long historyId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private PermitApplication permitApplication;

    @Column(nullable = false, length = 50)
    private String authorityRole;

    @Column(nullable = false, length = 120)
    private String actionType;

    @Column(length = 4000)
    private String message;

    @Column(length = 80)
    private String previousStage;

    @Column(length = 80)
    private String newStage;

    @Column(length = 80)
    private String previousStatus;

    @Column(length = 80)
    private String newStatus;

    @Column(nullable = false)
    private LocalDateTime actionAt;
}
