import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LoginToActModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

const LoginToActModal = ({
  open,
  onOpenChange,
  title = "Sign in required",
  description = "Create a free account or sign in to continue.",
}: LoginToActModalProps) => {
  const navigate = useNavigate();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => navigate("/login")}>
            Sign in
          </Button>
          <Button onClick={() => navigate("/register")}>Create account</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoginToActModal;
