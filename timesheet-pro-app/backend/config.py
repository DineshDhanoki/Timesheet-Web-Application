import os

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///timesheets.db')
    SQLALCHEMY_ECHO = False
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*')
    COMPANY_NAME = os.getenv('COMPANY_NAME', 'TechnoApex Ltd.')
    CUSTOMER_DEFAULT = os.getenv('CUSTOMER_DEFAULT', 'Claris International Inc')
    MANAGER_DEFAULT = os.getenv('MANAGER_DEFAULT', 'Sudheer Tivare')
    SENDER_EMAIL = os.getenv('SENDER_EMAIL')  # optional, for email feature
    SENDER_NAME = os.getenv('SENDER_NAME', 'Timesheet Pro')
    SMTP_HOST = os.getenv('SMTP_HOST')
    SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
    SMTP_USERNAME = os.getenv('SMTP_USERNAME')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')
    SMTP_TLS = os.getenv('SMTP_TLS', 'true').lower() == 'true'
