"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, School, ShieldCheck } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { BrandMark } from "@/components/ui/BrandMark";
import { Button } from "@/components/ui/primitives";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const roleDestinations = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
} as const;

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(roleDestinations[user.role]);
    }
  }, [authLoading, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const signedInUser = await login(email.trim(), password);
      router.replace(roleDestinations[signedInUser.role]);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Không thể đăng nhập. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="school-grid grid min-h-[100dvh] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden min-h-[100dvh] p-5 lg:block xl:p-7" aria-label="Không gian học tập SchoolManager">
        <div className="relative h-full min-h-[calc(100dvh-40px)] overflow-hidden rounded-[28px] border border-line bg-surface shadow-[0_24px_70px_var(--shadow-color)]">
          <Image
            src="/images/landing/teacher-collaboration.png"
            alt="Hai giáo viên Việt Nam cùng trao đổi trong thư viện trường"
            fill
            priority
            sizes="52vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,35,65,0.04)_25%,rgba(10,29,54,0.9)_100%)]" />
          <div className="absolute left-7 top-7 rounded-[16px] border border-white/25 bg-slate-950/35 p-3 text-white backdrop-blur-md">
            <BrandMark className="text-white" subtitle="Khuôn viên số của nhà trường" />
          </div>
          <div className="absolute inset-x-0 bottom-0 p-8 xl:p-12">
            <div className="grid size-12 place-items-center rounded-[14px] bg-white/15 text-white backdrop-blur-md">
              <School className="size-6" />
            </div>
            <p className="mt-6 max-w-xl text-3xl font-extrabold leading-tight tracking-[-0.04em] text-white xl:text-4xl">
              Một cánh cửa vào đúng không gian của bạn.
            </p>
            <p className="mt-4 max-w-lg text-sm leading-6 text-blue-100">
              Quản trị viên, giáo viên và học sinh cùng làm việc trên một hệ thống, với quyền truy cập riêng.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-blue-50">
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-300" />Đúng vai trò</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-300" />Dữ liệu được bảo vệ</span>
            </div>
          </div>
        </div>
      </section>

      <section className="flex min-h-[100dvh] flex-col px-4 py-5 sm:px-8 lg:px-12 xl:px-20">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Về trang chủ" className="lg:hidden">
            <BrandMark />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-[12px] px-3 text-sm font-bold text-ink-soft transition-colors hover:bg-surface hover:text-ink">
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Trang chủ</span>
            </Link>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col justify-center py-10">
          <div className="rounded-[24px] border border-line bg-surface/94 p-6 shadow-[0_20px_60px_var(--shadow-color)] backdrop-blur-sm sm:p-8">
            <div>
              <p className="text-sm font-extrabold text-brand-strong">SchoolManager</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] text-ink sm:text-4xl">Chào mừng trở lại</h1>
              <p className="mt-3 text-sm leading-6 text-ink-soft">Đăng nhập bằng tài khoản do nhà trường cấp.</p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-bold text-ink">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink-soft" strokeWidth={1.8} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ten@truong.edu.vn"
                  className="h-12 w-full rounded-[12px] border border-line bg-surface-elevated pl-11 pr-4 text-sm text-ink shadow-[0_3px_10px_var(--shadow-color)] outline-none transition-[border-color,box-shadow] placeholder:text-ink-soft/65 hover:border-brand/35 focus:border-brand focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--brand)_12%,transparent)]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-bold text-ink">Mật khẩu</label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink-soft" strokeWidth={1.8} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Nhập mật khẩu"
                  aria-describedby={error ? "login-error" : "password-help"}
                  className="h-12 w-full rounded-[12px] border border-line bg-surface-elevated pl-11 pr-12 text-sm text-ink shadow-[0_3px_10px_var(--shadow-color)] outline-none transition-[border-color,box-shadow] placeholder:text-ink-soft/65 hover:border-brand/35 focus:border-brand focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--brand)_12%,transparent)]"
                />
                <button
                  type="button"
                  className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-[10px] text-ink-soft transition-colors hover:bg-surface-subtle hover:text-ink"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                </button>
              </div>
              <p id="password-help" className="text-xs leading-5 text-ink-soft">Mật khẩu có tối thiểu 8 ký tự.</p>
            </div>

            {error && (
              <div id="login-error" role="alert" className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-danger dark:border-red-900 dark:bg-red-950/35">
                {error}
              </div>
            )}

            <Button type="submit" size="large" className="w-full" disabled={submitting || authLoading}>
              {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
            </form>

            <div className="mt-8 border-t border-line pt-6">
              <p className="text-xs leading-5 text-ink-soft">
                Chưa có tài khoản? Liên hệ quản trị viên của trường. Việc tạo tài khoản được giới hạn để bảo vệ dữ liệu học sinh.
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-ink-soft">SchoolManager dành cho cộng đồng giáo dục Việt Nam.</p>
      </section>
    </main>
  );
}
