import {
  BookOpen, Boxes, BriefcaseBusiness, Building2, CalendarDays, ChartNoAxesCombined,
  Clock3, FileText, FlaskConical, FolderKanban, FolderOpen, HardHat, House,
  Landmark, Lightbulb, ListTodo, Megaphone, Menu, MessageCircleQuestion,
  MonitorCog, Newspaper, Palette, Scale, Search, Store, UsersRound, Wrench,
  type LucideIcon,
} from 'lucide-react'

const sectionIcons: Record<string, LucideIcon> = {
  dashboard: House,
  calendar: CalendarDays,
  folders: FolderOpen,
  help: Lightbulb,
  watch: Newspaper,
  ask: MessageCircleQuestion,
  decisions: Scale,
  projects: FolderKanban,
  tasks: ListTodo,
  learn: BookOpen,
  time: Clock3,
  reports: ChartNoAxesCombined,
  meetings: UsersRound,
  sop: FileText,
  people: UsersRound,
  search: Search,
  more: Menu,
}

const departmentIcons: Record<string, LucideIcon> = {
  company: Building2,
  research_and_development: FlaskConical,
  marketing: Megaphone,
  build_out: HardHat,
  operations: Store,
  finance: Landmark,
  warehouse_and_spend: Boxes,
  equipment_and_maintenance: Wrench,
  it: MonitorCog,
  hr: UsersRound,
  admin_and_payroll: UsersRound,
  design: Palette,
  pr_and_partnerships: Megaphone,
  executive_assistant: BriefcaseBusiness,
  store_manager: Store,
}

export function SectionIcon({ name, size = 19 }: { name: string; size?: number }) {
  const Icon = sectionIcons[name] || FolderOpen
  return <Icon size={size} strokeWidth={2.1} aria-hidden="true" />
}

export function DepartmentIcon({ code, size = 19 }: { code: string; size?: number }) {
  const Icon = departmentIcons[code] || FolderOpen
  return <Icon size={size} strokeWidth={2.1} aria-hidden="true" />
}
