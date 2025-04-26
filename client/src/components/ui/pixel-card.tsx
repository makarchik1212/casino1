import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { forwardRef, ReactNode } from "react";

interface PixelCardProps extends React.HTMLAttributes<HTMLDivElement> {
  withBorder?: boolean;
  children?: ReactNode;
}

const PixelCard = forwardRef<HTMLDivElement, PixelCardProps>(
  ({ className, withBorder = true, children, ...props }, ref) => {
    return (
      <Card
        className={cn(
          "bg-ui-dark rounded-lg overflow-hidden",
          withBorder && "pixel-border",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </Card>
    );
  }
);

PixelCard.displayName = "PixelCard";

export { PixelCard, type PixelCardProps };
