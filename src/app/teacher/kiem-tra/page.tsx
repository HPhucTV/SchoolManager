"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Play, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import { ConfirmDialog, Dialog, ErrorState } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/forms";
import { Button, PageHeader, Surface } from "@/components/ui/primitives";
import { FilterToolbar, Pagination } from "@/components/ui/workflow";
import { getErrorMessage, teacherAcademicApi, teacherQuizzesApi, type TeacherClassSummary, type TeacherQuiz } from "@/lib/api";

const PAGE_SIZE = 8;
const INITIAL_FORM = { title: "", subject: "", topic: "", class_id: "", easy_count: 3, medium_count: 4, hard_count: 3, deadline: "", allow_retake: false, show_answers: true };

function formatDate(value?: string | null) {
  if (!value) return "Không giới hạn";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function statusMeta(status: TeacherQuiz["status"]) {
  if (status === "active") return { label: "Đang mở", className: "bg-emerald-50 text-success" };
  if (status === "closed") return { label: "Đã đóng", className: "bg-surface-subtle text-ink-soft" };
  return { label: "Bản nháp", className: "bg-amber-50 text-amber-800" };
}

export default function TeacherQuizzesPage() {
  const [quizzes, setQuizzes] = useState<TeacherQuiz[]>([]);
  const [classes, setClasses] = useState<TeacherClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<TeacherQuiz | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [quizData, classData] = await Promise.all([teacherQuizzesApi.list(), teacherAcademicApi.getClasses()]);
      setQuizzes(quizData);
      setClasses(classData);
      const requestedClassId = new URLSearchParams(window.location.search).get("classId");
      if (requestedClassId && classData.some((item) => String(item.id) === requestedClassId)) {
        setClassFilter(requestedClassId);
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải danh sách bài kiểm tra."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const filtered = useMemo(() => quizzes.filter((quiz) => (!classFilter || String(quiz.class_id) === classFilter) && (!status || quiz.status === status) && `${quiz.title} ${quiz.subject || ""} ${quiz.topic || ""}`.toLowerCase().includes(search.toLowerCase())), [quizzes, classFilter, search, status]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setForm({ ...INITIAL_FORM, class_id: classFilter || (classes[0]?.id ? String(classes[0].id) : "") });
    setDialogOpen(true);
  };

  const createQuiz = async () => {
    const totalQuestions = Number(form.easy_count) + Number(form.medium_count) + Number(form.hard_count);
    if (!form.title.trim() || !form.subject.trim() || !form.topic.trim() || !form.class_id || totalQuestions <= 0) return;
    setBusy(true);
    try {
      await teacherQuizzesApi.create({ ...form, title: form.title.trim(), subject: form.subject.trim(), topic: form.topic.trim(), class_id: Number(form.class_id), deadline: form.deadline || null });
      toast.success("Đã tạo bản nháp bài kiểm tra");
      setDialogOpen(false);
      await loadData();
    } catch (createError) { toast.error(getErrorMessage(createError, "Không thể tạo bài kiểm tra.")); }
    finally { setBusy(false); }
  };

  const setQuizStatus = async (quiz: TeacherQuiz, nextStatus: TeacherQuiz["status"]) => {
    try { await teacherQuizzesApi.setStatus(quiz.id, nextStatus); toast.success(nextStatus === "active" ? "Đã mở bài kiểm tra" : "Đã đóng bài kiểm tra"); await loadData(); }
    catch (statusError) { toast.error(getErrorMessage(statusError, "Không thể đổi trạng thái.")); }
  };

  const removeQuiz = async () => {
    if (!deleting) return;
    setBusy(true);
    try { await teacherQuizzesApi.remove(deleting.id); toast.success("Đã xóa bài kiểm tra"); setDeleting(null); await loadData(); }
    catch (deleteError) { toast.error(getErrorMessage(deleteError, "Không thể xóa bài kiểm tra.")); }
    finally { setBusy(false); }
  };

  const columns: DataColumn<TeacherQuiz>[] = [
    { key: "quiz", header: "Bài kiểm tra", cell: (quiz) => <div><p className="font-extrabold text-ink">{quiz.title}</p><p className="mt-1 text-xs text-ink-soft">{quiz.subject || "Chưa phân môn"} · {quiz.topic || "Chưa có chủ đề"}</p></div> },
    { key: "class", header: "Lớp", cell: (quiz) => classes.find((entry) => entry.id === quiz.class_id)?.name || `#${quiz.class_id}` },
    { key: "questions", header: "Số câu", align: "center", cell: (quiz) => <span className="font-extrabold">{quiz.total_questions}</span> },
    { key: "deadline", header: "Hạn làm", cell: (quiz) => formatDate(quiz.deadline) },
    { key: "status", header: "Trạng thái", cell: (quiz) => { const meta = statusMeta(quiz.status); return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${meta.className}`}>{meta.label}</span>; } },
    { key: "actions", header: "Thao tác", align: "right", cell: (quiz) => <div className="flex justify-end gap-1">{quiz.status === "draft" && <Button size="small" variant="secondary" onClick={() => void setQuizStatus(quiz, "active")}><Play className="size-3.5" />Mở bài</Button>}{quiz.status === "active" && <Button size="small" variant="secondary" onClick={() => void setQuizStatus(quiz, "closed")}><CheckCircle2 className="size-3.5" />Đóng bài</Button>}<Button size="icon" variant="ghost" className="text-danger" aria-label={`Xóa ${quiz.title}`} onClick={() => setDeleting(quiz)}><Trash2 className="size-4" /></Button></div> },
  ];

  const totalQuestions = Number(form.easy_count) + Number(form.medium_count) + Number(form.hard_count);

  return (
    <>
      <PageHeader title="Bài kiểm tra" description="Tạo đề từ ngân hàng câu hỏi nội bộ, phát hành cho lớp và quản lý trạng thái làm bài." actions={<Button onClick={openCreate} disabled={!classes.length}><Plus className="size-4" />Tạo bài kiểm tra</Button>} />
      {error ? <ErrorState title="Không tải được bài kiểm tra" description={error} action={<Button variant="secondary" onClick={() => void loadData()}>Thử lại</Button>} /> : <Surface className="overflow-hidden"><FilterToolbar searchValue={search} onSearchChange={(value) => { setSearch(value); setPage(1); }} searchLabel="Tìm theo tên, môn hoặc chủ đề"><Select aria-label="Lọc theo lớp" value={classFilter} onChange={(event) => { setClassFilter(event.target.value); setPage(1); }} className="w-44"><option value="">Tất cả lớp</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Select aria-label="Lọc trạng thái" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="w-40"><option value="">Tất cả trạng thái</option><option value="draft">Bản nháp</option><option value="active">Đang mở</option><option value="closed">Đã đóng</option></Select></FilterToolbar><DataTable ariaLabel="Danh sách bài kiểm tra" columns={columns} rows={rows} rowKey={(quiz) => quiz.id} loading={loading} emptyTitle="Chưa có bài kiểm tra" emptyDescription="Tạo đề đầu tiên từ ngân hàng câu hỏi của hệ thống." /><Pagination page={Math.min(page, totalPages)} totalPages={totalPages} totalItems={filtered.length} itemLabel="bài kiểm tra" onPageChange={setPage} /></Surface>}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Tạo bài kiểm tra" description="Hệ thống chọn câu hỏi từ ngân hàng nội bộ theo chủ đề và mức độ đã chọn." size="large" footer={<><Button variant="secondary" onClick={() => setDialogOpen(false)}>Hủy</Button><Button onClick={() => void createQuiz()} disabled={busy || !form.title || !form.subject || !form.topic || !form.class_id || totalQuestions <= 0}>{busy ? "Đang tạo đề..." : `Tạo đề ${totalQuestions} câu`}</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Tên bài kiểm tra" name="quiz-title" required><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field><Field label="Lớp" name="quiz-class" required><Select value={form.class_id} onChange={(event) => setForm({ ...form, class_id: event.target.value })}>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field><Field label="Môn học" name="quiz-subject" required><Input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="Ví dụ: Toán" /></Field><Field label="Chủ đề" name="quiz-topic" required><Input value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} placeholder="Ví dụ: Phương trình bậc hai" /></Field><Field label="Hạn làm bài" name="quiz-deadline"><Input type="datetime-local" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} /></Field></div>
        <div className="mt-6"><div className="flex items-center justify-between"><h3 className="font-extrabold text-ink">Cấu trúc đề</h3><span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-extrabold text-brand-strong">{totalQuestions} câu</span></div><div className="mt-3 grid gap-3 sm:grid-cols-3"><Field label="Câu dễ" name="quiz-easy"><Input type="number" min="0" max="30" value={form.easy_count} onChange={(event) => setForm({ ...form, easy_count: Number(event.target.value) })} /></Field><Field label="Câu trung bình" name="quiz-medium"><Input type="number" min="0" max="30" value={form.medium_count} onChange={(event) => setForm({ ...form, medium_count: Number(event.target.value) })} /></Field><Field label="Câu khó" name="quiz-hard"><Input type="number" min="0" max="30" value={form.hard_count} onChange={(event) => setForm({ ...form, hard_count: Number(event.target.value) })} /></Field></div></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="flex min-h-11 items-center gap-3 rounded-[10px] border border-line px-3.5 text-sm font-bold text-ink"><input type="checkbox" checked={form.allow_retake} onChange={(event) => setForm({ ...form, allow_retake: event.target.checked })} />Cho phép làm lại</label><label className="flex min-h-11 items-center gap-3 rounded-[10px] border border-line px-3.5 text-sm font-bold text-ink"><input type="checkbox" checked={form.show_answers} onChange={(event) => setForm({ ...form, show_answers: event.target.checked })} />Hiển thị đáp án sau khi nộp</label></div>
      </Dialog>
      <ConfirmDialog open={Boolean(deleting)} title="Xóa bài kiểm tra?" description={deleting ? `Bài kiểm tra “${deleting.title}” cùng kết quả liên quan sẽ bị xóa.` : ""} confirmLabel="Xóa bài kiểm tra" busy={busy} onClose={() => setDeleting(null)} onConfirm={() => void removeQuiz()} />
    </>
  );
}
