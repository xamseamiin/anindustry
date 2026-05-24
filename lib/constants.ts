// lib/constants.ts - Global Constants for Revlo App

// User Roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER',
  VIEWER: 'VIEWER',
  SUPER_ADMIN: 'SUPER_ADMIN',
};

// Expense Categories (Main)
export const EXPENSE_CATEGORIES = {
  MATERIAL: 'Material',
  LABOR: 'Labor',
  TRANSPORT: 'Transport',
  COMPANY_EXPENSE: 'Company Expense',
  OTHER: 'Other',
};

// Company Expense Sub-Categories
export const COMPANY_EXPENSE_SUB_CATEGORIES = {
  SALARY: 'Salary',
  OFFICE_RENT: 'Office Rent',
  ELECTRICITY: 'Electricity',
  FUEL: 'Fuel',
  UTILITIES: 'Utilities',
  MARKETING: 'Marketing',
  MATERIAL_COMPANY: 'Material (Kharashka Shirkadda)', // Material purchased for company use, not project
  DEBT_TAKEN: 'Debt (La Qaatay)',
  DEBT_REPAYMENT: 'Debt Repayment',
  OTHER_COMPANY: 'Other', // Other general company expenses
};

// Account Types
export const ACCOUNT_TYPES = {
  BANK: 'BANK',
  CASH: 'CASH',
  MOBILE_MONEY: 'MOBILE_MONEY',
};

// Transaction Types
export const TRANSACTION_TYPES = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
  TRANSFER_IN: 'TRANSFER_IN',
  TRANSFER_OUT: 'TRANSFER_OUT',
  DEBT_TAKEN: 'DEBT_TAKEN',
  DEBT_REPAID: 'DEBT_REPAID',
  OTHER: 'OTHER',
};

// Project Statuses
export const PROJECT_STATUSES = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold',
  CANCELLED: 'Cancelled',
  OVERDUE: 'Overdue',
  NEARING_DEADLINE: 'Nearing Deadline',
};

// Default Currency
export const DEFAULT_CURRENCY = 'ETB';

// Date Formats
export const DATE_FORMATS = {
  DD_MM_YYYY: 'DD/MM/YYYY',
  MM_DD_YYYY: 'MM/DD/YYYY',
  YYYY_MM_DD: 'YYYY-MM-DD',
};

// Table Densities
export const TABLE_DENSITIES = {
  COMPACT: 'compact',
  COMFORTABLE: 'comfortable',
};

// Notification Sounds
export const NOTIFICATION_SOUNDS = {
  DEFAULT: 'default',
  ALERT1: 'alert1',
  CHIME: 'chime',
};

// Default Export Formats
export const EXPORT_FORMATS = {
  CSV: 'CSV',
  JSON: 'JSON',
  PDF: 'PDF',
};

// Material Units
export const MATERIAL_UNITS = ['pcs', 'sq ft', 'sq m', 'Liter', 'kg', 'box', 'm'];

// Add more constants as needed for your application
