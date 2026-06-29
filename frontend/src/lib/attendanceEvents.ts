export const ATTENDANCE_DATA_CHANGED_EVENT = 'attendance:data-changed';

export type AttendanceDataChangeAction = 'deleted';

export interface AttendanceDataChangedDetail {
  action: AttendanceDataChangeAction;
  logId: number;
  jamaahId?: string;
}

export function emitAttendanceDataChanged(detail: AttendanceDataChangedDetail): void {
  window.dispatchEvent(
    new CustomEvent<AttendanceDataChangedDetail>(ATTENDANCE_DATA_CHANGED_EVENT, {
      detail,
    })
  );
}
