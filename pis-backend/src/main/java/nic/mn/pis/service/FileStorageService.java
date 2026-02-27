package nic.mn.pis.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface FileStorageService {

    /**
     * Store a PDF file in the file system
     * @param file the MultipartFile to store
     * @return the file path and name as a string
     * @throws IOException if file operations fail
     * @throws IllegalArgumentException if file is not a PDF
     */
    String storePdfFile(MultipartFile file) throws IOException;

    /**
     * Delete a file from the file system
     * @param filePath the full path of the file to delete
     * @return true if deletion was successful, false otherwise
     */
    boolean deleteFile(String filePath);

    /**
     * Get the file path from file name
     * @param fileName the file name
     * @return the full file path
     */
    String getFilePath(String fileName);

    /**
     * Get absolute file path - converts relative path to absolute path
     * @param relativeFilePath the relative file path
     * @return the absolute file path
     */
    String getAbsoluteFilePath(String relativeFilePath);

    /**
     * Validate if the file is a PDF
     * @param file the MultipartFile to validate
     * @return true if file is a PDF, false otherwise
     */
    boolean isPdfFile(MultipartFile file);
}

