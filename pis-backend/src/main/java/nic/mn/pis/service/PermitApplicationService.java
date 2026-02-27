package nic.mn.pis.service;

import nic.mn.pis.dto.PermitApplicationDto;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface PermitApplicationService {

    // Create Permit Application
    PermitApplicationDto createApplication(PermitApplicationDto dto);

    // Create Permit Application with PDF Upload
    PermitApplicationDto createApplicationWithPdf(PermitApplicationDto dto, MultipartFile pdfFile) throws IOException;

    // Get All Applications (Admin/DC Use)
    List<PermitApplicationDto> getAllApplications();

    // Get Application By ID
    PermitApplicationDto getApplicationById(Long id);

    // Get Applications By UserId (Applicant Use)
    List<PermitApplicationDto> getApplicationsByUserId(Long userId);

    // Delete Application
    void deleteApplication(Long id);

    // Update Application
    PermitApplicationDto updateApplication(Long id, PermitApplicationDto dto);
}
