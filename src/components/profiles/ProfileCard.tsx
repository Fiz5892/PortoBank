import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import LikeButton from "@/components/social/LikeButton";

export interface ProfileCardData {
  id: string;
  user_id?: string;
  username: string | null;
  full_name: string | null;
  profession: string | null;
  location?: string | null;
  avatar_url: string | null;
  skills?: { name: string }[];
}

interface ProfileCardProps {
  profile: ProfileCardData;
  variant?: "default" | "compact";
}

const ProfileCard = ({ profile, variant = "default" }: ProfileCardProps) => {
  const displayName = profile.full_name || profile.username || "Anonymous";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const slug = profile.username || profile.id;
  const topSkills = profile.skills?.slice(0, 3) ?? [];

  return (
    <Card className="p-5 shadow-subtle hover:shadow-elevated transition-shadow flex flex-col h-full">
      <div className="flex items-start gap-3">
        <Avatar className="h-14 w-14">
          {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
          <AvatarFallback className="bg-primary/10 text-primary font-heading font-semibold">
            {initials || "P"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading font-semibold truncate">{displayName}</h3>
          {profile.profession && (
            <p className="text-sm text-muted-foreground truncate">{profile.profession}</p>
          )}
        </div>
        {profile.user_id && (
          <LikeButton
            ownerUserId={profile.user_id}
            variant="ghost"
            size="sm"
            className="shrink-0 -mr-2 -mt-1 h-8 px-2"
            stopPropagation
          />
        )}
      </div>

      {variant === "default" && profile.location && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{profile.location}</span>
        </div>
      )}

      {topSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {topSkills.map((s) => (
            <Badge key={s.name} variant="secondary" className="font-normal">
              {s.name}
            </Badge>
          ))}
        </div>
      )}

      <Button asChild className="mt-5 w-full" variant="outline" size="sm">
        <Link to={`/${slug}`}>View Portfolio</Link>
      </Button>
    </Card>
  );
};

export default ProfileCard;
