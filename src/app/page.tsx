'use client';

import Link from 'next/link';
import {
    GraduationCap,
    Users,
    Calendar,
    TrendingUp,
    FileText,
    MessageCircle,
    Smartphone,
    Monitor,
    Star,
    Menu,
    X,
    CheckCircle2,
    ArrowRight,
    Play
} from 'lucide-react';
import { useEffect, useState } from 'react';
import DashboardDemo from '@/components/landing/DashboardDemo';

export default function LandingPage() {
    const [activeSection, setActiveSection] = useState('home');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsVisible(true);
        const handleScroll = () => {
            const sections = ['home', 'features', 'dashboard', 'testimonials', 'contact'];
            for (const section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top <= 150 && rect.bottom >= 150) {
                        setActiveSection(section);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            setIsMobileMenuOpen(false);
            window.scrollTo({
                top: element.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="min-h-screen text-slate-200 font-[family-name:var(--font-inter)] bg-[#0f172a] selection:bg-indigo-500 selection:text-white">
            {/* Header Section */}
            <header className="sticky top-0 z-[1000] py-4 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-[1400px] mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-40 rounded-full group-hover:opacity-60 transition-opacity"></div>
                            <GraduationCap className="relative w-8 h-8 md:w-9 md:h-9 text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="text-xl md:text-2xl font-bold tracking-tight text-white">
                            School<span className="text-indigo-400">Manager</span>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:block">
                        <ul className="flex gap-8 list-none m-0 items-center">
                            {['home', 'features', 'dashboard', 'testimonials'].map((section) => (
                                <li key={section}>
                                    <a
                                        href={`#${section}`}
                                        onClick={(e) => scrollToSection(e, section)}
                                        className={`
                                            relative text-sm font-medium tracking-wide transition-all duration-300
                                            ${activeSection === section ? 'text-white' : 'text-slate-400 hover:text-white'}
                                        `}
                                    >
                                        {section === 'home' && 'TRANG CHỦ'}
                                        {section === 'features' && 'TÍNH NĂNG'}
                                        {section === 'dashboard' && 'QUẢN LÝ'}
                                        {section === 'testimonials' && 'ĐÁNH GIÁ'}
                                        {activeSection === section && (
                                            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-400 rounded-full"></span>
                                        )}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="hidden md:flex gap-4 items-center">
                        <Link href="/login" className="text-slate-300 hover:text-white font-medium transition-colors">
                            Đăng nhập
                        </Link>
                        <Link href="/login" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-medium transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transform hover:-translate-y-0.5">
                            Dùng thử miễn phí
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-white p-2 hover:bg-white/5 rounded-lg transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Navigation Dropdown */}
                {isMobileMenuOpen && (
                    <nav className="md:hidden absolute top-full left-0 w-full bg-[#1e293b] shadow-xl border-t border-white/5 animate-slide-down">
                        <ul className="flex flex-col list-none m-0 p-4 gap-2">
                            {['home', 'features', 'dashboard', 'testimonials', 'contact'].map((section) => (
                                <li key={section}>
                                    <a
                                        href={`#${section}`}
                                        onClick={(e) => scrollToSection(e, section)}
                                        className={`
                                            block px-4 py-3 rounded-lg font-medium transition-colors
                                            ${activeSection === section
                                                ? 'bg-indigo-500/10 text-indigo-400'
                                                : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                                        `}
                                    >
                                        {section === 'home' && 'Trang Chủ'}
                                        {section === 'features' && 'Tính Năng'}
                                        {section === 'dashboard' && 'Bảng Điều Khiển'}
                                        {section === 'testimonials' && 'Đánh Giá'}
                                        {section === 'contact' && 'Liên Hệ'}
                                    </a>
                                </li>
                            ))}
                            <li className="pt-2 border-t border-white/5">
                                <Link href="/login" className="block w-full text-center px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors">
                                    Bắt Đầu Ngay
                                </Link>
                            </li>
                        </ul>
                    </nav>
                )}
            </header>

            <main>
                {/* Hero Section */}
                <section id="home" className="relative pt-20 pb-28 md:pt-32 md:pb-40 overflow-hidden">
                    {/* Background Elements */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
                        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[100px] animate-pulse-slow delay-1000"></div>
                    </div>

                    <div className={`max-w-[1400px] mx-auto px-6 text-center transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-indigo-300 mb-8 backdrop-blur-sm">
                            <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></span>
                            Nền tảng quản lý giáo dục 4.0
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight leading-tight md:leading-tight">
                            Quản lý trường học <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-teal-400 animate-gradient-x">
                                Thông Minh & Hiệu Quả
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Giải pháp toàn diện giúp tự động hóa quy trình quản lý, kết nối nhà trường - phụ huynh - học sinh trên một nền tảng duy nhất.
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
                            <Link
                                href="/login"
                                className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-lg transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    Bắt Đầu Miễn Phí <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </Link>

                            <a
                                href="#features"
                                onClick={(e) => scrollToSection(e, 'features')}
                                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 rounded-xl text-lg font-semibold transition-all backdrop-blur-sm flex items-center justify-center gap-2"
                            >
                                <Play className="w-5 h-5 fill-current" /> Xem Demo
                            </a>
                        </div>

                        {/* Stats Preview */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 border-t border-white/5 pt-12 max-w-4xl mx-auto">
                            {[
                                { val: '10k+', label: 'Học sinh' },
                                { val: '500+', label: 'Trường học' },
                                { val: '99.9%', label: 'Uptime' },
                                { val: '24/7', label: 'Hỗ trợ' },
                            ].map((stat, i) => (
                                <div key={i}>
                                    <div className="text-3xl font-bold text-white mb-1">{stat.val}</div>
                                    <div className="text-slate-500 text-sm font-medium uppercase tracking-wide">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-24 bg-[#0f172a] relative">
                    <div className="max-w-[1400px] mx-auto px-6">
                        <div className="text-center mb-20">
                            <h2 className="text-sm font-bold text-indigo-400 tracking-widest uppercase mb-3">Tính Năng Cốt Lõi</h2>
                            <h3 className="text-3xl md:text-5xl font-bold text-white mb-6">Mọi công cụ bạn cần</h3>
                            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                                Hệ thống được thiết kế module hóa, đáp ứng mọi nhu cầu quản lý từ cơ bản đến nâng cao.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {[
                                { icon: Users, title: 'Quản Lý Học Sinh', desc: 'Hồ sơ số hóa, theo dõi quá trình học tập và rèn luyện xuyên suốt.', color: 'text-blue-400', bg: 'bg-blue-400/10' },
                                { icon: Calendar, title: 'Lịch Biểu Thông Minh', desc: 'Tự động sắp xếp thời khóa biểu, nhắc nhở lịch thi và sự kiện quan trọng.', color: 'text-purple-400', bg: 'bg-purple-400/10' },
                                { icon: TrendingUp, title: 'Báo Cáo & Thống Kê', desc: 'Biểu đồ trực quan về kết quả học tập, điểm danh và các chỉ số KPIs.', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                                { icon: FileText, title: 'Kho Học Liệu Số', desc: 'Lưu trữ và chia sẻ bài giảng, đề thi, tài liệu tham khảo không giới hạn.', color: 'text-amber-400', bg: 'bg-amber-400/10' },
                                { icon: MessageCircle, title: 'Kênh Tương Tác', desc: 'Chat trực tuyến, thông báo tức thì giữa Nhà trường - Gia đình.', color: 'text-rose-400', bg: 'bg-rose-400/10' },
                                { icon: Smartphone, title: 'Mobile App', desc: 'Trải nghiệm mượt mà trên mọi thiết bị di động iOS và Android.', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
                            ].map((feature, idx) => (
                                <div
                                    key={idx}
                                    className="group relative p-8 rounded-2xl bg-[#1e293b]/50 border border-white/5 hover:border-indigo-500/30 hover:bg-[#1e293b] transition-all duration-300 hover:-translate-y-1"
                                >
                                    <div className={`w-14 h-14 rounded-xl ${feature.bg} ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                        <feature.icon className="w-7 h-7" />
                                    </div>
                                    <h4 className="text-xl font-bold text-white mb-3">{feature.title}</h4>
                                    <p className="text-slate-400 leading-relaxed">{feature.desc}</p>

                                    <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                                        <ArrowRight className="w-5 h-5 text-indigo-400" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Dashboard Preview Section */}
                <section id="dashboard" className="py-24 bg-gradient-to-b from-[#0f172a] to-[#020617] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

                    <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                                    Giao diện quản lý <br />
                                    <span className="text-indigo-400">Hiện đại & Trực quan</span>
                                </h2>
                                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                                    Không còn những bảng tính rối rắm. SchoolManager mang đến trải nghiệm
                                    quản lý mượt mà với giao diện Dark Mode bảo vệ mắt, tối ưu cho công việc hàng ngày.
                                </p>

                                <ul className="space-y-4 mb-10">
                                    {[
                                        'Dashboard tổng quan thời gian thực',
                                        'Hệ thống thông báo đẩy thông minh',
                                        'Tùy biến giao diện theo vai trò',
                                        'Bảo mật dữ liệu tiêu chuẩn quốc tế'
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-slate-300">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>

                                <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-8 font-medium text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900">
                                    Xem chi tiết
                                </Link>
                            </div>

                            <div className="relative">
                                {/* Abstract decorative elements */}
                                <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-500/30 rounded-full blur-[80px]"></div>
                                <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-teal-500/30 rounded-full blur-[80px]"></div>

                                {/* Live Demo Component Wrapper */}
                                <div className="relative rounded-2xl bg-[#1e293b] border border-slate-700 shadow-2xl overflow-hidden transform rotate-1 hover:rotate-0 transition-transform duration-500 p-1">
                                    <div className="w-full h-[400px] sm:h-[500px] bg-[#0f172a] rounded-xl overflow-hidden relative shadow-inner">
                                        <DashboardDemo />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section id="testimonials" className="py-24 bg-[#0f172a]">
                    <div className="max-w-[1400px] mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Được tin dùng bởi <span className="text-indigo-400">1000+</span> trường học</h2>
                            <p className="text-slate-400 text-lg">Câu chuyện thành công từ cộng đồng giáo dục</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    name: 'Cô Nguyễn Thị Minh',
                                    role: 'Giáo Viên Chủ Nhiệm',
                                    content: 'Giao diện mới thực sự ấn tượng. Dark mode giúp tôi làm việc buổi tối không bị mỏi mắt, các tính năng sắp xếp rất khoa học.',
                                    avatar: 'M',
                                    color: 'bg-rose-500'
                                },
                                {
                                    name: 'Thầy Trần Văn Hùng',
                                    role: 'Hiệu Trưởng',
                                    content: 'Việc quản lý toàn trường chưa bao giờ dễ dàng như thế. Báo cáo trực quan giúp tôi nắm bắt tình hình chỉ trong vài phút.',
                                    avatar: 'H',
                                    color: 'bg-emerald-500'
                                },
                                {
                                    name: 'Chị Lê Thị Hoa',
                                    role: 'Phụ Huynh',
                                    content: 'Ứng dụng chạy rất mượt, thông báo điểm danh của con về điện thoại tức thì. Rất yên tâm khi sử dụng.',
                                    avatar: 'L',
                                    color: 'bg-sky-500'
                                },
                            ].map((item, idx) => (
                                <div key={idx} className="bg-[#1e293b] p-8 rounded-2xl border border-white/5 relative">
                                    <div className="flex gap-1 mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={16} className="text-amber-400 fill-amber-400" />
                                        ))}
                                    </div>
                                    <p className="text-slate-300 italic mb-6 leading-relaxed">&quot;{item.content}&quot;</p>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center text-white font-bold`}>
                                            {item.avatar}
                                        </div>
                                        <div>
                                            <div className="text-white font-semibold">{item.name}</div>
                                            <div className="text-slate-500 text-sm">{item.role}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer Section */}
            <footer className="bg-[#020617] border-t border-white/5 py-12 text-sm">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <GraduationCap className="w-6 h-6 text-indigo-400" />
                                <span className="text-lg font-bold text-white">SchoolManager</span>
                            </div>
                            <p className="text-slate-500 leading-relaxed mb-6">
                                Nền tảng quản lý giáo dục toàn diện, kiến tạo tương lai số cho trường học Việt Nam.
                            </p>
                            <div className="flex gap-4">
                                {['Facebook', 'Twitter', 'Linkedin'].map((social, i) => (
                                    <a key={i} href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-indigo-500 hover:text-white transition-all">
                                        <span className="sr-only">{social}</span>
                                        <div className="w-4 h-4 bg-current rounded-sm"></div>
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-6">Sản Phẩm</h4>
                            <ul className="space-y-3 text-slate-400">
                                <li><a href="#" className="hover:text-indigo-400 transition-colors">Tính năng</a></li>
                                <li><a href="#" className="hover:text-indigo-400 transition-colors">Bảng giá</a></li>
                                <li><a href="#" className="hover:text-indigo-400 transition-colors">Tải ứng dụng</a></li>
                                <li><a href="#" className="hover:text-indigo-400 transition-colors">API</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-6">Tài Nguyên</h4>
                            <ul className="space-y-3 text-slate-400">
                                <li><a href="#" className="hover:text-indigo-400 transition-colors">Hướng dẫn sử dụng</a></li>
                                <li><a href="#" className="hover:text-indigo-400 transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-indigo-400 transition-colors">Cộng đồng</a></li>
                                <li><a href="#" className="hover:text-indigo-400 transition-colors">Trợ giúp</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-6">Liên Hệ</h4>
                            <ul className="space-y-3 text-slate-400">
                                <li>info@schoolmanager.vn</li>
                                <li>+84 24 3942 8888</li>
                                <li>123 Đại Cồ Việt, Hà Nội</li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500">
                        <p>© 2026 SchoolManager. All rights reserved.</p>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-white transition-colors">Điều khoản</a>
                            <a href="#" className="hover:text-white transition-colors">Bảo mật</a>
                            <a href="#" className="hover:text-white transition-colors">Cookies</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
