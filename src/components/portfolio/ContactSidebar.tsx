import { Mail, Phone, Globe, Linkedin, Github, Instagram, Twitter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SectionEditButton from "./SectionEditButton";

export interface ProfileContacts {
  email_contact: string | null;
  phone: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  behance_url: string | null;
  dribbble_url: string | null;
}

interface Props {
  contacts: ProfileContacts;
  isOwner: boolean;
  onEdit: () => void;
}

const Row = ({ icon: Icon, href, label }: { icon: any; href: string; label: string }) => (
  <a
    href={href}
    target={href.startsWith("http") ? "_blank" : undefined}
    rel="noopener noreferrer"
    className="flex items-center gap-2.5 text-sm text-foreground/80 hover:text-primary transition-colors break-all"
  >
    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
    <span className="truncate">{label}</span>
  </a>
);

const SocialIcon = ({ icon: Icon, href, label }: { icon: any; href: string; label: string }) => (
  <Button
    asChild
    variant="outline"
    size="icon"
    className="h-9 w-9"
    aria-label={label}
  >
    <a href={href} target="_blank" rel="noopener noreferrer">
      <Icon className="h-4 w-4" />
    </a>
  </Button>
);

const BehanceIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 3.211 3.483 3.312 4.588 2.029h3.168zm-7.686-4h4.965c-.105-1.547-1.136-2.219-2.477-2.219-1.466 0-2.277.768-2.488 2.219zm-9.574 6.988H0V5.021h6.953c5.476.081 5.58 5.444 2.72 6.906 3.461 1.26 3.577 8.061-3.207 8.061zM3 11h3.584c2.508 0 2.906-3-.312-3H3v3zm3.391 3H3v3.016h3.341c3.055 0 2.868-3.016.05-3.016z" />
  </svg>
);

const DribbbleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm9.785 11.083c-.13-.027-2.694-.547-5.291-.221-.054-.122-.1-.252-.156-.379-.157-.371-.331-.747-.51-1.115 2.886-1.18 4.193-2.875 4.207-2.895a9.79 9.79 0 0 1 1.75 4.61zM12 2.21a9.756 9.756 0 0 1 6.434 2.402c-.117.165-1.292 1.764-4.077 2.792-1.281-2.355-2.7-4.286-2.916-4.583A9.804 9.804 0 0 1 12 2.21zM9.974 2.965c.205.275 1.598 2.207 2.892 4.514-3.652.974-6.875.952-7.226.945C6.087 5.673 7.789 3.798 9.974 2.965zM2.21 12.001v-.31c.348.007 4.144.057 8.057-1.118.225.435.434.876.629 1.317-.105.03-.211.061-.314.094-4.052 1.305-6.205 4.873-6.385 5.18A9.787 9.787 0 0 1 2.21 12zM12 21.79c-2.244 0-4.31-.751-5.972-2.013.142-.292 1.748-3.382 6.179-4.927l.052-.018c1.108 2.875 1.563 5.288 1.679 5.985A9.787 9.787 0 0 1 12 21.79zm3.974-1.018c-.078-.466-.499-2.768-1.529-5.601 2.448-.39 4.59.249 4.857.337A9.793 9.793 0 0 1 15.974 20.772z" />
  </svg>
);

const ContactSidebar = ({ contacts, isOwner, onEdit }: Props) => {
  const hasAnyDirect = contacts.email_contact || contacts.phone || contacts.website_url;
  const socials: { icon: any; url: string | null; label: string }[] = [
    { icon: Linkedin, url: contacts.linkedin_url, label: "LinkedIn" },
    { icon: Github, url: contacts.github_url, label: "GitHub" },
    { icon: Instagram, url: contacts.instagram_url, label: "Instagram" },
    { icon: Twitter, url: contacts.twitter_url, label: "Twitter" },
    { icon: BehanceIcon, url: contacts.behance_url, label: "Behance" },
    { icon: DribbbleIcon, url: contacts.dribbble_url, label: "Dribbble" },
  ].filter((s) => !!s.url);

  return (
    <Card className="p-5 shadow-subtle">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-semibold">Contact</h2>
        {isOwner && <SectionEditButton onClick={onEdit} label="Edit contact details" />}
      </div>

      {!hasAnyDirect && socials.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {isOwner ? "Add ways for people to reach you." : "No contact info provided."}
        </p>
      ) : (
        <div className="space-y-3">
          {contacts.email_contact && (
            <Row icon={Mail} href={`mailto:${contacts.email_contact}`} label={contacts.email_contact} />
          )}
          {contacts.phone && (
            <Row icon={Phone} href={`tel:${contacts.phone}`} label={contacts.phone} />
          )}
          {contacts.website_url && (
            <Row icon={Globe} href={contacts.website_url} label={contacts.website_url.replace(/^https?:\/\//, "")} />
          )}

          {socials.length > 0 && (
            <div className="pt-2 flex flex-wrap gap-2">
              {socials.map((s) => (
                <SocialIcon key={s.label} icon={s.icon} href={s.url!} label={s.label} />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default ContactSidebar;
