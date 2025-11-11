package com.tss.aml.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.tss.aml.entity.Admin;
import com.tss.aml.entity.enums.UserStatus;
import com.tss.aml.repository.AdminRepository;
import com.tss.aml.repository.UserRepository;

import jakarta.transaction.Transactional;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AdminRepository adminRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        initializeAdminUser();
    }

    private void initializeAdminUser() {
        // Check if admin user already exists
        if (userRepository.findByEmail("admin@aml.com").isEmpty()) {
            
            // Create admin user using constructor
            Admin admin = new Admin(
                "admin@aml.com",
                passwordEncoder.encode("Admin@123"),
                "System",
                "Administrator", 
                "9999999999"
            );
            
            // Set additional fields
            admin.setStatus(UserStatus.ACTIVE);
            admin.setEmailVerified(true);
            
            // Save admin user
            adminRepository.save(admin);
            
            System.out.println("✅ Default admin user created successfully!");
            System.out.println("📧 Email: admin@amlbank.com");
            System.out.println("🔑 Password: AdminPass@123");
            System.out.println("⚠️  Please change the default password after first login!");
            
        } else {
            System.out.println("ℹ️  Admin user already exists, skipping initialization.");
        }
    }
}
