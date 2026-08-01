import { Construction } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

/** Placeholder for dashboard sections landing in a later build phase. */
export function ComingSoon({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      <Card>
        <CardContent className="flex items-start gap-3 pt-6">
          <Construction className="text-muted-foreground mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-medium">Coming in {phase}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              This section is part of the build still in progress.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
