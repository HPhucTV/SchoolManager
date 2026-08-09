"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import { ConfirmDialog, Dialog, ErrorState } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/forms";
import { Button, PageHeader, Surface } from "@/components/ui/primitives";
import { FilterToolbar, Pagination } from "@/components/ui/workflow";
import { assignmentsApi, getErrorMessage, teacherAcademicApi, type Assignment, type AssignmentQuestion, type AssignmentSubmission, type TeacherClassSummary } from "@/lib/api";

const PAGE_SIZE = 8;
const EMPTY_FORM = { title: "", description: "", subject: "", class_id: "", deadline: "" };
const NEW_QUESTION: AssignmentQuestion = { question_type: "multiple_choice", question_text: "", points: 1, option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "A" };

function formatDate(value?: string) {
  if (!value) return "Không giới hạn";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<TeacherClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [page, setPage] = useState(1);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [questions, setQuestions] = useState<AssignmentQuestion[]>([{ ...NEW_QUESTION }]);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<Assignment | null>(null);
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
  const [grades, setGrades] = useState<Record<number, { score: number; feedback: string }>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assignmentData, classData] = await Promise.all([assignmentsApi.list(), teacherAcademicApi.getClasses()]);
      setAssignments(assignmentData);
      setClasses(classData);
      const requestedClassId = new URLSearchParams(window.location.search).get("classId");
      if (requestedClassId && classData.some((item) => String(item.id) === requestedClassId)) {
        setClassFilter(requestedClassId);
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải danh sách bài tập."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const filtered = useMemo(() => assignments.filter((item) => (!classFilter || String(item.class_id) === classFilter) && `${item.title} ${item.subject || ""}`.toLowerCase().includes(search.toLowerCase())), [assignments, classFilter, search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, class_id: classFilter || (classes[0]?.id ? String(classes[0].id) : "") });
    setQuestions([{ ...NEW_QUESTION }]);
    setEditorOpen(true);
  };

  const openEdit = (item: Assignment) => {
    setEditing(item);
    setForm({ title: item.title, description: item.description || "", subject: item.subject || "", class_id: String(item.class_id), deadline: item.deadline?.slice(0, 16) || "" });
    setQuestions(item.questions.map((question) => ({ ...question })));
    setEditorOpen(true);
  };

  const updateQuestion = (index: number, patch: Partial<AssignmentQuestion>) => setQuestions((current) => current.map((question, questionIndex) => questionIndex === index ? { ...question, ...patch } : question));

  const saveAssignment = async () => {
    if (!form.title.trim() || !form.class_id || !questions.length || questions.some((question) => !question.question_text.trim())) return;
    setBusy(true);
    const totalPoints = questions.reduce((sum, question) => sum + Number(question.points || 0), 0);
    const payload = { title: form.title.trim(), description: form.description.trim() || undefined, subject: form.subject.trim() || undefined, class_id: Number(form.class_id), deadline: form.deadline || undefined, total_points: totalPoints, questions };
    try {
      if (editing) await assignmentsApi.update(editing.id, payload);
      else await assignmentsApi.create(payload);
      toast.success(editing ? "Đã cập nhật bài tập" : "Đã tạo bài tập");
      setEditorOpen(false);
      await loadData();
    } catch (saveError) {
      toast.error(getErrorMessage(saveError, "Không thể lưu bài tập."));
    } finally {
      setBusy(false);
    }
  };

  const removeAssignment = async () => {
    if (!deleting) return;
    setBusy(true);
    try { await assignmentsApi.remove(deleting.id); toast.success("Đã xóa bài tập"); setDeleting(null); await loadData(); }
    catch (deleteError) { toast.error(getErrorMessage(deleteError, "Không thể xóa bài tập.")); }
    finally { setBusy(false); }
  };

  const closeAssignment = async (item: Assignment) => {
    try { await assignmentsApi.close(item.id); toast.success("Đã đóng bài tập"); await loadData(); }
    catch (closeError) { toast.error(getErrorMessage(closeError, "Không thể đóng bài tập.")); }
  };

  const openSubmissions = async (item: Assignment) => {
    setSelectedAssignment(item);
    setSubmissionsOpen(true);
    setSubmissions([]);
    try { setSubmissions(await assignmentsApi.submissions(item.id)); }
    catch (submissionError) { toast.error(getErrorMessage(submissionError, "Không thể tải bài nộp.")); }
  };

  const openGrading = (submission: AssignmentSubmission) => {
    setSelectedSubmission(submission);
    setGrades(Object.fromEntries(submission.answers.map((answer) => [answer.id, { score: answer.score || 0, feedback: answer.feedback || "" }])));
  };

  const submitGrades = async () => {
    if (!selectedSubmission) return;
    setBusy(true);
    try {
      await assignmentsApi.grade(selectedSubmission.id, Object.entries(grades).map(([answerId, value]) => ({ answer_id: Number(answerId), score: Number(value.score), feedback: value.feedback || undefined })));
      toast.success("Đã lưu điểm");
      setSelectedSubmission(null);
      if (selectedAssignment) setSubmissions(await assignmentsApi.submissions(selectedAssignment.id));
      await loadData();
    } catch (gradeError) { toast.error(getErrorMessage(gradeError, "Không thể lưu điểm.")); }
    finally { setBusy(false); }
  };

  const columns: DataColumn<Assignment>[] = [
    { key: "assignment", header: "Bài tập", cell: (item) => <div><p className="font-extrabold text-ink">{item.title}</p><p className="mt-1 text-xs text-ink-soft">{item.subject || "Chưa phân môn"}</p></div> },
    { key: "class", header: "Lớp", cell: (item) => classes.find((entry) => entry.id === item.class_id)?.name || `#${item.class_id}` },
    { key: "deadline", header: "Hạn nộp", cell: (item) => formatDate(item.deadline) },
    { key: "submissions", header: "Bài nộp", align: "center", cell: (item) => <button className="font-extrabold text-brand-strong" onClick={() => void openSubmissions(item)}>{item.submission_count}</button> },
    { key: "status", header: "Trạng thái", cell: (item) => <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.status === "closed" ? "bg-surface-subtle text-ink-soft" : "bg-emerald-50 text-success"}`}>{item.status === "closed" ? "Đã đóng" : "Đang mở"}</span> },
    { key: "actions", header: "Thao tác", align: "right", cell: (item) => <div className="flex justify-end gap-1"><Button size="icon" variant="ghost" aria-label={`Xem bài nộp ${item.title}`} onClick={() => void openSubmissions(item)}><Eye className="size-4" /></Button><Button size="icon" variant="ghost" aria-label={`Sửa ${item.title}`} onClick={() => openEdit(item)}><Pencil className="size-4" /></Button>{item.status !== "closed" && <Button size="icon" variant="ghost" aria-label={`Đóng ${item.title}`} onClick={() => void closeAssignment(item)}><Lock className="size-4" /></Button>}<Button size="icon" variant="ghost" aria-label={`Xóa ${item.title}`} className="text-danger" onClick={() => setDeleting(item)}><Trash2 className="size-4" /></Button></div> },
  ];

  return (
    <>
      <PageHeader title="Bài tập" description="Tạo nội dung, theo dõi lượt nộp và chấm điểm trong một workflow thống nhất." actions={<Button onClick={openCreate} disabled={!classes.length}><Plus className="size-4" />Tạo bài tập</Button>} />
      {error ? <ErrorState title="Không tải được bài tập" description={error} action={<Button variant="secondary" onClick={() => void loadData()}>Thử lại</Button>} /> : <Surface className="overflow-hidden"><FilterToolbar searchValue={search} onSearchChange={(value) => { setSearch(value); setPage(1); }} searchLabel="Tìm theo tên hoặc môn"><Select aria-label="Lọc theo lớp" value={classFilter} onChange={(event) => { setClassFilter(event.target.value); setPage(1); }} className="w-44"><option value="">Tất cả lớp</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></FilterToolbar><DataTable ariaLabel="Danh sách bài tập" columns={columns} rows={rows} rowKey={(item) => item.id} loading={loading} emptyTitle="Chưa có bài tập" emptyDescription="Tạo bài tập đầu tiên để giao cho lớp." /><Pagination page={Math.min(page, totalPages)} totalPages={totalPages} totalItems={filtered.length} itemLabel="bài tập" onPageChange={setPage} /></Surface>}

      <Dialog open={editorOpen} onClose={() => setEditorOpen(false)} title={editing ? "Chỉnh sửa bài tập" : "Tạo bài tập"} description="Mỗi câu hỏi cần nội dung và số điểm. Tổng điểm được tính tự động." size="large" footer={<><Button variant="secondary" onClick={() => setEditorOpen(false)}>Hủy</Button><Button onClick={() => void saveAssignment()} disabled={busy || !form.title || !form.class_id || questions.some((question) => !question.question_text)}>{busy ? "Đang lưu..." : "Lưu bài tập"}</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Tên bài tập" name="assignment-title" required><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field><Field label="Lớp" name="assignment-class" required><Select value={form.class_id} onChange={(event) => setForm({ ...form, class_id: event.target.value })}>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field><Field label="Môn học" name="assignment-subject"><Input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /></Field><Field label="Hạn nộp" name="assignment-deadline"><Input type="datetime-local" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} /></Field><Field label="Mô tả" name="assignment-description" className="sm:col-span-2"><Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field></div>
        <div className="mt-6 flex items-center justify-between"><h3 className="font-extrabold text-ink">Câu hỏi ({questions.length})</h3><div className="flex gap-2"><Button size="small" variant="secondary" onClick={() => setQuestions([...questions, { ...NEW_QUESTION }])}>Trắc nghiệm</Button><Button size="small" variant="secondary" onClick={() => setQuestions([...questions, { question_type: "essay", question_text: "", points: 1 }])}>Tự luận</Button></div></div>
        <div className="mt-3 grid gap-3">{questions.map((question, index) => <div key={index} className="rounded-[12px] border border-line bg-surface-subtle/60 p-4"><div className="flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-brand-soft text-sm font-extrabold text-brand-strong">{index + 1}</span><div className="grid min-w-0 flex-1 gap-3"><div className="grid gap-3 sm:grid-cols-[1fr_120px_44px]"><Input aria-label={`Nội dung câu ${index + 1}`} value={question.question_text} onChange={(event) => updateQuestion(index, { question_text: event.target.value })} placeholder="Nhập nội dung câu hỏi" /><Input aria-label={`Điểm câu ${index + 1}`} type="number" min="0" value={question.points} onChange={(event) => updateQuestion(index, { points: Number(event.target.value) })} /><Button size="icon" variant="ghost" className="text-danger" aria-label={`Xóa câu ${index + 1}`} onClick={() => setQuestions(questions.filter((_, itemIndex) => itemIndex !== index))} disabled={questions.length === 1}><Trash2 className="size-4" /></Button></div>{question.question_type === "multiple_choice" && <div className="grid gap-2 sm:grid-cols-2">{(["option_a", "option_b", "option_c", "option_d"] as const).map((key, optionIndex) => <Input key={key} aria-label={`Đáp án ${String.fromCharCode(65 + optionIndex)} câu ${index + 1}`} value={question[key] || ""} onChange={(event) => updateQuestion(index, { [key]: event.target.value })} placeholder={`Đáp án ${String.fromCharCode(65 + optionIndex)}`} />)}<Select aria-label={`Đáp án đúng câu ${index + 1}`} value={question.correct_answer || "A"} onChange={(event) => updateQuestion(index, { correct_answer: event.target.value })}><option value="A">Đáp án đúng: A</option><option value="B">Đáp án đúng: B</option><option value="C">Đáp án đúng: C</option><option value="D">Đáp án đúng: D</option></Select></div>}</div></div></div>)}</div>
      </Dialog>

      <Dialog open={submissionsOpen} onClose={() => setSubmissionsOpen(false)} title={`Bài nộp: ${selectedAssignment?.title || ""}`} description={`${submissions.length} học sinh đã nộp bài.`} size="large"><DataTable ariaLabel="Danh sách bài nộp" columns={[{ key: "student", header: "Học sinh", cell: (item: AssignmentSubmission) => <span className="font-bold">{item.student_name}</span> }, { key: "time", header: "Thời gian nộp", cell: (item: AssignmentSubmission) => formatDate(item.submitted_at) }, { key: "score", header: "Điểm", cell: (item: AssignmentSubmission) => item.status === "graded" ? item.total_score : "Chưa chấm" }, { key: "action", header: "", align: "right", cell: (item: AssignmentSubmission) => <Button size="small" variant="secondary" onClick={() => openGrading(item)}>Chấm bài</Button> }]} rows={submissions} rowKey={(item) => item.id} emptyTitle="Chưa có bài nộp" emptyDescription="Bài nộp của học sinh sẽ xuất hiện tại đây." /></Dialog>

      <Dialog open={Boolean(selectedSubmission)} onClose={() => setSelectedSubmission(null)} title={`Chấm bài: ${selectedSubmission?.student_name || ""}`} description={`Điểm tối đa ${selectedAssignment?.total_points || 0}.`} size="large" footer={<><Button variant="secondary" onClick={() => setSelectedSubmission(null)}>Hủy</Button><Button onClick={() => void submitGrades()} disabled={busy}>{busy ? "Đang lưu..." : "Lưu điểm"}</Button></>}><div className="grid gap-3">{selectedSubmission?.answers.map((answer, index) => { const question = selectedAssignment?.questions.find((item) => item.id === answer.question_id); const grade = grades[answer.id] || { score: 0, feedback: "" }; return <div key={answer.id} className="rounded-[12px] border border-line p-4"><p className="text-sm font-extrabold text-ink">Câu {index + 1}: {question?.question_text || "Câu hỏi"}</p><p className="mt-2 rounded-[8px] bg-surface-subtle p-3 text-sm text-ink">{answer.answer_text || "Không có câu trả lời"}</p><div className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr]"><Field label={`Điểm / ${question?.points ?? 0}`} name={`grade-${answer.id}`}><Input type="number" min="0" max={question?.points ?? undefined} value={grade.score} onChange={(event) => setGrades({ ...grades, [answer.id]: { ...grade, score: Number(event.target.value) } })} /></Field><Field label="Nhận xét" name={`feedback-${answer.id}`}><Input value={grade.feedback} onChange={(event) => setGrades({ ...grades, [answer.id]: { ...grade, feedback: event.target.value } })} /></Field></div></div>; })}</div></Dialog>
      <ConfirmDialog open={Boolean(deleting)} title="Xóa bài tập?" description={deleting ? `Bài tập “${deleting.title}” cùng toàn bộ bài nộp liên quan sẽ bị xóa.` : ""} confirmLabel="Xóa bài tập" busy={busy} onClose={() => setDeleting(null)} onConfirm={() => void removeAssignment()} />
    </>
  );
}
