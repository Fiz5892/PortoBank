import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-secondary/40 mt-auto">
      <div className="container py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-heading font-bold">
              P
            </div>
            <span className="font-heading text-lg font-bold">PortoBank</span>
          </Link>

          <nav className="flex items-center gap-6 text-sm">
            <Link to="/explore" className="text-muted-foreground hover:text-foreground transition-colors">
              Explore
            </Link>
            <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link to="/register" className="text-muted-foreground hover:text-foreground transition-colors">
              Get started
            </Link>
          </nav>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} PortoBank
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
