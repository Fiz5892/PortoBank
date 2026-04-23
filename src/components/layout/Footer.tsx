import { Link } from "react-router-dom";

const sections = [
  {
    title: "Product",
    links: [
      { to: "/", label: "Explore" },
      { to: "/pricing", label: "Pricing" },
      { to: "/about", label: "About" },
    ],
  },
  {
    title: "Resources",
    links: [
      { to: "/help", label: "Help Center" },
      { to: "/blog", label: "Blog" },
      { to: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/terms", label: "Terms" },
      { to: "/privacy", label: "Privacy" },
      { to: "/cookies", label: "Cookies" },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="border-t border-border bg-secondary/40 mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-heading font-bold">
                P
              </div>
              <span className="font-heading text-lg font-bold">PortoBank</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground max-w-xs">
              The professional portfolio platform for every profession.
            </p>
          </div>

          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="font-heading text-sm font-semibold mb-3">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} PortoBank. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with care for professionals everywhere.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
