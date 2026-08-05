"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Edit2, KeyRound, Mail, Plus, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";

import { adminApi, getErrorMessage } from "@/lib/api";
import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import { ConfirmDialog, Dialog, ErrorState } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/forms";
import { Button, PageHeader, Surface } from "@/components/ui/primitives";
import { FilterToolbar, Pagination } from "@/components/ui/workflow";

interface StudentAccount {
  id: number;
  email: string;
  name: string;
  role: string;
  class_id?: number;
  class_name?: string;
}

interface SchoolClass {
  id: number;
  name: string;
}

interface ImportResult {
  success: number;
  errors: string[];
}

const PAGE_SIZE = 10;

export default function StudentsManagement() {
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentAccount | null>(null);
  const [resetTarget, setResetTarget] = useState<StudentAccount | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", class_id: "" });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importClassId, setImportClassId] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentData, classData] = await Promise.all([adminApi.getUsers("student"), adminApi.getClasses()]);
      setStudents(studentData);
      setClasses(classData);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải dữ liệu học sinh."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi");
    return students.filter((student) => {
      const matchesSearch = !query || `${student.name} ${student.email}`.toLocaleLowerCase("vi").includes(query);
      const matchesClass = classFilter === "all" || String(student.class_id || "") === classFilter;
      return matchesSearch && matchesClass;
    });
  }, [classFilter, search, students]);

  useEffect(() => {
    setPage(1);
  }, [classFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const paginatedStudents = filteredStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setEditingStudent(null);
    setForm({ name: "", email: "", password: "", class_id: "" });
    setDialogOpen(true);
  };

  const openEdit = (student: StudentAccount) => {
    setEditingStudent(student);
    setForm({ name: student.name, email: student.email, password: "", class_id: student.class_id ? String(student.class_id) : "" });
    setDialogOpen(true);
  };

  const saveStudent = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const classId = form.class_id ? Number(form.class_id) : null;
    try {
      if (editingStudent) {
        await adminApi.updateUser(editingStudent.id, { name: form.name.trim(), email: form.email.trim(), class_id: classId });
        toast.success("Đã cập nhật học sinh.");
      } else {
        await adminApi.createUser({ ...form, name: form.name.trim(), email: form.email.trim(), class_id: classId, role: "student" });
        toast.success("Đã thêm học sinh.");
      }
      setDialogOpen(false);
      await loadData();
    } catch (saveError) {
      toast.error(getErrorMessage(saveError));
    } finally {
      setBusy(false);
    }
  };

  const deleteStudent = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await adminApi.deleteUser(deleteTarget.id);
      toast.success("Đã xóa học sinh.");
      setDeleteTarget(null);
      await loadData();
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError, "Không thể xóa học sinh."));
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    if (!resetTarget) return;
    setBusy(true);
    try {
      const result = await adminApi.resetPassword(resetTarget.id);
      toast.success(result.message || "Đã tạo mật khẩu tạm thời.");
      setResetTarget(null);
    } catch (resetError) {
      toast.error(getErrorMessage(resetError, "Không thể đặt lại mật khẩu."));
    } finally {
      setBusy(false);
    }
  };

  const importStudents = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!importFile || !importClassId) {
      toast.error("Chọn lớp học và file Excel trước khi import.");
      return;
    }
    setBusy(true);
    try {
      const result = await adminApi.importStudents(Number(importClassId), importFile);
      setImportResult({ success: result.success_count || 0, errors: result.errors || [] });
      if (result.success_count) {
        toast.success(`Đã import ${result.success_count} học sinh.`);
        await loadData();
      }
    } catch (importError) {
      toast.error(getErrorMessage(importError, "Không thể import danh sách."));
    } finally {
      setBusy(false);
    }
  };

  const closeImport = () => {
    if (busy) return;
    setImportOpen(false);
    setImportResult(null);
    setImportFile(null);
    setImportClassId("");
  };

  const columns: DataColumn<StudentAccount>[] = [
    {
      key: "student",
      header: "Học sinh",
      cell: (student) => {
        const initials = student.name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-emerald-50 text-xs font-extrabold text-success dark:bg-emerald-950/40">{initials}</div>
            <div><p className="font-bold text-ink">{student.name}</p><p className="text-xs text-ink-soft">Học sinh</p></div>
          </div>
        );
      },
    },
    {
      key: "class",
      header: "Lớp học",
      cell: (student) => student.class_name
        ? <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand-strong">{student.class_name}</span>
        : <span className="text-sm text-ink-soft">Chưa xếp lớp</span>,
    },
    {
      key: "email",
      header: "Email",
      cell: (student) => <span className="inline-flex items-center gap-2 text-ink-soft"><Mail className="size-4" aria-hidden="true" />{student.email}</span>,
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      cell: (student) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" aria-label={`Sửa ${student.name}`} onClick={() => openEdit(student)}><Edit2 className="size-4" /></Button>
          <Button variant="ghost" size="icon" aria-label={`Đặt lại mật khẩu cho ${student.name}`} onClick={() => setResetTarget(student)}><KeyRound className="size-4" /></Button>
          <Button variant="danger" size="icon" aria-label={`Xóa ${student.name}`} onClick={() => setDeleteTarget(student)}><Trash2 className="size-4" /></Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Quản lý học sinh"
        description={`${students.length} học sinh đang có tài khoản trên hệ thống.`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setImportOpen(true)}><Upload className="size-4" />Import Excel</Button>
            <Button onClick={openCreate}><Plus className="size-4" />Thêm học sinh</Button>
          </>
        }
      />

      {error ? (
        <ErrorState title="Không tải được học sinh" description={error} action={<Button variant="secondary" onClick={() => void loadData()}>Thử lại</Button>} />
      ) : (
        <Surface className="overflow-hidden">
          <FilterToolbar searchValue={search} onSearchChange={setSearch} searchLabel="Tìm theo tên hoặc email">
            <Select value={classFilter} onChange={(event) => setClassFilter(event.target.value)} aria-label="Lọc theo lớp" className="w-full sm:w-48">
              <option value="all">Tất cả lớp học</option>
              {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
            </Select>
          </FilterToolbar>
          <DataTable
            ariaLabel="Danh sách học sinh"
            columns={columns}
            rows={paginatedStudents}
            rowKey={(student) => student.id}
            loading={loading}
            emptyTitle="Không tìm thấy học sinh"
            emptyDescription="Thử bộ lọc khác hoặc thêm học sinh mới."
          />
          {!loading && filteredStudents.length > 0 && (
            <Pagination page={page} totalPages={totalPages} totalItems={filteredStudents.length} itemLabel="học sinh" onPageChange={setPage} />
          )}
        </Surface>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => !busy && setDialogOpen(false)}
        title={editingStudent ? "Cập nhật học sinh" : "Thêm học sinh"}
        description="Gán lớp ngay hoặc để trống và cập nhật sau."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)} disabled={busy}>Hủy</Button>
            <Button type="submit" form="student-form" disabled={busy}>{busy ? "Đang lưu..." : editingStudent ? "Lưu thay đổi" : "Tạo học sinh"}</Button>
          </>
        }
      >
        <form id="student-form" className="grid gap-5" onSubmit={saveStudent}>
          <Field label="Họ và tên" name="student-name" required>
            <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required autoComplete="name" />
          </Field>
          <Field label="Email" name="student-email" required>
            <Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required autoComplete="email" />
          </Field>
          <Field label="Lớp học" name="student-class" helper="Có thể thay đổi lớp sau khi tạo tài khoản.">
            <Select value={form.class_id} onChange={(event) => setForm((current) => ({ ...current, class_id: event.target.value }))}>
              <option value="">Chưa xếp lớp</option>
              {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
            </Select>
          </Field>
          {!editingStudent && (
            <Field label="Mật khẩu ban đầu" name="student-password" required helper="Ít nhất 8 ký tự. Học sinh nên đổi sau lần đăng nhập đầu tiên.">
              <Input type="password" minLength={8} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required autoComplete="new-password" />
            </Field>
          )}
        </form>
      </Dialog>

      <Dialog
        open={importOpen}
        onClose={closeImport}
        title="Import học sinh từ Excel"
        description="Dùng file mẫu để giữ đúng cấu trúc dữ liệu và thông báo lỗi theo từng dòng."
        footer={importResult ? (
          <Button onClick={closeImport}>Hoàn tất</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={closeImport} disabled={busy}>Hủy</Button>
            <Button type="submit" form="student-import-form" disabled={busy || !importFile || !importClassId}>{busy ? "Đang import..." : "Import học sinh"}</Button>
          </>
        )}
      >
        {importResult ? (
          <div className="grid gap-5">
            <div className="flex items-start gap-3 rounded-[12px] bg-emerald-50 p-4 dark:bg-emerald-950/30">
              <CheckCircle2 className="mt-0.5 size-5 text-success" aria-hidden="true" />
              <div><p className="font-extrabold text-ink">Đã thêm {importResult.success} học sinh</p><p className="mt-1 text-sm text-ink-soft">Kiểm tra các dòng lỗi bên dưới nếu kết quả chưa đầy đủ.</p></div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="max-h-52 overflow-y-auto rounded-[12px] border border-red-200 bg-red-50 p-4 text-sm text-danger dark:border-red-900 dark:bg-red-950/30">
                <ul className="grid gap-2">{importResult.errors.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
              </div>
            )}
          </div>
        ) : (
          <form id="student-import-form" className="grid gap-5" onSubmit={importStudents}>
            <Button type="button" variant="secondary" className="w-full" onClick={() => void adminApi.downloadStudentTemplate().catch((downloadError) => toast.error(getErrorMessage(downloadError, "Không thể tải file mẫu.")))}>
              <Download className="size-4" />Tải file mẫu .xlsx
            </Button>
            <Field label="Lớp nhận học sinh" name="import-class" required>
              <Select value={importClassId} onChange={(event) => setImportClassId(event.target.value)} required>
                <option value="">Chọn lớp học</option>
                {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}
              </Select>
            </Field>
            <Field label="File danh sách" name="import-file" required helper={importFile ? `Đã chọn: ${importFile.name}` : "Định dạng .xlsx hoặc .xls."}>
              <Input type="file" accept=".xlsx,.xls" onChange={(event) => setImportFile(event.target.files?.[0] || null)} required />
            </Field>
          </form>
        )}
      </Dialog>

      <ConfirmDialog open={Boolean(deleteTarget)} title="Xóa học sinh?" description={`Tài khoản ${deleteTarget?.name || "này"} sẽ bị xóa vĩnh viễn.`} confirmLabel="Xóa học sinh" busy={busy} onClose={() => setDeleteTarget(null)} onConfirm={() => void deleteStudent()} />
      <ConfirmDialog open={Boolean(resetTarget)} title="Đặt lại mật khẩu?" description={`Hệ thống sẽ tạo mật khẩu tạm thời một lần cho ${resetTarget?.name || "học sinh này"}.`} confirmLabel="Tạo mật khẩu tạm" tone="primary" busy={busy} onClose={() => setResetTarget(null)} onConfirm={() => void resetPassword()} />
    </>
  );
}
