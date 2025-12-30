import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonLoaderProps {
  className?: string;
}

export function CardSkeleton({ className }: SkeletonLoaderProps) {
  return (
    <div className={cn('p-4 rounded-xl bg-card border border-border', className)}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}

export function BalanceSkeleton({ className }: SkeletonLoaderProps) {
  return (
    <div className={cn('p-6 rounded-xl bg-card border border-border', className)}>
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-8 w-32 mb-4" />
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 5, className }: SkeletonLoaderProps & { count?: number }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card/50">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function LeaderboardSkeleton({ className }: SkeletonLoaderProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card/50">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

export function ServerCardSkeleton({ className }: SkeletonLoaderProps) {
  return (
    <div className={cn('p-4 rounded-xl bg-card border border-border', className)}>
      <div className="flex justify-between items-start mb-4">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-5 w-32 mb-2" />
      <Skeleton className="h-4 w-24 mb-4" />
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

export function MiningStatusSkeleton({ className }: SkeletonLoaderProps) {
  return (
    <div className={cn('p-6 rounded-xl bg-card border border-border', className)}>
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-2 w-full rounded-full mb-4" />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Skeleton className="h-3 w-20 mb-1" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div>
          <Skeleton className="h-3 w-16 mb-1" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 space-y-4">
      <Skeleton className="h-8 w-48 mb-6" />
      <BalanceSkeleton />
      <CardSkeleton />
      <ListSkeleton count={3} />
    </div>
  );
}
