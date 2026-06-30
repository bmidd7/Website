# bmiddleton.dev

A comprehensive Django-based web application implementing a multi-app hub-and-spoke architecture for personal productivity, academic tools, and remote services integration.

## Executive Summary

The bmiddleton.dev web platform is a sophisticated full-stack application built on Django 5.2.7 that serves as a centralized hub for various functional modules including academic tools, AI experimentation, remote desktop access, and user management. The system employs a modular architecture where distinct Django applications operate under a unified template system, providing consistent user experience while maintaining functional separation. The platform integrates with external services including Gmail automation, Apache Guacamole for remote desktop, and LM Studio for local LLM inference, demonstrating a practical implementation of modern web service orchestration.

## System Architecture

Multi-Application Hub-and-Spoke Model
The platform implements a hub-and-spoke architectural pattern where a central landing point (MainHub) distributes traffic to specialized functional modules. This design promotes separation of concerns while maintaining a cohesive user interface through shared templates and utilities. The root URL configuration in All_Websites/urls.py serves as the central routing mechanism, delegating requests to appropriate sub-applications based on URL patterns.

### The registered applications in the Django settings include

MainHub: Primary entry point featuring an interactive Canvas-based user interface
Accounts: Custom user profiles, multi-factor authentication, and social login integration
Services: Remote desktop gateway and Gmail automation services
AI: Interface for local LLM interaction via LM Studio
APIs: Hardware-focused endpoints and camera streaming capabilities
School: Academic tools including chemistry calculators
Fly: Standalone Canvas physics simulation module
Template Inheritance System
The entire web application inherits from a single base template located at All_Websites/templates/base.html, which establishes the fundamental HTML structure, global CSS inclusions, and JavaScript module loading. This template defines a flexbox-based layout with a collapsible sidebar navigation component and a main content area, ensuring consistent user experience across all sub-applications.

### The base template provides several Django template blocks for customization

{% block title %}: Page-specific title configuration
{% block extra-css %}: Additional stylesheet inclusions
{% block app-specific-logo-in-sidebar %}: Application-specific branding in navigation
{% block main %}: Primary content area
{% block extra_js %}: Additional JavaScript modules
Sidebar Navigation Component
A sophisticated responsive sidebar system serves as the primary navigation mechanism across the platform. The sidebar features:

Collapsible State Management: Toggleable visibility through CSS class manipulation
Resizable Interface: Drag handle for manual width adjustment
Integrated Feedback System: Built-in feedback form accessible from any page
Application-Specific Controls: Dynamic logo and settings integration per application
The sidebar structure includes top-level buttons for navigation control, a collapsible feedback section with form validation, and a resize handle for user customization. JavaScript modules handle the opening/closing logic and resize functionality through ES6 modules.

## Technology Stack

Backend Framework
The platform utilizes Django 5.2.7 as the primary web framework, providing robust ORM, template system, and security features. The configuration includes several third-party packages extending Django's core functionality:

django-allauth: Comprehensive authentication solution supporting social logins (Google, Apple) and multi-factor authentication
Django REST Framework: API layer for programmatic access
django-cors-headers: Cross-origin resource sharing configuration
WhiteNoise: Static file serving middleware for production deployment.
Database Configuration
The system employs SQLite 3 as the default database backend, configured for simplicity and portability. This choice facilitates development and deployment without requiring external database server setup. The database file is located at the project root level, following Django conventions.

## Frontend Technologies

### The frontend architecture emphasizes modularity and type safety

TypeScript: Source language for JavaScript modules, providing compile-time type checking
SCSS: Modular styling with variables and mixins for maintainable CSS
ES6 Modules: Modern JavaScript module system for code organization
HTML5 Canvas: For interactive animations and physics simulations
Global JavaScript utilities centralized in globalVars.ts provide hardware detection capabilities including GPU availability, RAM capacity, CPU core count, and network connectivity testing. These utilities enable adaptive behavior based on client hardware capabilities.

## Project Structure

### The web application follows Django's standard project structure with additional organization for static assets and templates

`All_Websites/  
├── All_Websites/  
│   ├── settings.py          # Project configuration  
│   ├── urls.py              # Root URL routing  
│   ├── wsgi.py              # WSGI application entry point  
│   └── asgi.py              # ASGI application entry point  
├── templates/               # Shared templates  
│   └── base.html           # Base template for all pages  
├── static/                 # Source static files  
│   ├── css/                # Compiled stylesheets  
│   ├── js/                 # Compiled JavaScript  
│   ├── scss/               # Source SCSS files  
│   └── ts/                 # TypeScript source files  
├── staticfiles/            # Collected static assets  
├── MainHub/                # Main landing page app  
├── Accounts/               # User management app  
├── Services/               # External service integrations  
├── AI/                     # AI interface app  
├── APIs/                   # API endpoints app  
├── School/                 # Academic tools app  
└── Fly/                    # Physics simulation app`
Each application maintains its own templates, static files, and business logic while inheriting from the base template system for consistency.

Key Components and Features
MainHub Application
The MainHub serves as the primary entry point for authenticated users, featuring an interactive Canvas-based interface. The DefaultHub view retrieves the authenticated username and renders the hub template with user context. The template includes a Canvas element for dynamic visualizations and an orb interface element for account access.

The hub template extends the base template, incorporating the main logo in the sidebar and loading the tendrils animation JavaScript module for visual effects.

## Services Application - Remote Desktop

The Services application implements a sophisticated remote desktop gateway called "Away PC" that allows users to access their personal computers through a browser interface. The system integrates with Apache Guacamole for remote desktop protocol handling and implements multiple security layers including mandatory MFA re-authentication and bridge status verification.

The PC template extends the base template with application-specific styling and includes data attributes for bridge status, MFA requirements, and Guacamole configuration. These data attributes are consumed by the frontend JavaScript module for real-time status polling and user interface updates.

## School Application - Chemistry Tools

The School application provides academic tools including a comprehensive gas law calculator. The Gases template implements a sophisticated form interface allowing users to input initial and final conditions for gas calculations, supporting multiple units for volume, pressure, temperature, and particle amount. The interface includes helpful tooltips and supports scientific notation input.

## Authentication and User Management

### The platform extends Django's default user model through custom models in the Accounts application, implementing

UserProfile: Extended user information including name, grade, and birth date
UserPreferences: Theme customization with preset color schemes
UserComputer: Remote desktop configuration with encrypted credentials
MFA: Multi-factor authentication settings with TOTP support
Authentication is handled through django-allauth with social login providers for Google and Apple, custom signup forms, and optional email verification.

## Installation and Setup

### Prerequisites

Python 3.14
pip package manager
Node.js and npm (for frontend build process)
Git
Development Environment Setup
Clone the repository:

`git clone https://github.com/bmidd7/Website`
`cd bmidd7/Website`
Create a virtual environment:

`python -m venv venv`
`source venv/bin/activate`  # On Windows: `venv\Scripts\activate`

Configure environment variables:
Create a .env file in the project root with necessary configuration variables including the Django secret key, database settings, and external service credentials.

Run database migrations:

python manage.py migrate
Collect static files:

python manage.py collectstatic
Start the development server:

python manage.py runserver
Frontend Build Process
The frontend requires compilation of TypeScript to JavaScript and SCSS to CSS. This process is typically handled through build scripts that:

Compile TypeScript files from static/ts/ to static/js/
Compile SCSS files from static/scss/ to static/css/
Generate source maps for debugging
Security Considerations
The platform implements several security measures appropriate for a production environment:

CSRF Protection: Cross-site request forgery protection is configured with trusted origins for the production domain
Secure Proxy Headers: Configuration for proxy SSL header handling
Password Validation: Comprehensive password validators including similarity checks, minimum length requirements, and common password detection
MFA Support: Multi-factor authentication through django-allauth for enhanced security
Encrypted Credentials: Remote desktop passwords are encrypted using Fernet encryption before storage
The settings file includes production-appropriate configurations with DEBUG set to False and specific allowed hosts configured for the production domain.

## Development Workflow

## Template Development

When creating new pages or modifying existing ones, developers extend the base template and utilize the provided template blocks for customization. The sidebar can be customized through the app-specific-logo-in-sidebar block, and page-specific stylesheets are added through the extra-css block.

### Static File Management

Static files are organized by application and type. Source files in TypeScript and SCSS are compiled to production-ready JavaScript and CSS. Django's collectstatic command gathers all static files from applications into a centralized location for efficient serving in production.

### URL Routing

New applications are registered in INSTALLED_APPS and their URL patterns are included in the root urls.py configuration. This centralized routing ensures consistent URL structure across the platform
