# Anti-Money Laundering (AML) System

A comprehensive Anti-Money Laundering detection and compliance management system built with Spring Boot and Angular. This system provides real-time transaction monitoring, rule-based risk assessment, and compliance workflow management for financial institutions.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Rule Engine](#rule-engine)
- [Contributing](#contributing)

## Overview

The AML System is designed to help financial institutions detect and prevent money laundering activities by monitoring transactions, identifying suspicious patterns, and managing compliance workflows. The system employs a sophisticated rule engine that evaluates transactions against multiple criteria including thresholds, velocity, frequency, geographic risk, and keyword matching.

## Features

### Core Functionality

- **Real-time Transaction Monitoring**: Automatic evaluation of transactions against configured rules
- **Multi-layered Rule Engine**: Supports threshold, velocity, frequency, geographic, pattern, keyword, and funnel account detection
- **Alert Management**: Comprehensive alert generation, assignment, and resolution workflow
- **KYC Management**: Customer verification and document management system
- **Suspicious Activity Reporting (SAR)**: Generate and manage regulatory reports
- **Audit Logging**: Complete audit trail of all system activities
- **Help Desk Ticketing**: Integrated support ticket management
- **Currency Exchange**: Multi-currency support with real-time exchange rates
- **Dashboard Analytics**: Role-based dashboards with key metrics and visualizations

### User Management

- **Role-based Access Control**: Admin, Compliance Officer, and Customer roles
- **Secure Authentication**: JWT-based authentication with email verification
- **Password Management**: Forgot password and reset functionality with OTP verification
- **Profile Management**: User profile and account management

### Compliance Features

- **Alert Investigation**: Detailed alert review and investigation tools
- **Customer Risk Profiling**: Historical alert analysis per customer
- **Report Generation**: Comprehensive reporting capabilities with PDF export
- **Country Risk Management**: Configurable risky country database
- **Keyword Detection**: Suspicious keyword monitoring in transaction descriptions

## Architecture

The system follows a microservices-inspired architecture with clear separation between frontend and backend:

### Backend Architecture

- **Controller Layer**: RESTful API endpoints for all operations
- **Service Layer**: Business logic implementation
- **Repository Layer**: Data access using Spring Data JPA
- **Security Layer**: JWT-based authentication and role-based authorization
- **Rule Engine**: Modular rule evaluation system with multiple evaluators
- **Exception Handling**: Centralized exception handling with custom exceptions

### Frontend Architecture

- **Component-based**: Angular standalone components
- **Feature Modules**: Organized by user role (Admin, Customer, Compliance)
- **Shared Services**: Centralized API communication and state management
- **Guards**: Route protection based on authentication and roles
- **Interceptors**: HTTP request/response handling for authentication

## Technology Stack

### Backend

- **Framework**: Spring Boot 3.5.6
- **Language**: Java 21
- **Database**: MySQL
- **Security**: Spring Security with JWT (jjwt 0.11.5)
- **ORM**: Spring Data JPA with Hibernate
- **Validation**: Spring Boot Validation
- **Email**: Spring Mail
- **File Storage**: Cloudinary
- **Build Tool**: Maven
- **Additional Libraries**:
  - Lombok for boilerplate reduction
  - Caffeine for caching
  - Spring AOP for cross-cutting concerns
  - Commons IO for file operations

### Frontend

- **Framework**: Angular 20.3.0
- **Language**: TypeScript 5.9.2
- **UI Framework**: Bootstrap 5.3.8
- **Icons**: Lucide Angular 0.546.0
- **PDF Generation**: jsPDF 2.5.2 with jsPDF-AutoTable 3.8.4
- **HTTP Client**: Angular HttpClient with RxJS 7.8.0
- **Testing**: Jasmine and Karma
- **Build Tool**: Angular CLI

## Getting Started

### Prerequisites

- Java 21 or higher
- Node.js 18 or higher
- MySQL 8.0 or higher
- Maven 3.6 or higher
- Angular CLI 20.3.4 or higher

### Backend Setup

1. **Clone the repository**
   ```bash
   cd Backend/AMLBackend/aml
   ```

2. **Configure the database**
   
   Create a MySQL database or let the application create it automatically:
   ```sql
   CREATE DATABASE `anti-money-laundering-v2`;
   ```

3. **Update application properties**
   
   Edit `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/anti-money-laundering-v2
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   
   # Update email configuration
   spring.mail.username=your_email@gmail.com
   spring.mail.password=your_app_password
   
   # Update Cloudinary configuration
   cloudinary.cloud-name=your_cloud_name
   cloudinary.api-key=your_api_key
   cloudinary.api-secret=your_api_secret
   
   # Update JWT secret
   jwt.secret=your_secret_key_minimum_256_bits
   ```

4. **Build and run the application**
   ```bash
   # Using Maven wrapper
   ./mvnw clean install
   ./mvnw spring-boot:run
   
   # Or using Maven
   mvn clean install
   mvn spring-boot:run
   ```

   The backend server will start on `http://localhost:8080`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd Frontned/AMLFrontend/aml-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Update environment configuration**
   
   Edit `src/environments/environment.ts` if needed:
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:8080/api'
   };
   ```

4. **Start the development server**
   ```bash
   npm start
   # or
   ng serve
   ```

   The frontend application will start on `http://localhost:4200`

### Default Access

After initial setup, you can create an admin user through the registration flow or directly in the database.

## Project Structure

### Backend Structure

```
Backend/AMLBackend/aml/
├── src/main/java/com/tss/aml/
│   ├── config/              # Configuration classes
│   ├── controller/          # REST API controllers
│   │   ├── AdminController.java
│   │   ├── AuthController.java
│   │   ├── ComplianceOfficerController.java
│   │   ├── CustomerController.java
│   │   └── ...
│   ├── dto/                 # Data Transfer Objects
│   ├── entity/              # JPA Entities
│   │   ├── User.java
│   │   ├── Transaction.java
│   │   ├── Alert.java
│   │   ├── Rule.java
│   │   └── enums/          # Enumerations
│   ├── exception/           # Custom exceptions
│   ├── repository/          # Spring Data repositories
│   ├── rule/                # Rule engine implementation
│   │   ├── ThresholdRuleEvaluator.java
│   │   ├── VelocityRuleEvaluator.java
│   │   ├── FrequencyRuleEvaluator.java
│   │   ├── GeographicRuleEvaluator.java
│   │   ├── KeywordRuleEvaluator.java
│   │   ├── PatternRuleEvaluator.java
│   │   └── FunnelAccountRuleEvaluator.java
│   ├── security/            # Security configuration
│   ├── service/             # Business logic services
│   └── util/                # Utility classes
└── src/main/resources/
    └── application.properties
```

### Frontend Structure

```
Frontned/AMLFrontend/aml-frontend/
├── src/
│   ├── app/
│   │   ├── core/            # Core services and guards
│   │   │   ├── guards/      # Route guards
│   │   │   ├── interceptors/# HTTP interceptors
│   │   │   └── services/    # Core services
│   │   ├── features/        # Feature modules
│   │   │   ├── admin/       # Admin features
│   │   │   │   ├── dashboard/
│   │   │   │   ├── users/
│   │   │   │   ├── rules/
│   │   │   │   ├── countries/
│   │   │   │   ├── keywords/
│   │   │   │   ├── kyc-review/
│   │   │   │   ├── audit-logs/
│   │   │   │   └── reports/
│   │   │   ├── customer/    # Customer features
│   │   │   │   ├── dashboard/
│   │   │   │   ├── accounts/
│   │   │   │   ├── transactions/
│   │   │   │   ├── alerts/
│   │   │   │   ├── kyc/
│   │   │   │   └── profile/
│   │   │   ├── compliance/  # Compliance officer features
│   │   │   │   ├── dashboard/
│   │   │   │   ├── alerts/
│   │   │   │   ├── transactions/
│   │   │   │   ├── sar/
│   │   │   │   ├── tickets/
│   │   │   │   └── customer-alert-history/
│   │   │   └── auth/        # Authentication features
│   │   │       ├── login/
│   │   │       ├── register/
│   │   │       ├── verify-otp/
│   │   │       ├── forgot-password/
│   │   │       └── reset-password/
│   │   ├── shared/          # Shared components and utilities
│   │   └── app.routes.ts    # Application routing
│   └── environments/        # Environment configurations
└── angular.json
```

## Configuration

### Database Configuration

The system uses MySQL as the primary database. Key configuration parameters:

- **Database Name**: `anti-money-laundering`
- **Auto-create**: Enabled (database will be created if it doesn't exist)
- **DDL Auto**: Update (schema updates automatically)
- **SSL**: Disabled for local development

### Security Configuration

- **JWT Secret**: Configurable secret key for token generation
- **Token Expiration**: 24 hours (86400000 ms)
- **Password Encoding**: BCrypt

### Email Configuration

- **SMTP Server**: Gmail (smtp.gmail.com)
- **Port**: 587
- **TLS**: Enabled
- **Authentication**: Required

### File Storage

- **Provider**: Cloudinary
- **Storage Type**: Cloud-based
- **Supported Formats**: Images and documents for KYC

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Customer Endpoints

- `GET /api/customer/dashboard` - Customer dashboard data
- `GET /api/customer/accounts` - List customer accounts
- `POST /api/customer/transactions` - Create transaction
- `GET /api/customer/alerts` - List customer alerts
- `POST /api/customer/kyc` - Submit KYC documents

### Admin Endpoints

- `GET /api/admin/dashboard` - Admin dashboard statistics
- `GET /api/admin/users` - List all users
- `POST /api/admin/rules` - Create AML rule
- `GET /api/admin/countries` - Manage risky countries
- `GET /api/admin/audit-logs` - View audit logs
- `GET /api/admin/reports` - Generate reports

### Compliance Officer Endpoints

- `GET /api/compliance/alerts` - List alerts for review
- `PUT /api/compliance/alerts/{id}` - Update alert status
- `POST /api/compliance/sar` - Create SAR report
- `GET /api/compliance/transactions` - Review transactions
- `GET /api/compliance/tickets` - Manage support tickets

## User Roles

### Admin

- Full system access
- User management
- Rule configuration
- Country and keyword management
- System reports and audit logs
- KYC review and approval

### Compliance Officer

- Alert investigation and resolution
- Transaction review
- SAR generation and management
- Customer risk assessment
- Support ticket management

### Customer

- Account management
- Transaction creation
- Alert viewing
- KYC document submission
- Profile management

## Rule Engine

The system implements a sophisticated rule engine with multiple evaluation strategies:

### Rule Types

1. **Threshold Rules**: Detect transactions exceeding specified amounts
   - Single transaction threshold
   - Daily/weekly/monthly aggregation thresholds

2. **Velocity Rules**: Monitor transaction speed and frequency
   - Transactions per time period
   - Rapid succession detection

3. **Frequency Rules**: Analyze transaction patterns
   - Unusual frequency detection
   - Pattern deviation analysis

4. **Geographic Rules**: Assess location-based risks
   - Risky country detection
   - Cross-border transaction monitoring

5. **Keyword Rules**: Scan transaction descriptions
   - Suspicious keyword matching
   - Category-based classification

6. **Pattern Rules**: Identify suspicious transaction patterns
   - Round amount detection
   - Structured transaction identification

7. **Funnel Account Rules**: Detect potential money laundering schemes
   - Multiple source/destination analysis
   - Rapid fund movement detection

### Rule Evaluation Process

1. Transaction is created by customer
2. Rule engine evaluates transaction against all active rules
3. Matching rules trigger alert generation
4. Alerts are assigned to compliance officers
5. Compliance officers investigate and resolve alerts
6. SAR reports generated for confirmed suspicious activities

## Contributing

This is a private project. For any questions or issues, please contact the development team.

## License

Proprietary - All rights reserved

## Support

For technical support or questions, please use the integrated help desk ticketing system or contact the system administrator.

---

**Note**: This system handles sensitive financial data. Ensure all security configurations are properly set before deploying to production environments. Never commit sensitive credentials to version control.
