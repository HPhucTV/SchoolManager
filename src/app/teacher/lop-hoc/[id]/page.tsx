"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Bell, BookOpenCheck, CheckCircle2, ClipboardList, Copy, Pencil, Users } from "lucide-react";
import toast from "react-hot-toast";

import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import { Dialog, EmptyState, ErrorState } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/forms";
import { Button, PageHeader, Skeleton, Surface } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/workflow";
import { apiRequest, getErrorMessage, insightsApi, type ClassGradebook, type GradebookStudent } from "@/lib/api";

interface ClassDetails {
  id: number;
  name: string;
  grade?: string | null;
  teacher_name?: string | null;
  student_count: number;
  class_code?: string | null;
  created_at?: string | null;
}

interface ClassStudent {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
}

function scoreLabel(score?: number | null) {
  return score === null || score === undefined ? "Chưa có" : `${score}%`;
}

export default function TeacherClassDetailsPage() {
  const params = useParams<{ id: string }>();
  const classId = Number(params.id);
  const [classData, setClassData] = useState<ClassDetails | null>(null);
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [gradebook, setGradebook] = useState<ClassGradebook | null>(null);
  const [gradebookPage, setGradebookPage] = useState(1);
  const [gradebookLoading, setGradebookLoading] = useState(false);
  const [gradebookError, setGradebookError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", grade: "" });
  const [notificationForm, setNotificationForm] = useState({ title: "", message: "" });

  const loadData = useCallback(async () => {
    if (!Number.isInteger(classId) || classId <= 0) {
      setError("Mã lớp học không hợp lệ.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [details, roster, gradebookData] = await Promise.all([
        apiRequest<ClassDetails>(`/api/classes/${classId}`, { cache: "no-store" }),
        apiRequest<ClassStudent[]>(`/api/classes/${classId}/students`, { cache: "no-store" }),
        insightsApi.getClassGradebook(classId, 1, 50),
      ]);
      setClassData(details);
      setStudents(roster);
      setGradebook(gradebookData);
      setGradebookPage(1);
      setGradebookError(null);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải thông tin lớp học."));
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => { void loadData(); }, [loadData]);

  const loadGradebookPage = async (page: number) => {
    setGradebookLoading(true);
    setGradebookError(null);
    try {
      const gradebookData = await insightsApi.getClassGradebook(classId, page, 50);
      setGradebook(gradebookData);
      setGradebookPage(page);
    } catch (loadError) {
      setGradebookError(getErrorMessage(loadError, "Không thể tải trang sổ điểm này."));
    } finally {
      setGradebookLoading(false);
    }
  };

  const openEdit = () => {
    if (!classData) return;
    setEditForm({ name: classData.name, grade: classData.grade || "" });
    setEditOpen(true);
  };

  const updateClass = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editForm.name.trim()) return;
    setBusy(true);
    try {
      const updated = await apiRequest<ClassDetails>(`/api/classes/${classId}`, {
        method: "PUT",
        body: JSON.stringify({ name: editForm.name.trim(), grade: editForm.grade }),
      });
      setClassData(updated);
      setEditOpen(false);
      toast.success("Đã cập nhật lớp học.");
    } catch (updateError) {
      toast.error(getErrorMessage(updateError, "Không thể cập nhật lớp học."));
    } finally {
      setBusy(false);
    }
  };

  const sendNotification = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!notificationForm.title.trim() || !notificationForm.message.trim()) return;
    setBusy(true);
    try {
      const result = await apiRequest<{ count: number }>("/api/notifications", {
        method: "POST",
        body: JSON.stringify({
          title: notificationForm.title.trim(),
          message: notificationForm.message.trim(),
          class_id: classId,
        }),
      });
      setNotificationForm({ title: "", message: "" });
      setNotificationOpen(false);
      toast.success(result.count ? `Đã gửi cho ${result.count} học sinh.` : "Lớp chưa có học sinh để nhận thông báo.");
    } catch (sendError) {
      toast.error(getErrorMessage(sendError, "Không thể gửi thông báo."));
    } finally {
      setBusy(false);
    }
  };

  const copyClassCode = async () => {
    if (!classData?.class_code) return;
    await navigator.clipboard.writeText(classData.class_code);
    toast.success("Đã sao chép mã lớp.");
  };

  const rosterColumns = useMemo<DataColumn<ClassStudent>[]>(() => [
    {
      key: "student",
      header: "Học sinh",
      cell: (student) => (
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-brand-soft text-xs font-extrabold text-brand-strong">
            {student.name.split(/\s+/).map((part) => part[0]).join("").toUpperCase().slice(0, 2)}
          </span>
          <span className="font-extrabold text-ink">{student.name}</span>
        </div>
      ),
    },
    { key: "email", header: "Email", cell: (student) => <span className="text-ink-soft">{student.email}</span> },
  ], []);

  const gradebookColumns = useMemo<DataColumn<GradebookStudent>[]>(() => [
    {
      key: "student",
      header: "Học sinh",
      cell: (student) => (
        <div>
          <p className="font-extrabold text-ink">{student.student_name}</p>
          <p className="mt-1 text-xs text-ink-soft">{student.student_email}</p>
        </div>
      ),
    },
    { key: "assignments", header: "Bài tập", align: "right", cell: (student) => <span className="font-bold">{scoreLabel(student.assignment_average)}</span> },
    { key: "quizzes", header: "Kiểm tra", align: "right", cell: (student) => <span className="font-bold">{scoreLabel(student.quiz_average)}</span> },
    { key: "average", header: "Trung bình", align: "right", cell: (student) => <span className="font-extrabold text-ink">{scoreLabel(student.overall_average)}</span> },
    { key: "graded", header: "Đã chấm / tổng", align: "center", cell: (student) => <span className="font-bold">{student.graded_items} / {student.total_items}</span> },
    {
      key: "attention",
      header: "Cần chú ý",
      cell: (student) => student.needs_attention ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-coral-soft px-2.5 py-1 text-xs font-extrabold text-coral">
          <AlertTriangle className="size-3.5" aria-hidden="true" />
          {student.missing_items ? `${student.missing_items} bài quá hạn` : "Cần ôn lại"}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-mint">
          <CheckCircle2 className="size-3.5" aria-hidden="true" />Không có
        </span>
      ),
    },
  ], []);

  if (loading) {
    return <><Skeleton className="h-20" /><div className="mt-5 grid gap-5 lg:grid-cols-3"><Skeleton className="h-48 lg:col-span-1" /><Skeleton className="h-80 lg:col-span-2" /></div></>;
  }

  if (error || !classData) {
    return <ErrorState title="Không tải được lớp học" description={error || "Không tìm thấy lớp học."} action={<Button variant="secondary" onClick={() => void loadData()}>Thử lại</Button>} />;
  }

  return (
    <>
      <Link href="/teacher/lop-hoc" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-ink-soft hover:text-brand-strong">
        <ArrowLeft className="size-4" />Danh sách lớp học
      </Link>
      <PageHeader
        title={classData.name}
        description={`${classData.grade ? `Khối ${classData.grade}` : "Chưa phân khối"} · ${students.length} học sinh${classData.teacher_name ? ` · Giáo viên ${classData.teacher_name}` : ""}`}
        actions={<><Button variant="secondary" onClick={() => setNotificationOpen(true)} disabled={!students.length}><Bell className="size-4" />Gửi thông báo</Button><Button onClick={openEdit}><Pencil className="size-4" />Chỉnh sửa</Button></>}
      />

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="grid content-start gap-5">
          <Surface className="p-5">
            <h2 className="text-base font-extrabold text-ink">Thông tin lớp</h2>
            <dl className="mt-4 grid gap-4 text-sm">
              <div className="flex items-center justify-between gap-4"><dt className="text-ink-soft">Sĩ số</dt><dd className="font-extrabold text-ink">{students.length} học sinh</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-ink-soft">Khối</dt><dd className="font-extrabold text-ink">{classData.grade || "Chưa phân"}</dd></div>
              <div className="border-t border-line pt-4">
                <dt className="text-ink-soft">Mã tham gia lớp</dt>
                {classData.class_code ? <dd className="mt-2 flex gap-2"><code className="flex-1 rounded-[9px] bg-surface-subtle px-3 py-2 text-center font-extrabold tracking-[0.12em] text-brand-strong">{classData.class_code}</code><Button size="icon" variant="secondary" aria-label="Sao chép mã lớp" onClick={() => void copyClassCode()}><Copy className="size-4" /></Button></dd> : <dd className="mt-1 text-ink-soft">Chưa có mã lớp</dd>}
              </div>
            </dl>
          </Surface>

          <Surface className="p-5">
            <h2 className="text-base font-extrabold text-ink">Công việc giảng dạy</h2>
            <div className="mt-4 grid gap-2">
              <Link href={`/teacher/bai-tap?classId=${classId}`} className="inline-flex min-h-11 items-center gap-3 rounded-[10px] border border-line px-3.5 text-sm font-bold text-ink hover:border-brand/40 hover:bg-brand-soft"><ClipboardList className="size-4 text-brand" />Bài tập của lớp</Link>
              <Link href={`/teacher/kiem-tra?classId=${classId}`} className="inline-flex min-h-11 items-center gap-3 rounded-[10px] border border-line px-3.5 text-sm font-bold text-ink hover:border-brand/40 hover:bg-brand-soft"><BookOpenCheck className="size-4 text-brand" />Bài kiểm tra của lớp</Link>
            </div>
          </Surface>
        </div>

        <Surface className="overflow-hidden">
          <div className="flex items-center gap-3 border-b border-line px-5 py-4">
            <div className="grid size-10 place-items-center rounded-[11px] bg-brand-soft text-brand-strong"><Users className="size-5" /></div>
            <div><h2 className="font-extrabold text-ink">Danh sách học sinh</h2><p className="text-xs text-ink-soft">Thành viên đang tham gia lớp học này.</p></div>
          </div>
          {students.length ? <DataTable ariaLabel="Danh sách học sinh trong lớp" columns={rosterColumns} rows={students} rowKey={(student) => student.id} /> : <EmptyState title="Lớp chưa có học sinh" description="Chia sẻ mã lớp để học sinh tự tham gia." icon={Users} />}
        </Surface>
      </div>

      <section className="mt-7" aria-labelledby="class-gradebook-title">
        <div className="mb-3">
          <h2 id="class-gradebook-title" className="text-base font-extrabold text-ink">Sổ điểm gọn</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {gradebook ? `${gradebook.assignment_count} bài tập · ${gradebook.quiz_count} bài kiểm tra` : "Điểm đã chấm của lớp."}
          </p>
        </div>
        <Surface className="overflow-hidden">
          {gradebookError ? (
            <ErrorState title="Không tải được sổ điểm" description={gradebookError} action={<Button variant="secondary" onClick={() => void loadGradebookPage(gradebookPage)}>Thử lại</Button>} />
          ) : gradebook ? (
            <>
              <DataTable
                ariaLabel="Sổ điểm của lớp"
                columns={gradebookColumns}
                rows={gradebook.students}
                rowKey={(student) => student.student_id}
                loading={gradebookLoading}
                emptyTitle="Chưa có học sinh trong sổ điểm"
                emptyDescription="Học sinh sẽ xuất hiện sau khi tham gia lớp."
              />
              <Pagination
                page={gradebook.pagination.page}
                totalPages={gradebook.pagination.total_pages}
                totalItems={gradebook.pagination.total_items}
                itemLabel="học sinh"
                onPageChange={(page) => void loadGradebookPage(page)}
              />
            </>
          ) : null}
        </Surface>
      </section>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Chỉnh sửa lớp học" description="Cập nhật tên và khối lớp." footer={<><Button variant="secondary" onClick={() => setEditOpen(false)} disabled={busy}>Hủy</Button><Button type="submit" form="edit-class-form" disabled={busy || !editForm.name.trim()}>{busy ? "Đang lưu..." : "Lưu thay đổi"}</Button></>}>
        <form id="edit-class-form" className="grid gap-5" onSubmit={updateClass}>
          <Field label="Tên lớp" name="class-name" required><Input value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} /></Field>
          <Field label="Khối lớp" name="class-grade"><Select value={editForm.grade} onChange={(event) => setEditForm((current) => ({ ...current, grade: event.target.value }))}><option value="">Chưa phân khối</option><option value="10">Khối 10</option><option value="11">Khối 11</option><option value="12">Khối 12</option><option value="Khác">Khác</option></Select></Field>
        </form>
      </Dialog>

      <Dialog open={notificationOpen} onClose={() => setNotificationOpen(false)} title="Gửi thông báo cho lớp" description={`Thông báo sẽ xuất hiện trong hộp thư của ${students.length} học sinh.`} footer={<><Button variant="secondary" onClick={() => setNotificationOpen(false)} disabled={busy}>Hủy</Button><Button type="submit" form="class-notification-form" disabled={busy || !notificationForm.title.trim() || !notificationForm.message.trim()}>{busy ? "Đang gửi..." : "Gửi thông báo"}</Button></>}>
        <form id="class-notification-form" className="grid gap-5" onSubmit={sendNotification}>
          <Field label="Tiêu đề" name="notification-title" required><Input value={notificationForm.title} onChange={(event) => setNotificationForm((current) => ({ ...current, title: event.target.value }))} /></Field>
          <Field label="Nội dung" name="notification-message" required><Textarea value={notificationForm.message} onChange={(event) => setNotificationForm((current) => ({ ...current, message: event.target.value }))} /></Field>
        </form>
      </Dialog>
    </>
  );
}
