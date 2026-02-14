import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, LogIn, LogOut, LayoutDashboard, Award, Feather, Shield, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import logo from '@/assets/qalam_logo_1771102518872.jpg';
import TeacherMessages from '@/components/TeacherMessages';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const isHome = location.pathname === '/';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src={logo}
            alt="Qalam"
            className="h-20 w-auto object-contain mix-blend-multiply transition-transform group-hover:scale-105"
          />
        </Link>

        <nav className="flex items-center gap-3">
          {!isHome && (
            <Link
              to="/"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">الرئيسية</span>
            </Link>
          )}

          {user && role === 'student' && (
            <>
              <Link
                to="/creative-writing"
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <Feather className="h-4 w-4" />
                <span className="hidden sm:inline">الكتابة</span>
              </Link>
              <Link
                to="/final-outputs"
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <Award className="h-4 w-4" />
                <span className="hidden sm:inline">إنجازاتي</span>
              </Link>
              <TeacherMessages />
            </>
          )}

          {user && role === 'teacher' && (
            <Link
              to="/teacher-dashboard"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">لوحة التحكم</span>
            </Link>
          )}

          {user && role === 'admin' && (
            <>
              <Link
                to="/admin"
                className="flex items-center gap-1.5 text-sm font-medium text-amber-600 transition-colors hover:text-amber-700"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">إدارة المنصة</span>
              </Link>
              <Link
                to="/teacher-dashboard"
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">الطلاب</span>
              </Link>
            </>
          )}

          {user && (
            <Link
              to="/settings"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">الإعدادات</span>
            </Link>
          )}

          {user ? (
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">خروج</span>
            </Button>
          ) : (
            <Button variant="default" size="sm" onClick={() => navigate('/auth')} className="gap-1.5">
              <LogIn className="h-4 w-4" />
              دخول
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
