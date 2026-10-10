export const STAFF_ROLES = Object.freeze(['super_admin', 'admin', 'instructor'] as const);
export const ASSIGNABLE_ROLES = Object.freeze(['admin', 'instructor', 'student'] as const);

export type StaffRole = (typeof STAFF_ROLES)[number];
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export function canInvite(actorRole: string, invitedRole: string) {
  if (!STAFF_ROLES.includes(actorRole as StaffRole) || !ASSIGNABLE_ROLES.includes(invitedRole as AssignableRole)) return false;
  return actorRole === 'super_admin' || invitedRole === 'student';
}

export function canReviewApplication(actorRole: string, applicantRequestedRole: string, assignedRole: string) {
  if (!STAFF_ROLES.includes(actorRole as StaffRole) || !ASSIGNABLE_ROLES.includes(assignedRole as AssignableRole)) return false;
  return actorRole === 'super_admin' || (applicantRequestedRole === 'student' && assignedRole === 'student');
}

export function canManageUser(actorRole: string, targetRole: string, changes: { role?: string; status?: string } = {}) {
  if (actorRole !== 'super_admin' || targetRole === 'super_admin') return false;
  if (changes.role && !ASSIGNABLE_ROLES.includes(changes.role as AssignableRole)) return false;
  if (changes.status && !['approved', 'suspended', 'archived'].includes(changes.status)) return false;
  return Boolean(changes.role || changes.status);
}
