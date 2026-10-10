export function CourseSyncStatus({ status, tone }: { status: string; tone: string }) {
  return <div className="form-note course-sync-status" data-tone={tone} style={{ marginTop: 24 }}>{status}</div>;
}
