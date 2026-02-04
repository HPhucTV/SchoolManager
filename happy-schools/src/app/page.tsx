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
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function LandingPage() {
    const [activeSection, setActiveSection] = useState('home');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const sections = ['home', 'features', 'dashboard', 'testimonials', 'contact'];
            for (const section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top <= 100 && rect.bottom >= 100) {
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
            setIsMobileMenuOpen(false); // Close mobile menu on click
            window.scrollTo({
                top: element.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="min-h-screen text-[#1e293b] font-[family-name:var(--font-inter)]">
            {/* Header Section */}
            <header className="sticky top-0 z-[1000] py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
                <div className="max-w-[1400px] mx-auto px-5 flex justify-between items-center">
                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <GraduationCap className="w-8 h-8 md:w-9 md:h-9 group-hover:scale-110 transition-transform duration-300" />
                        <div className="text-xl md:text-2xl font-bold tracking-wider">
                            QUẢN LÝ <span className="text-amber-400">LỚP HỌC</span>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:block">
                        <ul className="flex gap-8 list-none m-0">
                            {['home', 'features', 'dashboard', 'testimonials', 'contact'].map((section) => (
                                <li key={section}>
                                    <a
                                        href={`#${section}`}
                                        onClick={(e) => scrollToSection(e, section)}
                                        className={`
                      relative text-white no-underline font-medium text-lg px-4 py-2 rounded-md transition-all duration-300
                      hover:bg-white/20
                      ${activeSection === section ? 'bg-white/20' : ''}
                      after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[3px] after:bg-amber-400 after:transition-all after:duration-300
                      hover:after:w-full
                      ${activeSection === section ? 'after:w-full' : ''}
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
                        </ul>
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-white p-2 hover:bg-white/20 rounded-lg transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>

                {/* Mobile Navigation Dropdown */}
                {isMobileMenuOpen && (
                    <nav className="md:hidden absolute top-full left-0 w-full bg-blue-800 shadow-xl border-t border-blue-700 animate-slide-down">
                        <ul className="flex flex-col list-none m-0 p-4 gap-2">
                            {['home', 'features', 'dashboard', 'testimonials', 'contact'].map((section) => (
                                <li key={section}>
                                    <a
                                        href={`#${section}`}
                                        onClick={(e) => scrollToSection(e, section)}
                                        className={`
                      block text-white no-underline font-medium text-lg px-4 py-3 rounded-md transition-all
                      ${activeSection === section ? 'bg-blue-700 text-amber-400' : 'hover:bg-blue-700'}
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
                        </ul>
                    </nav>
                )}
            </header>

            <main className="bg-gradient-to-br from-[#667eea] to-[#764ba2]">
                {/* Hero Section */}
                <section id="home" className="py-16 md:py-24 text-center text-white px-5">
                    <div className="max-w-[1400px] mx-auto">
                        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 drop-shadow-md animate-fade-in-up uppercase leading-tight">
                            Hệ Thống Quản Lý <br className="sm:hidden" /> Lớp Học Toàn Diện
                        </h1>
                        <p className="text-base sm:text-lg md:text-2xl mb-10 max-w-3xl mx-auto opacity-90 animate-fade-in-up delay-100 px-4">
                            Nền tảng quản lý lớp học chuyên nghiệp giúp giáo viên và nhà trường
                            tối ưu hóa quy trình giảng dạy, theo dõi tiến độ học tập và nâng cao
                            hiệu quả giáo dục.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-5 mt-8 animate-fade-in-up delay-200 px-4">
                            <Link
                                href="/login"
                                className="w-full sm:w-auto inline-block px-8 py-4 bg-white text-blue-600 rounded-lg text-lg font-semibold shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                            >
                                Bắt Đầu Ngay
                            </Link>
                            <a
                                href="#features"
                                onClick={(e) => scrollToSection(e, 'features')}
                                className="w-full sm:w-auto inline-block px-8 py-4 bg-transparent text-white border-2 border-white rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300"
                            >
                                Khám Phá Tính Năng
                            </a>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-16 md:py-24 bg-white">
                    <div className="max-w-[1400px] mx-auto px-5">
                        <div className="text-center mb-12 md:mb-16">
                            <h2 className="text-2xl md:text-4xl font-bold text-blue-600 mb-4">TÍNH NĂNG NỔI BẬT</h2>
                            <p className="text-slate-500 text-base md:text-lg">Khám phá các tính năng mạnh mẽ của hệ thống quản lý lớp học</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {[
                                { icon: Users, title: 'Quản Lý Học Sinh', desc: 'Theo dõi thông tin chi tiết của từng học sinh, lịch sử học tập và thành tích cá nhân một cách hệ thống.' },
                                { icon: Calendar, title: 'Lịch Học & Điểm Danh', desc: 'Tạo lịch học tự động, quản lý điểm danh trực tuyến và theo dõi tỷ lệ chuyên cần của học sinh.' },
                                { icon: TrendingUp, title: 'Phân Tích Hiệu Suất', desc: 'Báo cáo thống kê chi tiết về kết quả học tập, điểm số và xu hướng phát triển của từng học sinh.' },
                                { icon: FileText, title: 'Quản Lý Bài Giảng', desc: 'Tổ chức và chia sẻ tài liệu học tập, bài giảng điện tử và bài tập một cách hiệu quả.' },
                                { icon: MessageCircle, title: 'Giao Tiếp Phụ Huynh', desc: 'Kết nối trực tiếp với phụ huynh qua hệ thống thông báo và tin nhắn tích hợp.' },
                                { icon: Smartphone, title: 'Ứng Dụng Di Động', desc: 'Truy cập hệ thống mọi lúc mọi nơi với ứng dụng di động được tối ưu hóa cho iOS và Android.' },
                            ].map((feature, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white p-6 md:p-8 rounded-xl shadow-md hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 text-center border border-slate-100 group"
                                >
                                    <feature.icon className="w-12 h-12 text-blue-600 mx-auto mb-5 group-hover:scale-110 transition-transform duration-300" />
                                    <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">{feature.title}</h3>
                                    <p className="text-slate-500 leading-relaxed text-sm md:text-base">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Dashboard Preview Section */}
                <section id="dashboard" className="py-16 md:py-24 bg-gradient-to-br from-blue-50 to-blue-100">
                    <div className="max-w-[1400px] mx-auto px-5">
                        <div className="text-center mb-12 md:mb-16">
                            <h2 className="text-2xl md:text-4xl font-bold text-blue-600 mb-4">BẢNG ĐIỀU KHIỂN THÔNG MINH</h2>
                            <p className="text-slate-500 text-base md:text-lg">Tổng quan toàn diện về hoạt động lớp học của bạn</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 md:p-8 shadow-lg mt-8">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
                                {[
                                    { val: '45', label: 'Học Sinh', color: 'from-blue-600 to-blue-400' },
                                    { val: '12', label: 'Lớp Học', color: 'from-amber-500 to-orange-600' },
                                    { val: '87%', label: 'Chuyên Cần', color: 'from-red-500 to-red-600' },
                                    { val: '92%', label: 'Đạt Chuẩn', color: 'from-emerald-500 to-emerald-700' },
                                ].map((stat, idx) => (
                                    <div key={idx} className={`bg-gradient-to-br ${stat.color} text-white p-4 md:p-6 rounded-xl text-center shadow-md transform transition-transform hover:scale-105`}>
                                        <div className="text-2xl md:text-4xl font-bold mb-2">{stat.val}</div>
                                        <div className="text-xs md:text-base opacity-90">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="text-center p-6 md:p-10 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300">
                                <Monitor className="w-16 h-16 md:w-24 md:h-24 text-blue-600 mx-auto opacity-30 mb-5" />
                                <h3 className="text-lg md:text-2xl font-bold text-slate-800 mt-5">Giao Diện Bảng Điều Khiển Hiện Đại</h3>
                                <p className="text-slate-500 text-sm md:text-lg mt-2">Trải nghiệm giao diện trực quan, dễ sử dụng với đầy đủ thông tin quan trọng</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section id="testimonials" className="py-16 md:py-24 bg-white">
                    <div className="max-w-[1400px] mx-auto px-5">
                        <div className="text-center mb-12 md:mb-16">
                            <h2 className="text-2xl md:text-4xl font-bold text-blue-600 mb-4">ĐÁNH GIÁ TỪ NGƯỜI DÙNG</h2>
                            <p className="text-slate-500 text-base md:text-lg">Nghe những phản hồi tích cực từ giáo viên và nhà trường</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
                            {[
                                {
                                    avatar: 'GV',
                                    name: 'Cô Nguyễn Thị Minh',
                                    role: 'Giáo Viên Tiểu Học',
                                    content: 'Hệ thống này đã thay đổi hoàn toàn cách tôi quản lý lớp học. Việc điểm danh và theo dõi tiến độ học sinh trở nên dễ dàng và hiệu quả hơn rất nhiều.',
                                    rating: 5
                                },
                                {
                                    avatar: 'HT',
                                    name: 'Thầy Trần Văn Hùng',
                                    role: 'Hiệu Trưởng Trường THCS',
                                    content: 'Chúng tôi đã triển khai hệ thống này cho toàn bộ trường và thấy rõ sự cải thiện trong quản lý và chất lượng giáo dục. Rất đáng để đầu tư!',
                                    rating: 4.5
                                },
                                {
                                    avatar: 'PH',
                                    name: 'Chị Lê Thị Hoa',
                                    role: 'Phụ Huynh Học Sinh',
                                    content: 'Tôi rất hài lòng với tính năng liên lạc với giáo viên. Giờ đây tôi có thể theo dõi tình hình học tập của con một cách dễ dàng và kịp thời.',
                                    rating: 5
                                },
                            ].map((item, idx) => (
                                <div key={idx} className="bg-slate-50 p-6 md:p-8 rounded-xl shadow-md border-l-4 border-blue-600 hover:shadow-xl transition-shadow duration-300">
                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg md:text-2xl font-bold shadow-md shrink-0">
                                            {item.avatar}
                                        </div>
                                        <div>
                                            <h4 className="text-lg md:text-xl font-bold text-slate-800">{item.name}</h4>
                                            <p className="text-xs md:text-sm text-slate-500">{item.role}</p>
                                        </div>
                                    </div>
                                    <div className="italic text-slate-700 leading-relaxed mb-4 text-sm md:text-base">"{item.content}"</div>
                                    <div className="flex text-amber-400 gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={16} fill={i < Math.floor(item.rating) ? "currentColor" : (i === Math.floor(item.rating) && item.rating % 1 !== 0 ? "url(#half)" : "none")} className={i >= item.rating ? "text-slate-300" : ""} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer Section */}
            <footer id="contact" className="bg-[#1e293b] text-white py-12 md:py-16">
                <div className="max-w-[1400px] mx-auto px-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-amber-400 mb-5">VỀ CHÚNG TÔI</h3>
                            <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                                Hệ thống quản lý lớp học chuyên nghiệp, được phát triển bởi đội
                                ngũ chuyên gia giáo dục và công nghệ hàng đầu Việt Nam.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-amber-400 mb-5">LIÊN KẾT NHANH</h3>
                            <ul className="list-none p-0 space-y-2">
                                {['home', 'features', 'dashboard', 'testimonials', 'contact'].map((section) => (
                                    <li key={section}>
                                        <a
                                            href={`#${section}`}
                                            onClick={(e) => scrollToSection(e, section)}
                                            className="text-slate-300 hover:text-white hover:translate-x-1 inline-block transition-all duration-300 text-sm md:text-base"
                                        >
                                            {section === 'home' && 'Trang Chủ'}
                                            {section === 'features' && 'Tính Năng'}
                                            {section === 'dashboard' && 'Bảng Điều Khiển'}
                                            {section === 'testimonials' && 'Đánh Giá'}
                                            {section === 'contact' && 'Liên Hệ'}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-amber-400 mb-5">LIÊN HỆ</h3>
                            <ul className="list-none p-0 space-y-3 text-slate-300 text-sm md:text-base">
                                <li className="flex items-center gap-2">
                                    <span>info@quanlylophoc.vn</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span>+84 24 3942 8888</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span>123 Đại Cồ Việt, Hà Nội</span>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-amber-400 mb-5">THEO DÕI CHÚNG TÔI</h3>
                            <div className="flex gap-4">
                                {['Facebook', 'Twitter', 'Instagram', 'Linkedin'].map((social, i) => (
                                    <a key={i} href="#" className="text-white text-2xl hover:text-amber-400 transition-colors duration-300">
                                        <span className="text-sm font-normal border border-white/20 px-2 py-1 rounded hover:bg-white/10">{social}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="text-center pt-8 border-t border-slate-700 text-slate-400 text-sm">
                        <p>&copy; 2026 Hệ Thống Quản Lý Lớp Học. All Rights Reserved.</p>
                    </div>
                </div>
            </footer>

            <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
             opacity: 0;
             transform: translateY(-10px);
          }
          to {
             opacity: 1;
             transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .animate-slide-down {
          animation: slideDown 0.3s ease-out forwards;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
      `}</style>
        </div>
    );
}
