import { Link } from "react-router-dom";
import { Github, Twitter, Linkedin } from "lucide-react";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-secondary/40 mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <Link to="/" className="flex items-center gap-2 w-fit">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-heading font-bold">
                P
              </div>
              <span className="font-heading text-lg font-bold">PortoBank</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              The home for creative professionals. Showcase your work, discover talent, and grow your career.
            </p>
            <div className="flex items-center gap-3 mt-1">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Product links */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold">Product</p>
            <nav className="flex flex-col gap-2">
              <Link to="/explore" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Explore
              </Link>
              <Link to="/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Get started
              </Link>
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sign in
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {year} PortoBank. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built for creators, by creators.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
