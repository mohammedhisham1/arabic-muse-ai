import { Link, useLocation } from 'react-router-dom';
import { BookOpen, PenTool } from 'lucide-react';

const Header = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
            <PenTool className="h-5 w-5" />
          </div>
          <span className="font-amiri text-2xl font-bold text-foreground">قلم</span>
        </Link>

        {!isHome && (
          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <BookOpen className="h-4 w-4" />
              الرئيسية
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
