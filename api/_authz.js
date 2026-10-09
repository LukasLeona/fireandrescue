export const STAFF_ROLES = Object.freeze(['super_admin', 'admin', 'instructor']);
export const ASSIGNABLE_ROLES = Object.freeze(['admin', 'instructor', 'student']);

export function canInvite(actorRole, invitedRole) {
  if (!STAFF_ROLES.includes(actorRole) || !ASSIGNABLE_ROLES.includes(invitedRole)) return false;
  if (actorRole === 'super_admin') return true;
  return invitedRole === 'student';
}

export function canReviewApplication(actorRole, applicantRequestedRole, assignedRole) {
  if (!STAFF_ROLES.includes(actorRole) || !ASSIGNABLE_ROLES.includes(assignedRole)) return false;
  if (actorRole === 'super_admin') return true;
  return applicantRequestedRole === 'student' && assignedRole === 'student';
}

export function canManageUser(actorRole, targetRole, changes = {}) {
  if (actorRole !== 'super_admin' || targetRole === 'super_admin') return false;
  if (changes.role && !ASSIGNABLE_ROLES.includes(changes.role)) return false;
  if (changes.status && !['approved', 'suspended', 'archived'].includes(changes.status)) return false;
  return Boolean(changes.role || changes.status);
}
