package nic.mn.pis.service.impl;

import nic.mn.pis.service.FileStorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * Implementation of FileStorageService for managing PDF file uploads
 * Stores files in the configured upload directory and returns file path with filename
 */
@Service
public class FileStorageServiceImpl implements FileStorageService {

    @Value("${file.upload-dir:uploads/}")
    private String uploadDir;

    /**
     * Store a PDF file in the file system with a unique filename
     * @param file the MultipartFile to store (must be PDF)
     * @return the file path and name as a string (e.g., "uploads/unique-id_originalname.pdf")
     * @throws IOException if file operations fail
     * @throws IllegalArgumentException if file is not a PDF or is empty
     */
    @Override
    public String storePdfFile(MultipartFile file) throws IOException {
        // Validate file
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        if (!isPdfFile(file)) {
            throw new IllegalArgumentException("File must be a PDF. Provided file type: " + file.getContentType());
        }

        // Create uploads directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generate unique filename to avoid conflicts
        String originalFileName = file.getOriginalFilename();
        String uniqueFileName = UUID.randomUUID() + "_" + originalFileName;
        Path filePath = uploadPath.resolve(uniqueFileName);

        // Save file to disk
        try {
            Files.copy(file.getInputStream(), filePath);
        } catch (IOException e) {
            throw new IOException("Failed to store PDF file: " + e.getMessage(), e);
        }

        // Return the path and filename for storage in database
        return uploadDir + uniqueFileName;
    }

    /**
     * Delete a file from the file system
     * @param filePath the full path of the file to delete (e.g., "uploads/unique-id_filename.pdf")
     * @return true if deletion was successful, false otherwise
     */
    @Override
    public boolean deleteFile(String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            return false;
        }

        try {
            Path path = Paths.get(filePath);
            if (Files.exists(path)) {
                Files.delete(path);
                return true;
            }
            return false;
        } catch (IOException e) {
            System.err.println("Failed to delete file: " + filePath + ". Error: " + e.getMessage());
            return false;
        }
    }

    /**
     * Get the full file path from file name
     * @param fileName the file name
     * @return the full file path
     */
    @Override
    public String getFilePath(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return null;
        }
        return uploadDir + fileName;
    }

    /**
     * Get absolute file path - converts relative path to absolute path
     * @param relativeFilePath the relative file path (e.g., "uploads/uuid_filename.pdf")
     * @return the absolute file path
     */
    @Override
    public String getAbsoluteFilePath(String relativeFilePath) {
        if (relativeFilePath == null || relativeFilePath.isEmpty()) {
            return null;
        }

        try {
            // Try to create a Path from the relative path
            Path path = Paths.get(relativeFilePath);

            // If it's already absolute, return as is
            if (path.isAbsolute()) {
                return path.toString();
            }

            // Convert to absolute path relative to current working directory
            Path absolutePath = path.toAbsolutePath();
            return absolutePath.toString();
        } catch (Exception e) {
            // Fallback: just use the relative path as is
            System.err.println("Error converting to absolute path: " + e.getMessage());
            return relativeFilePath;
        }
    }

    /**
     * Validate if the file is a PDF
     * @param file the MultipartFile to validate
     * @return true if file is a PDF, false otherwise
     */
    @Override
    public boolean isPdfFile(MultipartFile file) {
        if (file == null) {
            return false;
        }

        String contentType = file.getContentType();
        String originalFileName = file.getOriginalFilename();

        // Check content type
        boolean isValidContentType = contentType != null &&
                (contentType.equals("application/pdf") ||
                 contentType.equals("application/x-pdf"));

        // Check file extension
        boolean isValidExtension = originalFileName != null &&
                originalFileName.toLowerCase().endsWith(".pdf");

        return isValidContentType && isValidExtension;
    }
}
