import { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ExternalLink, Folder } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PortfolioItemData } from "./ProjectModal";

interface Props {
  items: PortfolioItemData[];
  isOwner: boolean;
  onView: (item: PortfolioItemData) => void;
}

const ProjectsSection = ({ items, isOwner, onView }: Props) => {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-project-card]");
    const amount = card ? card.offsetWidth + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <section id="projects" className="container py-16 md:py-24 border-t">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="font-heading text-4xl md:text-5xl font-extrabold leading-[1.05] text-gradient-brand">
            Project Showcase
          </h2>
          <p className="text-muted-foreground mt-3">Here are some of my projects.</p>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          {isOwner && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard/portfolio">Manage</Link>
            </Button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <Folder className="h-10 w-10 mx-auto text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground mt-2">No projects added yet</p>
          {isOwner && (
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link to="/dashboard/portfolio">Add your first project</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div
            ref={scrollerRef}
            className="no-scrollbar flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2 -mx-5 px-5"
          >
            {items.map((item) => {
              const tags = (item.tags ?? []).slice(0, 4);
              return (
                <Card
                  key={item.id}
                  data-project-card
                  className="group shrink-0 snap-start w-[85%] sm:w-[420px] md:w-[460px] overflow-hidden shadow-subtle hover:shadow-elevated transition-shadow flex flex-col"
                >
                  <button
                    type="button"
                    onClick={() => onView(item)}
                    className="aspect-[16/10] bg-secondary overflow-hidden text-left"
                    aria-label={`View ${item.title}`}
                  >
                    {item.cover_url ? (
                      <img
                        src={item.cover_url}
                        alt={item.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                        No cover
                      </div>
                    )}
                  </button>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {item.type && (
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                          {item.type}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-heading font-semibold text-lg leading-tight">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {tags.map((t) => (
                          <Badge key={t} variant="outline" className="text-xs font-normal">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => onView(item)}
                      >
                        View Details
                      </Button>
                      {item.external_link && (
                        <Button asChild size="sm" variant="outline" aria-label="Open external link">
                          <a href={item.external_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {items.length > 1 && (
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollBy(-1)}
                aria-label="Previous projects"
                className="h-9 w-9 rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollBy(1)}
                aria-label="Next projects"
                className="h-9 w-9 rounded-full"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default ProjectsSection;
