import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export interface PortfolioItemData {
  id: string;
  type: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  external_link: string | null;
  tags: string[] | null;
  gallery_images?: string[] | null;
}

interface Props {
  item: PortfolioItemData | null;
  onOpenChange: (open: boolean) => void;
}

const ProjectModal = ({ item, onOpenChange }: Props) => {
  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {item && (
          <>
            {item.cover_url && (
              <div className="-mx-6 -mt-6 mb-2 aspect-video bg-secondary overflow-hidden rounded-t-lg">
                <img
                  src={item.cover_url}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl">{item.title}</DialogTitle>
              {item.description && (
                <DialogDescription className="text-base text-foreground/80 whitespace-pre-wrap pt-2">
                  {item.description}
                </DialogDescription>
              )}
            </DialogHeader>

            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {item.tags.map((t) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>
            )}

            {item.gallery_images && item.gallery_images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {item.gallery_images.map((src, i) => (
                  <div key={i} className="aspect-video bg-secondary rounded-md overflow-hidden">
                    <img
                      src={src}
                      alt={`${item.title} screenshot ${i + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {item.external_link && (
              <Button asChild className="mt-4 w-full sm:w-auto">
                <a href={item.external_link} target="_blank" rel="noopener noreferrer">
                  View Project <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProjectModal;
