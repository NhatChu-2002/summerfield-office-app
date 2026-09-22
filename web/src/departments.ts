export type Department = { code: string; name: string; shortName: string; description: string }

export const DEPARTMENTS: Department[] = [
  { code: 'operations', name: 'Operations', shortName: 'Operations', description: 'Stores and day-to-day work' },
  { code: 'marketing', name: 'Marketing & Media', shortName: 'M&M', description: 'Campaigns, content, and community' },
  { code: 'research_and_development', name: 'Research & Development', shortName: 'R&D', description: 'Menu and product development' },
  { code: 'admin_and_payroll', name: 'Admin & Payroll', shortName: 'Admin', description: 'People and payroll operations' },
  { code: 'design', name: 'Design', shortName: 'Design', description: 'Creative and visual work' },
  { code: 'build_out', name: 'Build-Out', shortName: 'Build-Out', description: 'New locations and construction' },
  { code: 'pr_and_partnerships', name: 'PR & Partnerships', shortName: 'PR', description: 'Partnerships and events' },
  { code: 'executive_assistant', name: 'Executive Assistant', shortName: 'Executive', description: 'Executive coordination' },
  { code: 'finance', name: 'Finance', shortName: 'Finance', description: 'Budgets, invoices, and reporting' },
  { code: 'warehouse_and_spend', name: 'Warehouse & Spend', shortName: 'Warehouse', description: 'Stock and purchasing' },
  { code: 'equipment_and_maintenance', name: 'Equipment & Maintenance', shortName: 'I&M', description: 'Equipment and repairs' },
  { code: 'store_manager', name: 'Store Managers', shortName: 'Stores', description: 'Store leadership' },
]

export const departmentByCode = (code: string) =>
  DEPARTMENTS.find((department) => department.code === code)
