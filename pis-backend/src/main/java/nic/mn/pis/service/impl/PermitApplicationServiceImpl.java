package nic.mn.pis.service.impl;

import lombok.AllArgsConstructor;
import nic.mn.pis.dto.PermitApplicationDto;
import nic.mn.pis.entity.PermitApplication;
import nic.mn.pis.entity.User;
import nic.mn.pis.exception.ResourceNotFoundException;
import nic.mn.pis.mapper.PermitApplicationMapper;
import nic.mn.pis.repository.PermitApplicationRepository;
import nic.mn.pis.repository.UserRepository;
import nic.mn.pis.service.FileStorageService;
import nic.mn.pis.service.PermitApplicationService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class PermitApplicationServiceImpl implements PermitApplicationService {

    private static final Logger logger = Logger.getLogger(PermitApplicationServiceImpl.class.getName());

    private PermitApplicationRepository permitApplicationRepository;
    private UserRepository userRepository;
    private FileStorageService fileStorageService;

    @Override
    public PermitApplicationDto createApplication(PermitApplicationDto dto) {
        logger.info("Creating application without file for user: " + dto.getUserId());

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + dto.getUserId()));

        PermitApplication application = PermitApplicationMapper.mapToEntity(dto);
        application.setUser(user);
        application.setStatus("SUBMITTED");
        application.setCurrentStage("DC_PENDING");

        PermitApplication saved = permitApplicationRepository.save(application);
        logger.info("Application created successfully with ID: " + saved.getApplicationId());

        return PermitApplicationMapper.mapToDto(saved);
    }

    @Override
    public PermitApplicationDto createApplicationWithPdf(PermitApplicationDto dto, MultipartFile pdfFile) throws IOException {
        logger.info("Creating application with PDF upload for user: " + dto.getUserId());

        // Validate PDF file
        if (pdfFile == null || pdfFile.isEmpty()) {
            logger.severe("PDF file is null or empty");
            throw new IllegalArgumentException("PDF file is required");
        }

        // Validate file using FileStorageService
        if (!fileStorageService.isPdfFile(pdfFile)) {
            logger.severe("Invalid file type: " + pdfFile.getContentType());
            throw new IllegalArgumentException("Only PDF files are allowed");
        }

        // Store the PDF file
        String documentPath = fileStorageService.storePdfFile(pdfFile);
        String documentFileName = pdfFile.getOriginalFilename();
        logger.info("PDF file stored at: " + documentPath);

        // Set file information in DTO
        dto.setDocumentPath(documentPath);
        dto.setDocumentFileName(documentFileName);

        // Create the application
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + dto.getUserId()));

        PermitApplication application = PermitApplicationMapper.mapToEntity(dto);
        application.setUser(user);
        application.setStatus("SUBMITTED");
        application.setCurrentStage("DC_PENDING");

        PermitApplication saved = permitApplicationRepository.save(application);
        logger.info("Application with PDF created successfully with ID: " + saved.getApplicationId());

        return PermitApplicationMapper.mapToDto(saved);
    }

    @Override
    public List<PermitApplicationDto> getApplicationsByUserId(Long userId) {
        logger.info("Fetching applications for user: " + userId);

        List<PermitApplication> list = permitApplicationRepository.findByUser_UserId(userId);
        logger.info("Found " + list.size() + " applications for user: " + userId);

        return list.stream()
                .map(PermitApplicationMapper::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<PermitApplicationDto> getAllApplications() {
        logger.info("Fetching all applications");
        List<PermitApplication> applications = permitApplicationRepository.findAll();
        logger.info("Total applications found: " + applications.size());

        return applications.stream()
                .map(PermitApplicationMapper::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public PermitApplicationDto getApplicationById(Long id) {
        logger.info("Fetching application by ID: " + id);
        PermitApplication application = permitApplicationRepository.findById(id)
                .orElseThrow(() -> {
                    logger.severe("Application not found with ID: " + id);
                    return new ResourceNotFoundException("Application not found with id: " + id);
                });

        return PermitApplicationMapper.mapToDto(application);
    }

    @Override
    public void deleteApplication(Long id) {
        logger.info("Deleting application with ID: " + id);
        PermitApplication application = getApplicationByIdEntity(id);

        // Delete the file from file system if it exists
        if (application.getDocumentPath() != null && !application.getDocumentPath().isEmpty()) {
            boolean deleted = fileStorageService.deleteFile(application.getDocumentPath());
            if (deleted) {
                logger.info("File deleted successfully: " + application.getDocumentPath());
            } else {
                logger.warning("File could not be deleted: " + application.getDocumentPath());
            }
        }

        // Delete the application from database
        permitApplicationRepository.delete(application);
        logger.info("Application deleted successfully with ID: " + id);
    }

    @Override
    public PermitApplicationDto updateApplication(Long id, PermitApplicationDto dto) {
        logger.info("Updating application with ID: " + id);
        PermitApplication application = getApplicationByIdEntity(id);

        // Update fields
        application.setEventTitle(dto.getEventTitle());
        application.setPurpose(dto.getPurpose());
        application.setStartDateTime(dto.getStartDateTime());
        application.setEndDateTime(dto.getEndDateTime());
        application.setPermitType(dto.getPermitType());
        application.setLocationTag(dto.getLocationTag());

        // Only update status if provided
        if (dto.getStatus() != null && !dto.getStatus().isEmpty()) {
            application.setStatus(dto.getStatus());
        }

        PermitApplication updated = permitApplicationRepository.save(application);
        logger.info("Application updated successfully with ID: " + id);

        return PermitApplicationMapper.mapToDto(updated);
    }

    // Helper to get entity by id inside service (avoids changing public contract)
    private PermitApplication getApplicationByIdEntity(Long id) {
        return permitApplicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with id: " + id));
    }
}
