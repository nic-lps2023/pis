package nic.mn.pis.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthorityActionHistoryDto {
    private Long historyId;
    private String authorityRole;
    private String actionType;
    private String message;
    private String previousStage;
    private String newStage;
    private String previousStatus;
    private String newStatus;
    private LocalDateTime actionAt;
}
