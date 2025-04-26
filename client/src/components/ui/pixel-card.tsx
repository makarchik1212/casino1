import { Card, CardProps } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface PixelCardProps extends CardProps {
  withBorder?: boolean;
}

const PixelCard = forwardRef<HTMLDivElement, PixelCardProps>(
  ({ className, withBorder = true, ...props }, ref) => {
    return (
      <Card
        className={cn(
          "bg-ui-dark rounded-lg overflow-hidden",
          withBorder && "pixel-border",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

PixelCard.displayName = "PixelCard";

export { PixelCard };
