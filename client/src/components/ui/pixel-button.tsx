import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { forwardRef } from "react";

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
  asChild?: boolean;
}

const PixelButton = forwardRef<HTMLButtonElement, PixelButtonProps>(
  ({ variant = "primary", size = "default", className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          "pixel-btn rounded font-pixel inline-flex items-center justify-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
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
