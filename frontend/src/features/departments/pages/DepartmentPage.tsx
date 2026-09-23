import type { Department } from '@/shared/config/departments'
import { referenceForDepartment } from '@/shared/config/reference-departments'
import { canWriteDepartment, departmentRole, type Access } from '@/features/auth'
import { compareTasks, TaskList, type HqTask } from '@/features/tasks'
import { UpdateComposer, UpdateList, type HqUpdate } from '@/features/updates'
import { DepartmentLayout } from '../components/DepartmentLayout'

export function DepartmentPage({ access, department, tasks, updates, busyTaskId, onToggle, onNewTask, onPosted, dataReady }: {
  access: Access; department: Department; tasks: HqTask[]; updates: HqUpdate[];
  busyTaskId: string | null; onToggle: (task: HqTask) => void;
  onNewTask: () => void; onPosted: (update: HqUpdate) => void; dataReady: boolean
}) {
  const role = departmentRole(access, department.code)
  const writable = canWriteDepartment(access, department.code)
  const departmentTasks = tasks.filter((task) => task.department_code === department.code).sort(compareTasks)
  const departmentUpdates = updates.filter((update) => update.department_code === department.code)

  return <DepartmentLayout
    department={referenceForDepartment(department)} role={access.organization.role === 'admin' ? 'Admin' : role === 'lead' ? 'Lead' : role === 'member' ? 'Member' : 'View'}
    dataReady={dataReady} writable={writable && dataReady} onNewTask={onNewTask}
    taskContent={<TaskList tasks={departmentTasks} access={access} onToggle={onToggle} busyId={busyTaskId} empty="No tasks here yet." />}
    updateContent={<>{writable && dataReady && <UpdateComposer access={access} departmentCode={department.code} onPosted={onPosted} />}<UpdateList updates={departmentUpdates} empty="No updates yet." /></>}
  />
}
