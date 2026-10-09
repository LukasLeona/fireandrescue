import test from 'node:test';
import assert from 'node:assert/strict';
import { canInvite, canManageUser, canReviewApplication } from '../api/_authz.js';

test('only the super admin can invite staff roles', () => {
  assert.equal(canInvite('super_admin', 'admin'), true);
  assert.equal(canInvite('super_admin', 'instructor'), true);
  assert.equal(canInvite('admin', 'admin'), false);
  assert.equal(canInvite('instructor', 'instructor'), false);
});

test('staff can invite students while students cannot invite anyone', () => {
  assert.equal(canInvite('super_admin', 'student'), true);
  assert.equal(canInvite('admin', 'student'), true);
  assert.equal(canInvite('instructor', 'student'), true);
  assert.equal(canInvite('student', 'student'), false);
});

test('admin and instructor review authority is limited to students', () => {
  assert.equal(canReviewApplication('admin', 'student', 'student'), true);
  assert.equal(canReviewApplication('instructor', 'student', 'student'), true);
  assert.equal(canReviewApplication('admin', 'instructor', 'instructor'), false);
  assert.equal(canReviewApplication('instructor', 'admin', 'student'), false);
});

test('super admin may assign supported roles but cannot create another super admin', () => {
  assert.equal(canReviewApplication('super_admin', 'admin', 'admin'), true);
  assert.equal(canReviewApplication('super_admin', 'instructor', 'instructor'), true);
  assert.equal(canReviewApplication('super_admin', 'student', 'super_admin'), false);
});

test('only the super admin can manage existing users and the owner is protected', () => {
  assert.equal(canManageUser('super_admin', 'student', { role: 'instructor' }), true);
  assert.equal(canManageUser('admin', 'student', { status: 'suspended' }), false);
  assert.equal(canManageUser('super_admin', 'super_admin', { status: 'suspended' }), false);
  assert.equal(canManageUser('super_admin', 'student', { role: 'super_admin' }), false);
});
