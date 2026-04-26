import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onClick: () => void;
  label?: string;
}

const SectionEditButton = ({ onClick, label = "Edit section" }: Props) => (
  <Button
    type="button"
    variant="ghost"
    size="icon"
    onClick={onClick}
    aria-label={label}
    className="h-7 w-7 text-muted-foreground hover:text-foreground"
  >
    <Pencil className="h-3.5 w-3.5" />
  </Button>
);

export default SectionEditButton;
