"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

import TimetableGrid from "@/components/schedule/TimetableGrid";
import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { Button, PageHeader, Skeleton } from "@/components/ui/primitives";
import { getErrorMessage, studentAcademicApi, type ScheduleItem } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function StudentTimetablePage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSchedules(await studentAcademicApi.getSchedule());
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải thời khóa biểu."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadSchedule(); }, [loadSchedule]);

  return (
    <>
      <PageHeader title="Thời khóa biểu" description={`Lịch học hằng tuần${user?.class_name ? ` của lớp ${user.class_name}` : ""}. Cuộn ngang để xem đầy đủ trên màn hình nhỏ.`} />
      {error ? <ErrorState title="Không tải được thời khóa biểu" description={error} action={<Button variant="secondary" onClick={() => void loadSchedule()}>Thử lại</Button>} /> : loading ? <Skeleton className="h-[540px]" /> : schedules.length ? <TimetableGrid schedules={schedules} /> : <EmptyState title="Chưa có lịch học" description="Thời khóa biểu sẽ xuất hiện sau khi giáo viên sắp xếp lịch cho lớp." icon={CalendarDays} />}
    </>
  );
}
