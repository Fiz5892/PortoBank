import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const ProfileCardSkeleton = () => (
  <Card className="p-5 shadow-subtle">
    <div className="flex items-center gap-3">
      <Skeleton className="h-14 w-14 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <div className="flex gap-1.5 mt-5">
      <Skeleton className="h-5 w-14" />
      <Skeleton className="h-5 w-16" />
      <Skeleton className="h-5 w-12" />
    </div>
    <Skeleton className="h-9 w-full mt-5" />
  </Card>
);
