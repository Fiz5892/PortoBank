import { Link } from "react-router-dom";
import { ExternalLink, Folder } from "lucide-react";
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
  return (
    <Card className="p-6 shadow-subtle" id="projects">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading font-semibold text-lg">Projects</h2>
        {isOwner && (
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground h-7">
            <Link to="/dashboard/portfolio">Manage</Link>
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 border border-dashed rounded-lg">
          <Folder className="h-10 w-10 mx-auto text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground mt-2">No projects added yet</p>
          {isOwner && (
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link to="/dashboard/portfolio">Add your first project</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((item) => {
            const tags = item.tags ?? [];
            const visibleTags = tags.slice(0, 4);
            const extraTags = tags.length - visibleTags.length;
            return (
              <Card
                key={item.id}
                className="overflow-hidden shadow-subtle hover:shadow-elevated transition-shadow flex flex-col"
              >
                <div className="aspect-video bg-secondary overflow-hidden">
                  {item.cover_url ? (
                    <img
                      src={item.cover_url}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                      No cover
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-heading font-semibold leading-tight">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  {visibleTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {visibleTags.map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs font-normal">
                          {t}
                        </Badge>
                      ))}
                      {extraTags > 0 && (
                        <Badge variant="outline" className="text-xs font-normal">
                          +{extraTags} more
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1"
                      onClick={() => onView(item)}
                    >
                      View Details
                    </Button>
                    {item.external_link && (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        aria-label="Open external link"
                      >
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
      )}
    </Card>
  );
};

export default ProjectsSection;
