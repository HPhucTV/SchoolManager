import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Github,
  GraduationCap,
  HeartHandshake,
  Menu,
  School,
  ShieldCheck,
  Users,
} from "lucide-react";

import { BrandMark } from "@/components/ui/BrandMark";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { buttonVariants } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const roles = [
  {
    title: "Quản trị viên",
    description: "Tổ chức giáo viên, học sinh và lớp học với quyền truy cập rõ ràng.",
    icon: ShieldCheck,
    className: "md:col-span-7 md:row-span-2",
    tone: "bg-[linear-gradient(145deg,var(--surface),var(--brand-soft))]",
    details: ["Tài khoản theo vai trò", "Quy mô toàn trường", "Phân công lớp học"],
  },
  {
    title: "Giáo viên",
    description: "Giao bài, tạo kiểm tra và theo sát đúng lớp mình phụ trách.",
    icon: Users,
    className: "md:col-span-5",
    tone: "bg-mint-soft",
    details: [],
  },
  {
    title: "Học sinh",
    description: "Học tập, nhận thông báo và chia sẻ cảm xúc trong một không gian an toàn.",
    icon: GraduationCap,
    className: "md:col-span-5",
    tone: "bg-sun-soft",
    details: [],
  },
];

const capabilities = [
  {
    title: "Lớp học và thành viên",
    description: "Quản lý lớp, giáo viên phụ trách và danh sách học sinh từ một nơi.",
    icon: School,
    className: "md:col-span-7",
    tone: "bg-brand-soft text-brand-strong",
  },
  {
    title: "Bài tập và kiểm tra",
    description: "Tạo nội dung, nhận bài, chấm điểm và xem kết quả theo lớp.",
    icon: ClipboardList,
    className: "md:col-span-5",
    tone: "bg-mint-soft text-mint",
  },
  {
    title: "Lịch học và thông báo",
    description: "Giữ thời khóa biểu và những việc cần biết luôn ở đúng chỗ.",
    icon: CalendarDays,
    className: "md:col-span-5",
    tone: "bg-sun-soft text-sun",
  },
  {
    title: "Chăm sóc học sinh",
    description: "Ghi nhận cảm xúc và chuyển tín hiệu cần hỗ trợ đến người có trách nhiệm.",
    icon: HeartHandshake,
    className: "md:col-span-7",
    tone: "bg-coral-soft text-coral",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-canvas text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="SchoolManager, về trang chủ">
            <BrandMark subtitle="Một khuôn viên, một nhịp chung" />
          </Link>

          <nav aria-label="Điều hướng chính" className="hidden items-center gap-7 text-sm font-semibold text-ink-soft md:flex">
            <a href="#vai-tro" className="transition-colors hover:text-brand-strong">Vai trò</a>
            <a href="#nen-tang" className="transition-colors hover:text-brand-strong">Nền tảng</a>
            <a href="#ma-nguon-mo" className="transition-colors hover:text-brand-strong">Mã nguồn mở</a>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            <a
              href="https://github.com/HPhucTV/SchoolManager"
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "ghost", size: "default" })}
            >
              <Github className="size-[18px]" />
              Mã nguồn
            </a>
            <Link href="/login" className={buttonVariants({ variant: "primary", size: "default" })}>
              Đăng nhập
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <details className="group relative">
              <summary className="grid size-11 cursor-pointer list-none place-items-center rounded-[13px] border border-line bg-surface text-ink marker:content-none">
                <Menu className="size-5" />
                <span className="sr-only">Mở điều hướng</span>
              </summary>
              <div className="absolute right-0 top-14 w-64 rounded-[18px] border border-line bg-surface p-2 shadow-[0_18px_50px_var(--shadow-color)]">
                <a href="#vai-tro" className="block rounded-[11px] px-3 py-2.5 text-sm font-semibold text-ink-soft hover:bg-surface-subtle">Vai trò</a>
                <a href="#nen-tang" className="block rounded-[11px] px-3 py-2.5 text-sm font-semibold text-ink-soft hover:bg-surface-subtle">Nền tảng</a>
                <a href="#ma-nguon-mo" className="block rounded-[11px] px-3 py-2.5 text-sm font-semibold text-ink-soft hover:bg-surface-subtle">Mã nguồn mở</a>
                <Link href="/login" className={cn(buttonVariants({ variant: "primary" }), "mt-2 w-full")}>Đăng nhập</Link>
              </div>
            </details>
          </div>
        </div>
      </header>

      <main>
        <section className="school-grid relative overflow-hidden border-b border-line">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,var(--brand-soft),transparent_34%),radial-gradient(circle_at_90%_76%,var(--mint-soft),transparent_30%)]" />
          <div className="relative mx-auto grid min-h-[calc(100dvh-76px)] max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 md:grid-cols-[0.92fr_1.08fr] lg:gap-16 lg:px-8 lg:py-16">
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-2 rounded-[12px] border border-brand/20 bg-surface/85 px-3 py-2 text-xs font-extrabold text-brand-strong shadow-[0_6px_18px_var(--shadow-color)]">
                <BookOpenCheck className="size-4" />
                Nền tảng quản lý trường học
              </p>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-[-0.05em] text-ink sm:text-5xl lg:text-[58px]">
                Mỗi ngày ở trường, gọn gàng hơn.
              </h1>
              <p className="mt-5 max-w-[48ch] text-base leading-7 text-ink-soft sm:text-lg">
                Lớp học, bài tập, lịch biểu và chăm sóc học sinh trong một không gian rõ ràng.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/login" className={buttonVariants({ variant: "primary", size: "large" })}>
                  Vào SchoolManager
                  <ArrowRight className="size-[18px]" />
                </Link>
                <a href="#nen-tang" className={buttonVariants({ variant: "secondary", size: "large" })}>
                  Xem cách vận hành
                </a>
              </div>
              <div className="mt-8 flex items-start gap-3 text-sm leading-6 text-ink-soft">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-mint" />
                <p>Mỗi vai trò chỉ thấy đúng dữ liệu và công việc mình cần.</p>
              </div>
            </div>

            <div className="rounded-[28px] border border-line bg-surface/92 p-3 shadow-[0_28px_80px_var(--shadow-color)] backdrop-blur-sm sm:p-4">
              <div className="flex items-center justify-between gap-4 px-2 pb-3 pt-1">
                <div>
                  <p className="text-xs font-semibold text-ink-soft">Không gian học tập</p>
                  <p className="text-sm font-extrabold text-ink">Kết nối cả lớp trong một nhịp chung</p>
                </div>
                <div className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-brand-soft text-brand-strong">
                  <School className="size-5" />
                </div>
              </div>
              <div className="relative min-h-[320px] overflow-hidden rounded-[20px] sm:min-h-[470px]">
                <Image
                  src="/images/landing/classroom-collaboration.png"
                  alt="Giáo viên và học sinh Việt Nam cùng học tập trong lớp"
                  fill
                  priority
                  sizes="(max-width: 767px) 100vw, 55vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-line bg-surface">
          <div className="mx-auto grid max-w-7xl gap-0 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
            {[
              [Users, "3 vai trò", "Cùng một hệ thống"],
              [School, "Lớp học", "Thành viên rõ ràng"],
              [ClipboardList, "Học tập", "Bài tập và kiểm tra"],
              [BellRing, "Theo sát", "Lịch và thông báo"],
            ].map(([Icon, title, description], index) => {
              const ItemIcon = Icon as typeof Users;
              return (
                <div key={title as string} className={cn("flex gap-3 py-5 sm:px-5", index > 0 && "border-t border-line sm:border-l sm:border-t-0")}>
                  <ItemIcon className="mt-0.5 size-5 shrink-0 text-brand-strong" />
                  <div>
                    <p className="text-sm font-extrabold text-ink">{title as string}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">{description as string}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="vai-tro" className="scroll-mt-24 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-extrabold text-brand-strong">Một trường học, ba góc nhìn</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl">Đúng công cụ cho từng vai trò</h2>
              <p className="mt-4 max-w-[60ch] text-base leading-7 text-ink-soft">
                Công việc được sắp theo trách nhiệm để mỗi người bắt đầu nhanh và ít bị phân tâm.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-12">
              {roles.map((role) => (
                <article
                  key={role.title}
                  className={cn(
                    "rounded-[22px] border border-line p-6 shadow-[0_14px_36px_var(--shadow-color)] sm:p-8",
                    role.className,
                    role.tone,
                  )}
                >
                  <div className="grid size-12 place-items-center rounded-[14px] bg-surface-elevated text-brand-strong shadow-[0_6px_18px_var(--shadow-color)]">
                    <role.icon className="size-6" strokeWidth={1.8} />
                  </div>
                  <h3 className="mt-6 text-xl font-extrabold text-ink">{role.title}</h3>
                  <p className="mt-2 max-w-[50ch] text-sm leading-6 text-ink-soft">{role.description}</p>
                  {role.details.length > 0 && (
                    <div className="mt-8 grid gap-3 sm:grid-cols-3">
                      {role.details.map((detail) => (
                        <div key={detail} className="flex items-start gap-2 text-sm font-semibold leading-6 text-ink">
                          <CheckCircle2 className="mt-1 size-4 shrink-0 text-mint" />
                          {detail}
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="nen-tang" className="school-grid scroll-mt-24 border-y border-line py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-extrabold text-brand-strong">Những việc cốt lõi</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl">Một nền tảng vừa đủ cho trường học</h2>
              <p className="mt-4 max-w-[58ch] text-base leading-7 text-ink-soft">
                SchoolManager tập trung vào các luồng được dùng hằng ngày và giữ chúng gần nhau.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-12">
              {capabilities.map((capability) => (
                <article key={capability.title} className={cn("rounded-[22px] border border-line bg-surface p-6 shadow-[0_14px_36px_var(--shadow-color)] sm:p-7", capability.className)}>
                  <div className={cn("grid size-12 place-items-center rounded-[14px]", capability.tone)}>
                    <capability.icon className="size-6" strokeWidth={1.8} />
                  </div>
                  <h3 className="mt-5 text-lg font-extrabold text-ink">{capability.title}</h3>
                  <p className="mt-2 max-w-[50ch] text-sm leading-6 text-ink-soft">{capability.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 md:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:px-8">
            <div className="relative min-h-[380px] overflow-hidden rounded-[24px] border border-line bg-surface shadow-[0_20px_60px_var(--shadow-color)] sm:min-h-[520px]">
              <Image
                src="/images/landing/teacher-collaboration.png"
                alt="Hai giáo viên Việt Nam cùng xem tài liệu học tập trong thư viện"
                fill
                sizes="(max-width: 767px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div>
              <div className="grid size-12 place-items-center rounded-[14px] bg-coral-soft text-coral">
                <HeartHandshake className="size-6" />
              </div>
              <h2 className="mt-6 text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl">Dành sự chú ý cho điều quan trọng</h2>
              <p className="mt-4 max-w-[58ch] text-base leading-7 text-ink-soft">
                Khi thông tin học tập và tín hiệu cần hỗ trợ ở cùng một nơi, thầy cô có thêm thời gian cho học sinh.
              </p>
              <div className="mt-7 grid gap-3">
                {[
                  "Theo dõi bài tập và kiểm tra theo đúng lớp.",
                  "Nhận biết trạng thái cảm xúc cần được quan tâm.",
                  "Giữ thông báo và lịch học dễ tìm trên mọi thiết bị.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-[14px] bg-surface-subtle px-4 py-3 text-sm font-semibold leading-6 text-ink">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-mint" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="ma-nguon-mo" className="scroll-mt-24 border-y border-line bg-brand-soft py-16">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-extrabold text-brand-strong">Mã nguồn mở</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-ink sm:text-3xl">Cùng làm phần mềm trường học tốt hơn</h2>
              <p className="mt-3 text-sm leading-6 text-ink-soft sm:text-base">
                Xem mã nguồn, báo lỗi hoặc đóng góp một cải tiến phù hợp với trường học của bạn.
              </p>
            </div>
            <a
              href="https://github.com/HPhucTV/SchoolManager"
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "primary", size: "large" })}
            >
              <Github className="size-[18px]" />
              Xem mã nguồn
            </a>
          </div>
        </section>
      </main>

      <footer className="bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <BrandMark subtitle="Nền tảng quản lý trường học mã nguồn mở" />
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-ink-soft">
            <Link href="/login" className="hover:text-brand-strong">Đăng nhập</Link>
            <a href="https://github.com/HPhucTV/SchoolManager" target="_blank" rel="noreferrer" className="hover:text-brand-strong">Mã nguồn</a>
            <a href="https://github.com/HPhucTV/SchoolManager/issues" target="_blank" rel="noreferrer" className="hover:text-brand-strong">Báo lỗi</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
