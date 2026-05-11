import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Compass, Home, Search } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useSEO } from "@/hooks/useSEO";

const NotFound = () => {
  const location = useLocation();

  useSEO({
    title: "Page not found — PortoBank",
    description: "The page you're looking for doesn't exist or has moved.",
  });

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <section className="container py-20 md:py-28 flex items-center justify-center">
        <div className="text-center max-w-lg animate-fade-in">
          {/* Illustration */}
          <div
            className="relative mx-auto w-44 h-44 md:w-56 md:h-56 mb-8"
            aria-hidden="true"
          >
            <div className="absolute inset-0 rounded-full bg-primary/5" />
            <div className="absolute inset-4 rounded-full bg-primary/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Compass className="h-16 w-16 md:h-20 md:w-20 text-primary animate-pulse" />
            </div>
          </div>

          <p className="text-sm font-semibold tracking-widest text-primary uppercase">
            404 — lost in the gallery
          </p>
          <h1 className="font-heading text-3xl md:text-4xl font-bold mt-3">
            We couldn't find that page
          </h1>
          <p className="text-muted-foreground mt-3">
            The link may be broken, or the page may have moved. Try heading back home or
            discovering new portfolios.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/">
                <Home className="h-4 w-4 mr-2" /> Go Home
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/explore">
                <Search className="h-4 w-4 mr-2" /> Explore Talents
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default NotFound;
