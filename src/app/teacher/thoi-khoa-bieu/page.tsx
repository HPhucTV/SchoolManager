"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, CalendarDays, Clock3, Layers3, Plus } from "lucide-react";
import toast from "react-hot-toast";

import TimetableGrid from "@/components/schedule/TimetableGrid";
import { ConfirmDialog, Dialog, EmptyState, ErrorState } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/forms";
import { Button, PageHeader, Skeleton, Surface } from "@/components/ui/primitives";
import { getErrorMessage, teacherAcademicApi, type ScheduleItem, type TeacherClassSummary } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const DAYS = [["Monday", "Thứ 2"], ["Tuesday", "Thứ 3"], ["Wednesday", "Thứ 4"], ["Thursday", "Thứ 5"], ["Friday", "Thứ 6"], ["Saturday", "Thứ 7"]];
const SUBJECTS = ["Toán", "Ngữ văn", "Tiếng Anh", "Vật lý", "Hóa học", "Sinh học", "Lịch sử", "Địa lý", "Tin học", "Công nghệ", "Thể dục", "GDCD"];
const INITIAL_FORM = { class_id: "", subject: "", day_of_week: "Monday", start_time: "07:00", end_time: "07:45", room: "", semester: "HK1", year: "2025-2026" };

export default function TeacherSchedulePage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [classes, setClasses] = useState<TeacherClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleItem | null>(null);
  const [deleting, setDeleting] = useState<ScheduleItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [scheduleData, classData] = await Promise.all([teacherAcademicApi.getSchedule(), teacherAcademicApi.getClasses()]);
      setSchedules(scheduleData);
      setClasses(classData);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải lịch giảng dạy."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const openCreate = (day = "Monday", start = "07:00") => {
    const endTimes: Record<string, string> = { "07:00": "07:45", "07:50": "08:35", "08:40": "09:25", "09:35": "10:20", "10:25": "11:10", "13:00": "13:45", "13:50": "14:35", "14:40": "15:25", "15:35": "16:20", "16:25": "17:10" };
    setEditing(null);
    setForm({ ...INITIAL_FORM, class_id: classes[0]?.id ? String(classes[0].id) : "", day_of_week: day, start_time: start, end_time: endTimes[start] || "" });
    setDialogOpen(true);
  };

  const openEdit = (item: ScheduleItem) => {
    setEditing(item);
    setForm({ class_id: String(item.class_id || ""), subject: item.subject, day_of_week: item.day_of_week, start_time: item.start_time, end_time: item.end_time, room: item.room || "", semester: item.semester || "HK1", year: item.year || "2025-2026" });
    setDialogOpen(true);
  };

  const saveSchedule = async () => {
    if (!form.subject || !form.day_of_week || !form.start_time || !form.end_time || (!editing && !form.class_id)) return;
    setBusy(true);
    const payload = { subject: form.subject, day_of_week: form.day_of_week, start_time: form.start_time, end_time: form.end_time, room: form.room || undefined, teacher_id: user?.id, semester: form.semester, year: form.year };
    try {
      if (editing) await teacherAcademicApi.updateSchedule(editing.id, payload);
      else await teacherAcademicApi.createSchedule({ ...payload, class_id: Number(form.class_id) });
      toast.success(editing ? "Đã cập nhật tiết học" : "Đã thêm tiết học");
      setDialogOpen(false);
      await loadData();
    } catch (saveError) {
      toast.error(getErrorMessage(saveError, "Không thể lưu tiết học."));
    } finally {
      setBusy(false);
    }
  };

  const deleteSchedule = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await teacherAcademicApi.deleteSchedule(deleting.id);
      toast.success("Đã xóa tiết học");
      setDeleting(null);
      setDialogOpen(false);
      await loadData();
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError, "Không thể xóa tiết học."));
    } finally {
      setBusy(false);
    }
  };

  const uniqueSubjects = new Set(schedules.map((item) => item.subject)).size;
  const morning = schedules.filter((item) => Number(item.start_time.slice(0, 2)) < 12).length;

  return (
    <>
      <PageHeader title="Thời khóa biểu" description="Quản lý lịch giảng dạy theo tuần. Chọn ô trống để thêm tiết, chọn tiết đã có để chỉnh sửa." actions={<Button onClick={() => openCreate()} disabled={!classes.length}><Plus className="size-4" />Thêm tiết học</Button>} />
      {error ? <ErrorState title="Không tải được lịch" description={error} action={<Button variant="secondary" onClick={() => void loadData()}>Thử lại</Button>} /> : loading ? <Skeleton className="h-[560px]" /> : !classes.length ? <Surface><EmptyState title="Chưa có lớp phụ trách" description="Cần có ít nhất một lớp được phân công trước khi tạo lịch giảng dạy." icon={CalendarDays} /></Surface> : <>
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
          { label: "Tổng tiết", value: schedules.length, icon: BookOpen }, { label: "Môn giảng dạy", value: uniqueSubjects, icon: Layers3 }, { label: "Tiết buổi sáng", value: morning, icon: CalendarDays }, { label: "Tiết buổi chiều", value: schedules.length - morning, icon: Clock3 },
        ].map(({ label, value, icon: Icon }) => <Surface key={label} className="flex items-center gap-3 p-4"><div className="grid size-10 place-items-center rounded-[10px] bg-brand-soft text-brand-strong"><Icon className="size-4" /></div><div><p className="text-xl font-extrabold text-ink">{value}</p><p className="text-xs font-bold text-ink-soft">{label}</p></div></Surface>)}</div>
        <TimetableGrid schedules={schedules} editable onCellClick={openCreate} onItemClick={openEdit} onDeleteItem={setDeleting} />
      </>}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? "Chỉnh sửa tiết học" : "Thêm tiết học"} description="Các tiết trùng thời gian trong cùng một lớp sẽ bị hệ thống từ chối." footer={<><Button variant="secondary" onClick={() => setDialogOpen(false)}>Hủy</Button>{editing && <Button variant="danger" onClick={() => setDeleting(editing)}>Xóa</Button>}<Button onClick={() => void saveSchedule()} disabled={busy || !form.subject || !form.class_id}>{busy ? "Đang lưu..." : "Lưu tiết học"}</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Lớp" name="schedule-class" required><Select value={form.class_id} onChange={(event) => setForm({ ...form, class_id: event.target.value })} disabled={Boolean(editing)}><option value="">Chọn lớp</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
          <Field label="Môn học" name="schedule-subject" required><Select value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })}><option value="">Chọn môn</option>{SUBJECTS.map((subject) => <option key={subject}>{subject}</option>)}</Select></Field>
          <Field label="Ngày học" name="schedule-day" required><Select value={form.day_of_week} onChange={(event) => setForm({ ...form, day_of_week: event.target.value })}>{DAYS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
          <Field label="Phòng học" name="schedule-room"><Input value={form.room} onChange={(event) => setForm({ ...form, room: event.target.value })} placeholder="Ví dụ: P201" /></Field>
          <Field label="Bắt đầu" name="schedule-start" required><Input type="time" value={form.start_time} onChange={(event) => setForm({ ...form, start_time: event.target.value })} /></Field>
          <Field label="Kết thúc" name="schedule-end" required><Input type="time" value={form.end_time} onChange={(event) => setForm({ ...form, end_time: event.target.value })} /></Field>
        </div>
      </Dialog>
      <ConfirmDialog open={Boolean(deleting)} title="Xóa tiết học?" description={deleting ? `Tiết ${deleting.subject} sẽ bị xóa khỏi thời khóa biểu.` : ""} confirmLabel="Xóa tiết" busy={busy} onClose={() => setDeleting(null)} onConfirm={() => void deleteSchedule()} />
    </>
  );
}
