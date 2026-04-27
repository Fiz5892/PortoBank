import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface Props {
  displayName: string;
  canMessage: boolean;
  onMessage: () => void;
}

const ContactCTASection = ({ displayName, canMessage, onMessage }: Props) => {
  const firstName = displayName.split(" ")[0] || displayName;
  return (
    <section
      id="contact-cta"
      className="relative overflow-hidden border-t"
    >
      {/* Soft gradient halo */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-72 -z-10 bg-gradient-to-t from-primary/15 via-primary/5 to-transparent"
      />
      <div className="container py-20 md:py-28 text-center max-w-2xl">
        <h2 className="font-heading text-3xl md:text-4xl font-bold leading-tight">
          Let's build something
          <br className="hidden sm:block" /> great together.
        </h2>
        <p className="text-muted-foreground mt-4">
          Whether you have a project in mind or just want to explore ideas, {firstName} is here to
          help bring your vision to life. Let's talk.
        </p>
        <div className="flex items-center justify-center gap-3 mt-7 flex-wrap">
          <Button onClick={onMessage} disabled={!canMessage} size="lg">
            {canMessage ? "Let's Talk" : "Sign in to message"}
          </Button>
          <Button asChild variant="ghost" size="lg">
            <a href="#projects">
              See all projects <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ContactCTASection;
