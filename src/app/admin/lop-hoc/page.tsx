"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Edit2, GraduationCap, Plus, UserRound } from "lucide-react";
import toast from "react-hot-toast";

import { adminApi, getErrorMessage } from "@/lib/api";
import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import { Dialog, ErrorState } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/forms";
import { Button, PageHeader, Surface } from "@/components/ui/primitives";
import { FilterToolbar, Pagination } from "@/components/ui/workflow";

interface ClassData {
  id: number;
  name: string;
  grade: string;
  teacher_id?: number | null;
  teacher_name?: string | null;
  student_count: number;
}

interface Teacher {
  id: number;
  name: string;
  email: string;
}

const PAGE_SIZE = 10;

export default function ClassesManagement() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassData | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", grade: "", teacher_id: "" });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [classData, teacherData] = await Promise.all([adminApi.getClasses(), adminApi.getUsers("teacher")]);
      setClasses(classData);
      setTeachers(teacherData);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải dữ liệu lớp học."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredClasses = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi");
    return classes.filter((schoolClass) => {
      const matchesSearch = !query || `${schoolClass.name} ${schoolClass.teacher_name || ""}`.toLocaleLowerCase("vi").includes(query);
      return matchesSearch && (gradeFilter === "all" || schoolClass.grade === gradeFilter);
    });
  }, [classes, gradeFilter, search]);

  useEffect(() => {
    setPage(1);
  }, [gradeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredClasses.length / PAGE_SIZE));
  const paginatedClasses = filteredClasses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setEditingClass(null);
    setForm({ name: "", grade: "", teacher_id: "" });
    setDialogOpen(true);
  };

  const openEdit = (schoolClass: ClassData) => {
    setEditingClass(schoolClass);
    setForm({ name: schoolClass.name, grade: schoolClass.grade, teacher_id: schoolClass.teacher_id ? String(schoolClass.teacher_id) : "" });
    setDialogOpen(true);
  };

  const saveClass = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const payload = { name: form.name.trim(), grade: form.grade, teacher_id: form.teacher_id ? Number(form.teacher_id) : null };
    try {
      if (editingClass) {
        await adminApi.updateClass(editingClass.id, payload);
        toast.success("Đã cập nhật lớp học.");
      } else {
        await adminApi.createClass(payload);
        toast.success("Đã tạo lớp học.");
      }
      setDialogOpen(false);
      await loadData();
    } catch (saveError) {
      toast.error(getErrorMessage(saveError));
    } finally {
      setBusy(false);
    }
  };

  const columns: DataColumn<ClassData>[] = [
    {
      key: "class",
      header: "Lớp học",
      cell: (schoolClass) => (
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-[11px] bg-brand-soft text-brand-strong"><BookOpen className="size-5" /></div>
          <div><p className="font-extrabold text-ink">{schoolClass.name}</p><p className="text-xs text-ink-soft">Khối {schoolClass.grade}</p></div>
        </div>
      ),
    },
    {
      key: "teacher",
      header: "Giáo viên chủ nhiệm",
      cell: (schoolClass) => <span className="inline-flex items-center gap-2 text-ink-soft"><UserRound className="size-4" />{schoolClass.teacher_name || "Chưa phân công"}</span>,
    },
    {
      key: "students",
      header: "Sĩ số",
      cell: (schoolClass) => <span className="inline-flex items-center gap-2 font-bold text-ink"><GraduationCap className="size-4 text-ink-soft" />{schoolClass.student_count} học sinh</span>,
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      cell: (schoolClass) => <Button variant="ghost" size="icon" aria-label={`Sửa lớp ${schoolClass.name}`} onClick={() => openEdit(schoolClass)}><Edit2 className="size-4" /></Button>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Quản lý lớp học"
        description={`${classes.length} lớp học đang được quản lý trên hệ thống.`}
        actions={<Button onClick={openCreate}><Plus className="size-4" />Tạo lớp học</Button>}
      />

      {error ? (
        <ErrorState title="Không tải được lớp học" description={error} action={<Button variant="secondary" onClick={() => void loadData()}>Thử lại</Button>} />
      ) : (
        <Surface className="overflow-hidden">
          <FilterToolbar searchValue={search} onSearchChange={setSearch} searchLabel="Tìm lớp hoặc giáo viên">
            <Select value={gradeFilter} onChange={(event) => setGradeFilter(event.target.value)} aria-label="Lọc theo khối" className="w-full sm:w-40">
              <option value="all">Tất cả khối</option>
              <option value="10">Khối 10</option>
              <option value="11">Khối 11</option>
              <option value="12">Khối 12</option>
            </Select>
          </FilterToolbar>
          <DataTable ariaLabel="Danh sách lớp học" columns={columns} rows={paginatedClasses} rowKey={(schoolClass) => schoolClass.id} loading={loading} emptyTitle="Không tìm thấy lớp học" emptyDescription="Thử bộ lọc khác hoặc tạo lớp học mới." />
          {!loading && filteredClasses.length > 0 && <Pagination page={page} totalPages={totalPages} totalItems={filteredClasses.length} itemLabel="lớp học" onPageChange={setPage} />}
        </Surface>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => !busy && setDialogOpen(false)}
        title={editingClass ? "Cập nhật lớp học" : "Tạo lớp học"}
        description="Tên lớp, khối và giáo viên chủ nhiệm có thể cập nhật sau."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)} disabled={busy}>Hủy</Button>
            <Button type="submit" form="class-form" disabled={busy}>{busy ? "Đang lưu..." : editingClass ? "Lưu thay đổi" : "Tạo lớp học"}</Button>
          </>
        }
      >
        <form id="class-form" className="grid gap-5" onSubmit={saveClass}>
          <Field label="Tên lớp" name="class-name" required><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required placeholder="10A1" /></Field>
          <Field label="Khối lớp" name="class-grade" required>
            <Select value={form.grade} onChange={(event) => setForm((current) => ({ ...current, grade: event.target.value }))} required>
              <option value="">Chọn khối</option><option value="10">Khối 10</option><option value="11">Khối 11</option><option value="12">Khối 12</option>
            </Select>
          </Field>
          <Field label="Giáo viên chủ nhiệm" name="class-teacher" helper="Có thể để trống nếu chưa phân công.">
            <Select value={form.teacher_id} onChange={(event) => setForm((current) => ({ ...current, teacher_id: event.target.value }))}>
              <option value="">Chưa phân công</option>
              {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
            </Select>
          </Field>
        </form>
      </Dialog>
    </>
  );
}
