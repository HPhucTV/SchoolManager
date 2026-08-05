"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Copy, GraduationCap, Plus, Users, Video } from "lucide-react";
import toast from "react-hot-toast";

import { apiRequest, getErrorMessage } from "@/lib/api";
import { Dialog, EmptyState, ErrorState } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/forms";
import { Button, PageHeader, Skeleton, Surface } from "@/components/ui/primitives";
import { FilterToolbar } from "@/components/ui/workflow";

interface ClassData {
  id: number;
  name: string;
  grade: string | null;
  created_at: string;
  happiness_score: number;
  engagement_score: number;
  mental_health_score: number;
  student_count?: number;
  meeting_link?: string;
  class_code?: string;
  online_enabled?: boolean;
}

export default function ClassListPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createdClass, setCreatedClass] = useState<ClassData | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", grade: "", online_enabled: false });

  const loadClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setClasses(await apiRequest<ClassData[]>("/api/classes", { cache: "no-store" }));
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải danh sách lớp học."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  const filteredClasses = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi");
    if (!query) return classes;
    return classes.filter((schoolClass) => `${schoolClass.name} ${schoolClass.grade || ""}`.toLocaleLowerCase("vi").includes(query));
  }, [classes, search]);

  const createClass = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    try {
      const newClass = await apiRequest<ClassData>("/api/classes", { method: "POST", body: JSON.stringify(form) });
      setCreatedClass(newClass);
      setClasses((current) => [newClass, ...current.filter((item) => item.id !== newClass.id)]);
      setForm({ name: "", grade: "", online_enabled: false });
      toast.success("Đã tạo lớp học.");
    } catch (createError) {
      toast.error(getErrorMessage(createError, "Không thể tạo lớp học."));
    } finally {
      setCreating(false);
    }
  };

  const closeDialog = () => {
    if (creating) return;
    setDialogOpen(false);
    setCreatedClass(null);
  };

  const copyText = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(`Đã sao chép ${label}.`);
  };

  const joinLink = createdClass?.class_code && typeof window !== "undefined"
    ? `${window.location.origin}/join?code=${createdClass.class_code}`
    : "";

  return (
    <>
      <PageHeader
        title="Lớp học của tôi"
        description="Quản lý học sinh, nội dung học tập và lớp trực tuyến theo từng lớp phụ trách."
        actions={<Button onClick={() => setDialogOpen(true)}><Plus className="size-4" />Tạo lớp học</Button>}
      />

      {error ? (
        <ErrorState title="Không tải được lớp học" description={error} action={<Button variant="secondary" onClick={() => void loadClasses()}>Thử lại</Button>} />
      ) : (
        <Surface className="overflow-hidden">
          <FilterToolbar searchValue={search} onSearchChange={setSearch} searchLabel="Tìm theo tên hoặc khối lớp" />
          <div className="p-4 sm:p-5">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-64" />)}
              </div>
            ) : filteredClasses.length === 0 ? (
              <EmptyState title="Chưa có lớp học" description="Tạo lớp đầu tiên để giao bài và theo dõi học sinh." action={<Button onClick={() => setDialogOpen(true)}>Tạo lớp học</Button>} icon={BookOpen} />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredClasses.map((schoolClass) => (
                  <article key={schoolClass.id} className="flex min-h-64 flex-col rounded-[14px] border border-line bg-surface p-5 transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-[0_14px_34px_rgba(28,52,84,0.08)]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="grid size-11 place-items-center rounded-[12px] bg-brand-soft text-brand-strong"><GraduationCap className="size-5" /></div>
                      <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-bold text-ink-soft">{schoolClass.grade ? `Khối ${schoolClass.grade}` : "Chưa phân khối"}</span>
                    </div>
                    <h2 className="mt-5 text-xl font-extrabold text-ink">{schoolClass.name}</h2>
                    <p className="mt-1 inline-flex items-center gap-2 text-sm text-ink-soft"><Users className="size-4" />{typeof schoolClass.student_count === "number" ? `${schoolClass.student_count} học sinh` : "Chưa cập nhật sĩ số"}</p>

                    <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
                      {[
                        ["Hạnh phúc", schoolClass.happiness_score],
                        ["Gắn kết", schoolClass.engagement_score],
                        ["Tinh thần", schoolClass.mental_health_score],
                      ].map(([label, value]) => (
                        <div key={String(label)}><dt className="text-[11px] text-ink-soft">{label}</dt><dd className="mt-1 text-sm font-extrabold text-ink">{Number(value) || 0}%</dd></div>
                      ))}
                    </dl>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-5">
                      {schoolClass.meeting_link && (
                        <a href={schoolClass.meeting_link} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-2 rounded-[9px] bg-emerald-50 px-3 text-xs font-bold text-success dark:bg-emerald-950/40">
                          <Video className="size-4" />Vào lớp online
                        </a>
                      )}
                      <Link href={`/teacher/lop-hoc/${schoolClass.id}`} className="ml-auto inline-flex min-h-9 items-center gap-2 rounded-[9px] px-3 text-xs font-bold text-brand-strong hover:bg-brand-soft">
                        Xem chi tiết <ArrowRight className="size-4" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </Surface>
      )}

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        title={createdClass ? "Lớp học đã sẵn sàng" : "Tạo lớp học"}
        description={createdClass ? "Chia sẻ mã lớp để học sinh tham gia." : "Lớp mới sẽ được gắn với tài khoản giáo viên hiện tại."}
        footer={createdClass ? <Button onClick={closeDialog}>Hoàn tất</Button> : (
          <><Button variant="secondary" onClick={closeDialog} disabled={creating}>Hủy</Button><Button type="submit" form="teacher-class-form" disabled={creating}>{creating ? "Đang tạo..." : "Tạo lớp học"}</Button></>
        )}
      >
        {createdClass ? (
          <div className="grid gap-4">
            <div className="rounded-[12px] border border-line bg-surface-subtle p-4">
              <p className="text-xs font-bold text-ink-soft">Mã lớp học</p>
              <div className="mt-2 flex gap-2"><code className="flex-1 rounded-[9px] bg-surface px-3 py-2 text-center text-lg font-extrabold tracking-[0.14em] text-brand-strong">{createdClass.class_code}</code><Button variant="secondary" size="icon" aria-label="Sao chép mã lớp" onClick={() => void copyText(createdClass.class_code || "", "mã lớp")}><Copy className="size-4" /></Button></div>
            </div>
            {joinLink && <div className="rounded-[12px] border border-line bg-surface-subtle p-4"><p className="text-xs font-bold text-ink-soft">Link tham gia</p><div className="mt-2 flex gap-2"><Input readOnly value={joinLink} /><Button variant="secondary" size="icon" aria-label="Sao chép link tham gia" onClick={() => void copyText(joinLink, "link tham gia")}><Copy className="size-4" /></Button></div></div>}
          </div>
        ) : (
          <form id="teacher-class-form" className="grid gap-5" onSubmit={createClass}>
            <Field label="Tên lớp học" name="teacher-class-name" required><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required placeholder="10A1" /></Field>
            <Field label="Khối lớp" name="teacher-class-grade" helper="Có thể để trống nếu đây là lớp chuyên đề."><Select value={form.grade} onChange={(event) => setForm((current) => ({ ...current, grade: event.target.value }))}><option value="">Chưa phân khối</option><option value="10">Khối 10</option><option value="11">Khối 11</option><option value="12">Khối 12</option><option value="Khác">Khác</option></Select></Field>
            <label className="flex items-start gap-3 rounded-[12px] border border-line bg-surface-subtle p-4"><input type="checkbox" checked={form.online_enabled} onChange={(event) => setForm((current) => ({ ...current, online_enabled: event.target.checked }))} className="mt-1 size-4 accent-brand" /><span><span className="block text-sm font-bold text-ink">Bật lớp học trực tuyến</span><span className="mt-1 block text-xs leading-5 text-ink-soft">Cho phép tạo và chia sẻ phòng học online cho lớp này.</span></span></label>
          </form>
        )}
      </Dialog>
    </>
  );
}
