export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-xl bg-muted/60 ring-1 ring-foreground/5"
          style={{ height: 84 }}
        />
      ))}
    </div>
  );
}
