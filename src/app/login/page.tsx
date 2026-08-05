"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { BrandMark } from "@/components/ui/BrandMark";
import { Button } from "@/components/ui/primitives";

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
    <main className="grid min-h-[100dvh] bg-canvas lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden min-h-[100dvh] overflow-hidden lg:block" aria-label="Không gian học tập SchoolManager">
        <Image
          src="/images/landing/teacher-collaboration.png"
          alt="Hai giáo viên Việt Nam cùng trao đổi trong thư viện trường"
          fill
          priority
          sizes="52vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,35,65,0.08)_34%,rgba(10,29,54,0.88)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 p-10 xl:p-14">
          <p className="max-w-xl text-3xl font-extrabold leading-tight tracking-[-0.04em] text-white xl:text-4xl">
            Mỗi vai trò có một không gian làm việc riêng và an toàn.
          </p>
          <p className="mt-4 max-w-lg text-sm leading-6 text-blue-100">
            Đăng nhập bằng tài khoản do quản trị viên nhà trường cấp để tiếp tục.
          </p>
        </div>
      </section>

      <section className="flex min-h-[100dvh] flex-col bg-surface px-4 py-6 sm:px-8 lg:px-12 xl:px-20">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Về trang chủ">
            <BrandMark />
          </Link>
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-[10px] px-3 text-sm font-bold text-ink-soft transition-colors hover:bg-surface-subtle hover:text-ink">
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Trang chủ</span>
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <div>
            <h1 className="text-3xl font-extrabold tracking-[-0.045em] text-ink sm:text-4xl">Chào mừng trở lại</h1>
            <p className="mt-3 text-sm leading-6 text-ink-soft">Nhập email và mật khẩu của tài khoản SchoolManager.</p>
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
                  className="h-12 w-full rounded-[10px] border border-line bg-surface pl-11 pr-4 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-soft/70 focus:border-brand focus:shadow-[0_0_0_3px_var(--brand-soft)]"
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
                  className="h-12 w-full rounded-[10px] border border-line bg-surface pl-11 pr-12 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-soft/70 focus:border-brand focus:shadow-[0_0_0_3px_var(--brand-soft)]"
                />
                <button
                  type="button"
                  className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-[8px] text-ink-soft transition-colors hover:bg-surface-subtle hover:text-ink"
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
              <div id="login-error" role="alert" className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-danger dark:border-red-900 dark:bg-red-950/35">
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

        <p className="text-center text-xs text-ink-soft">SchoolManager dành cho cộng đồng giáo dục Việt Nam.</p>
      </section>
    </main>
  );
}
