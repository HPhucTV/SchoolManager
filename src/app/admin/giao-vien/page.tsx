"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit2, KeyRound, Mail, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { adminApi, getErrorMessage } from "@/lib/api";
import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import { ConfirmDialog, Dialog, ErrorState } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/forms";
import { Button, PageHeader, Surface } from "@/components/ui/primitives";
import { FilterToolbar, Pagination } from "@/components/ui/workflow";

interface Teacher {
  id: number;
  email: string;
  name: string;
  role: string;
  class_name?: string;
}

const PAGE_SIZE = 10;

export default function TeachersManagement() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);
  const [resetTarget, setResetTarget] = useState<Teacher | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const loadTeachers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTeachers(await adminApi.getUsers("teacher"));
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải danh sách giáo viên."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTeachers();
  }, [loadTeachers]);

  const filteredTeachers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi");
    if (!query) return teachers;
    return teachers.filter((teacher) =>
      `${teacher.name} ${teacher.email} ${teacher.class_name || ""}`.toLocaleLowerCase("vi").includes(query),
    );
  }, [search, teachers]);

  const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / PAGE_SIZE));
  const paginatedTeachers = filteredTeachers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const openCreate = () => {
    setEditingTeacher(null);
    setForm({ name: "", email: "", password: "" });
    setDialogOpen(true);
  };

  const openEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setForm({ name: teacher.name, email: teacher.email, password: "" });
    setDialogOpen(true);
  };

  const saveTeacher = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (editingTeacher) {
        await adminApi.updateUser(editingTeacher.id, { name: form.name.trim(), email: form.email.trim() });
        toast.success("Đã cập nhật giáo viên.");
      } else {
        await adminApi.createUser({ ...form, name: form.name.trim(), email: form.email.trim(), role: "teacher" });
        toast.success("Đã thêm giáo viên.");
      }
      setDialogOpen(false);
      await loadTeachers();
    } catch (saveError) {
      toast.error(getErrorMessage(saveError));
    } finally {
      setBusy(false);
    }
  };

  const deleteTeacher = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await adminApi.deleteUser(deleteTarget.id);
      toast.success("Đã xóa giáo viên.");
      setDeleteTarget(null);
      await loadTeachers();
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError, "Không thể xóa giáo viên."));
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

  const columns: DataColumn<Teacher>[] = [
    {
      key: "teacher",
      header: "Giáo viên",
      cell: (teacher) => {
        const initials = teacher.name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-brand-soft text-xs font-extrabold text-brand-strong">{initials}</div>
            <div><p className="font-bold text-ink">{teacher.name}</p><p className="text-xs text-ink-soft">Giáo viên</p></div>
          </div>
        );
      },
    },
    {
      key: "email",
      header: "Liên hệ",
      cell: (teacher) => <span className="inline-flex items-center gap-2 text-ink-soft"><Mail className="size-4" aria-hidden="true" />{teacher.email}</span>,
    },
    {
      key: "class",
      header: "Lớp phụ trách",
      cell: (teacher) => teacher.class_name
        ? <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand-strong">{teacher.class_name}</span>
        : <span className="text-sm text-ink-soft">Chưa phân công</span>,
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      cell: (teacher) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" aria-label={`Sửa ${teacher.name}`} onClick={() => openEdit(teacher)}><Edit2 className="size-4" /></Button>
          <Button variant="ghost" size="icon" aria-label={`Đặt lại mật khẩu cho ${teacher.name}`} onClick={() => setResetTarget(teacher)}><KeyRound className="size-4" /></Button>
          <Button variant="danger" size="icon" aria-label={`Xóa ${teacher.name}`} onClick={() => setDeleteTarget(teacher)}><Trash2 className="size-4" /></Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Quản lý giáo viên"
        description={`${teachers.length} giáo viên đang có tài khoản trên hệ thống.`}
        actions={<Button onClick={openCreate}><Plus className="size-4" />Thêm giáo viên</Button>}
      />

      {error ? (
        <ErrorState title="Không tải được giáo viên" description={error} action={<Button variant="secondary" onClick={() => void loadTeachers()}>Thử lại</Button>} />
      ) : (
        <Surface className="overflow-hidden">
          <FilterToolbar searchValue={search} onSearchChange={setSearch} searchLabel="Tìm theo tên, email hoặc lớp" />
          <DataTable
            ariaLabel="Danh sách giáo viên"
            columns={columns}
            rows={paginatedTeachers}
            rowKey={(teacher) => teacher.id}
            loading={loading}
            emptyTitle="Không tìm thấy giáo viên"
            emptyDescription="Thử từ khóa khác hoặc thêm giáo viên mới."
          />
          {!loading && filteredTeachers.length > 0 && (
            <Pagination page={page} totalPages={totalPages} totalItems={filteredTeachers.length} itemLabel="giáo viên" onPageChange={setPage} />
          )}
        </Surface>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => !busy && setDialogOpen(false)}
        title={editingTeacher ? "Cập nhật giáo viên" : "Thêm giáo viên"}
        description="Thông tin này được dùng để đăng nhập và phân công lớp học."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)} disabled={busy}>Hủy</Button>
            <Button type="submit" form="teacher-form" disabled={busy}>{busy ? "Đang lưu..." : editingTeacher ? "Lưu thay đổi" : "Tạo giáo viên"}</Button>
          </>
        }
      >
        <form id="teacher-form" className="grid gap-5" onSubmit={saveTeacher}>
          <Field label="Họ và tên" name="teacher-name" required>
            <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required autoComplete="name" placeholder="Nguyễn Văn A" />
          </Field>
          <Field label="Email" name="teacher-email" required>
            <Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required autoComplete="email" placeholder="giaovien@truong.edu.vn" />
          </Field>
          {!editingTeacher && (
            <Field label="Mật khẩu ban đầu" name="teacher-password" required helper="Ít nhất 8 ký tự. Giáo viên nên đổi mật khẩu sau lần đăng nhập đầu tiên.">
              <Input type="password" minLength={8} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required autoComplete="new-password" />
            </Field>
          )}
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa giáo viên?"
        description={`Tài khoản ${deleteTarget?.name || "này"} sẽ bị xóa vĩnh viễn.`}
        confirmLabel="Xóa giáo viên"
        busy={busy}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void deleteTeacher()}
      />
      <ConfirmDialog
        open={Boolean(resetTarget)}
        title="Đặt lại mật khẩu?"
        description={`Hệ thống sẽ tạo mật khẩu tạm thời một lần cho ${resetTarget?.name || "giáo viên này"}.`}
        confirmLabel="Tạo mật khẩu tạm"
        tone="primary"
        busy={busy}
        onClose={() => setResetTarget(null)}
        onConfirm={() => void resetPassword()}
      />
    </>
  );
}
