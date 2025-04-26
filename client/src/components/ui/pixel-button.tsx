import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ButtonProps } from "@radix-ui/react-button";
import { forwardRef } from "react";

interface PixelButtonProps extends ButtonProps {
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const PixelButton = forwardRef<HTMLButtonElement, PixelButtonProps>(
  ({ variant = "primary", size = "default", className, ...props }, ref) => {
    return (
      <Button
        className={cn(
          "pixel-btn rounded font-pixel",
          {
            "bg-primary hover:bg-red-600 text-white": variant === "primary",
            "bg-secondary hover:bg-green-600 text-white": variant === "secondary",
            "bg-accent hover:bg-yellow-600 text-black": variant === "accent",
            "bg-transparent hover:bg-ui-dark border-2 border-ui-medium text-white": variant === "outline",
            "bg-transparent hover:bg-ui-dark text-white": variant === "ghost",
            "px-4 py-2 text-sm": size === "default",
            "px-2 py-1 text-xs": size === "sm",
            "px-6 py-3 text-base": size === "lg",
            "px-2.5 py-2.5": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

PixelButton.displayName = "PixelButton";

export { PixelButton };
