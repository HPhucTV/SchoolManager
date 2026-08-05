import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  Github,
  GraduationCap,
  HeartHandshake,
  Menu,
  School,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { BrandMark } from "@/components/ui/BrandMark";
import { buttonVariants } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const roles = [
  {
    title: "Quản trị viên",
    description: "Tổ chức giáo viên, học sinh và lớp học với quyền truy cập rõ ràng.",
    icon: ShieldCheck,
    className: "md:col-span-7 md:row-span-2",
    details: ["Quản lý tài khoản theo vai trò", "Theo dõi quy mô toàn trường", "Phân công giáo viên phụ trách"],
  },
  {
    title: "Giáo viên",
    description: "Giao bài, tạo kiểm tra và theo sát tiến độ của đúng lớp mình phụ trách.",
    icon: Users,
    className: "md:col-span-5",
    details: [],
  },
  {
    title: "Học sinh",
    description: "Học tập, thi đua và chủ động chia sẻ trạng thái tinh thần trong một không gian an toàn.",
    icon: GraduationCap,
    className: "md:col-span-5",
    details: [],
  },
];

const capabilities = [
  {
    title: "Lớp học và lịch biểu",
    description: "Tập trung thành viên, thời khóa biểu, hoạt động và phòng học trực tuyến theo từng lớp.",
    icon: School,
  },
  {
    title: "Bài tập và kiểm tra",
    description: "Tạo nội dung, nhận bài, chấm điểm và xem kết quả mà không rời khỏi hệ thống.",
    icon: ClipboardList,
  },
  {
    title: "Sức khỏe học đường",
    description: "Ghi nhận cảm xúc, hỗ trợ cảnh báo SOS và giúp giáo viên quan sát tín hiệu cần quan tâm.",
    icon: HeartHandshake,
  },
  {
    title: "Học tập có hỗ trợ AI",
    description: "Phân tích kết quả, gợi ý ôn tập và hỗ trợ tạo câu hỏi từ nội dung của giáo viên.",
    icon: BrainCircuit,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-canvas text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="SchoolManager, về trang chủ">
            <BrandMark />
          </Link>

          <nav aria-label="Điều hướng chính" className="hidden items-center gap-7 text-sm font-semibold text-ink-soft md:flex">
            <a href="#vai-tro" className="transition-colors hover:text-brand-strong">Vai trò</a>
            <a href="#nen-tang" className="transition-colors hover:text-brand-strong">Nền tảng</a>
            <a href="#ma-nguon-mo" className="transition-colors hover:text-brand-strong">Mã nguồn mở</a>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <a
              href="https://github.com/HPhucTV/SchoolManager"
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "ghost", size: "default" })}
            >
              <Github className="size-[18px]" />
              Xem mã nguồn
            </a>
            <Link href="/login" className={buttonVariants({ variant: "primary", size: "default" })}>
              Đăng nhập
            </Link>
          </div>

          <details className="group relative md:hidden">
            <summary className="grid size-11 cursor-pointer list-none place-items-center rounded-[10px] border border-line bg-surface text-ink marker:content-none">
              <Menu className="size-5" />
              <span className="sr-only">Mở điều hướng</span>
            </summary>
            <div className="absolute right-0 top-14 w-64 rounded-[14px] border border-line bg-surface p-2 shadow-[0_18px_60px_rgba(28,52,84,0.16)]">
              <a href="#vai-tro" className="block rounded-[9px] px-3 py-2.5 text-sm font-semibold text-ink-soft hover:bg-surface-subtle">Vai trò</a>
              <a href="#nen-tang" className="block rounded-[9px] px-3 py-2.5 text-sm font-semibold text-ink-soft hover:bg-surface-subtle">Nền tảng</a>
              <a href="#ma-nguon-mo" className="block rounded-[9px] px-3 py-2.5 text-sm font-semibold text-ink-soft hover:bg-surface-subtle">Mã nguồn mở</a>
              <Link href="/login" className={cn(buttonVariants({ variant: "primary" }), "mt-2 w-full")}>Đăng nhập</Link>
            </div>
          </details>
        </div>
      </header>

      <main>
        <section className="mx-auto grid min-h-[calc(100dvh-72px)] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-8 lg:py-16">
          <div className="max-w-xl">
            <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.16em] text-brand-strong">Mã nguồn mở cho trường học</p>
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-[-0.05em] text-ink sm:text-5xl lg:text-6xl">
              Cùng vận hành một trường học
            </h1>
            <p className="mt-6 max-w-[52ch] text-base leading-7 text-ink-soft sm:text-lg">
              Quản lý lớp, học tập và chăm sóc học sinh trong một hệ thống rõ ràng.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className={buttonVariants({ variant: "primary", size: "large" })}>
                Đăng nhập
                <ArrowRight className="size-[18px]" />
              </Link>
              <a href="#vai-tro" className={buttonVariants({ variant: "secondary", size: "large" })}>
                Khám phá nền tảng
              </a>
            </div>
          </div>

          <div className="relative min-h-[360px] overflow-hidden rounded-[16px] border border-line bg-surface shadow-[0_24px_80px_rgba(28,52,84,0.14)] sm:min-h-[480px]">
            <Image
              src="/images/landing/classroom-collaboration.png"
              alt="Giáo viên và học sinh Việt Nam cùng học tập trong lớp"
              fill
              priority
              sizes="(max-width: 767px) 100vw, 55vw"
              className="object-cover"
            />
          </div>
        </section>

        <section className="border-y border-line bg-surface">
          <div className="mx-auto grid max-w-7xl gap-0 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
            {[
              ["3 vai trò", "Quản trị viên, giáo viên, học sinh"],
              ["Tiếng Việt", "Nội dung và luồng thao tác bản địa"],
              ["Mã nguồn mở", "Có thể kiểm tra, sửa đổi và đóng góp"],
            ].map(([title, description], index) => (
              <div key={title} className={cn("py-6 sm:px-6", index > 0 && "border-t border-line sm:border-l sm:border-t-0")}>
                <p className="text-lg font-extrabold text-ink">{title}</p>
                <p className="mt-1 text-sm leading-6 text-ink-soft">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="vai-tro" className="scroll-mt-24 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl">Đúng công cụ cho từng vai trò</h2>
              <p className="mt-4 max-w-[60ch] text-base leading-7 text-ink-soft">
                Mỗi người chỉ thấy dữ liệu và tác vụ phù hợp với trách nhiệm của mình trong trường.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-12">
              {roles.map((role, index) => (
                <article
                  key={role.title}
                  className={cn(
                    "rounded-[16px] border border-line bg-surface p-6 shadow-[0_14px_40px_rgba(28,52,84,0.05)] sm:p-8",
                    role.className,
                    index === 0 && "bg-[linear-gradient(145deg,var(--surface),var(--brand-soft))]",
                  )}
                >
                  <div className="grid size-12 place-items-center rounded-[13px] bg-brand-soft text-brand-strong">
                    <role.icon className="size-6" strokeWidth={1.8} />
                  </div>
                  <h3 className="mt-6 text-xl font-extrabold text-ink">{role.title}</h3>
                  <p className="mt-2 max-w-[50ch] text-sm leading-6 text-ink-soft">{role.description}</p>
                  {role.details.length > 0 && (
                    <div className="mt-8 grid gap-3 sm:grid-cols-3">
                      {role.details.map((detail) => (
                        <div key={detail} className="flex items-start gap-2 text-sm font-semibold leading-6 text-ink">
                          <CheckCircle2 className="mt-1 size-4 shrink-0 text-brand-strong" />
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

        <section id="nen-tang" className="scroll-mt-24 bg-surface-subtle py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 md:grid-cols-2 lg:gap-16 lg:px-8">
            <div className="relative min-h-[380px] overflow-hidden rounded-[16px] border border-line bg-surface sm:min-h-[520px]">
              <Image
                src="/images/landing/teacher-collaboration.png"
                alt="Hai giáo viên Việt Nam cùng xem tài liệu học tập trong thư viện"
                fill
                sizes="(max-width: 767px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl">Dành thời gian cho điều quan trọng</h2>
              <p className="mt-4 max-w-[58ch] text-base leading-7 text-ink-soft">
                SchoolManager gom các công việc rời rạc vào một luồng chung để thầy cô dễ theo sát học sinh hơn.
              </p>
              <div className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                {capabilities.map((capability) => (
                  <div key={capability.title}>
                    <capability.icon className="size-5 text-brand-strong" strokeWidth={1.8} />
                    <h3 className="mt-3 text-base font-extrabold text-ink">{capability.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-ink-soft">{capability.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 rounded-[16px] border border-line bg-surface p-6 shadow-[0_18px_60px_rgba(28,52,84,0.07)] md:grid-cols-[0.8fr_1.2fr] md:p-10">
              <div>
                <div className="grid size-12 place-items-center rounded-[13px] bg-brand-soft text-brand-strong">
                  <BookOpenCheck className="size-6" />
                </div>
                <h2 className="mt-6 text-3xl font-extrabold tracking-[-0.04em] text-ink">Một nền tảng có thể lớn lên cùng trường</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  [Sparkles, "Học tập", "Bài tập, kiểm tra, phân tích và gợi ý ôn tập."],
                  [HeartHandshake, "Chăm sóc", "Nhật ký cảm xúc, chỉ số lớp và cảnh báo cần hỗ trợ."],
                  [Users, "Kết nối", "Thông báo, hoạt động và phòng học trực tuyến."],
                  [ShieldCheck, "Phân quyền", "Dữ liệu được giới hạn theo vai trò, lớp và chủ sở hữu."],
                ].map(([Icon, title, description]) => {
                  const ItemIcon = Icon as typeof Sparkles;
                  return (
                    <div key={title as string} className="rounded-[13px] bg-surface-subtle p-5">
                      <ItemIcon className="size-5 text-brand-strong" />
                      <h3 className="mt-3 text-sm font-extrabold text-ink">{title as string}</h3>
                      <p className="mt-1 text-sm leading-6 text-ink-soft">{description as string}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="ma-nguon-mo" className="scroll-mt-24 border-y border-line bg-brand-soft py-16">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-extrabold tracking-[-0.035em] text-ink sm:text-3xl">Cùng làm phần mềm trường học tốt hơn</h2>
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
            <a href="https://github.com/HPhucTV/SchoolManager" target="_blank" rel="noreferrer" className="hover:text-brand-strong">Xem mã nguồn</a>
            <a href="https://github.com/HPhucTV/SchoolManager/issues" target="_blank" rel="noreferrer" className="hover:text-brand-strong">Báo lỗi</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
