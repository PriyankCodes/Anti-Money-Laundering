package com.tss.aml.service.impl;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.tss.aml.service.FileStorageService;

@Service
@Transactional
@ConditionalOnProperty(name = "storage.type", havingValue = "cloudinary")
public class CloudinaryFileStorageServiceImpl implements FileStorageService {

    private static final Logger logger = LoggerFactory.getLogger(CloudinaryFileStorageServiceImpl.class);

    @Autowired
    private Cloudinary cloudinary;

    @Override
    public String storeFile(MultipartFile file) {
        try {
            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String uniqueFilename = UUID.randomUUID().toString() + fileExtension;

            // Upload to Cloudinary
            Map<String, Object> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                    "public_id", "kyc-documents/" + uniqueFilename.replace(fileExtension, ""),
                    "resource_type", "auto",
                    "folder", "aml-kyc-documents"
                )
            );

            String fileUrl = (String) uploadResult.get("secure_url");
            logger.info("File uploaded to Cloudinary successfully: {}", fileUrl);
            
            return fileUrl;

        } catch (IOException e) {
            logger.error("Failed to upload file to Cloudinary", e);
            throw new RuntimeException("Failed to upload file to Cloudinary: " + e.getMessage());
        }
    }

    @Override
    public void deleteFile(String fileUrl) {
        try {
            // Extract public_id from URL
            String publicId = extractPublicIdFromUrl(fileUrl);
            if (publicId != null) {
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
                logger.info("File deleted from Cloudinary: {}", publicId);
            }
        } catch (IOException e) {
            logger.error("Failed to delete file from Cloudinary: {}", fileUrl, e);
        }
    }

    private String extractPublicIdFromUrl(String fileUrl) {
        try {
            // Extract public_id from Cloudinary URL
            // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
            if (fileUrl.contains("/upload/")) {
                String[] parts = fileUrl.split("/upload/");
                if (parts.length > 1) {
                    String afterUpload = parts[1];

                    if (afterUpload.matches("^v\\d+/.*")) {
                        afterUpload = afterUpload.substring(afterUpload.indexOf('/') + 1);
                    }
                    // Remove file extension
                    int lastDotIndex = afterUpload.lastIndexOf('.');
                    if (lastDotIndex > 0) {
                        return afterUpload.substring(0, lastDotIndex);
                    }
                    return afterUpload;
                }
            }
        } catch (Exception e) {
            logger.warn("Failed to extract public_id from URL: {}", fileUrl, e);
        }
        return null;
    }
}
