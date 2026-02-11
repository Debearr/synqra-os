import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "outline" | "ghost";
type Size = "default" | "sm" | "lg" | "icon";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children?: React.ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps | "href"> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantClasses: Record<Variant, string> = {
  default: "bg-pink-600 text-white hover:bg-pink-700 focus-visible:ring-pink-500",
  outline:
    "border border-pink-100 bg-white text-pink-700 hover:bg-pink-50 focus-visible:ring-pink-200",
  ghost: "text-pink-600 hover:bg-pink-50 focus-visible:ring-pink-200",
};

const sizeClasses: Record<Size, string> = {
  default: "h-11 px-5 py-2",
  sm: "h-9 px-4 text-sm",
  lg: "h-12 px-6 text-lg",
  icon: "h-10 w-10 p-0",
};

export const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (props, forwardedRef) => {
    const {
      variant = "default",
      size = "default",
      className,
      children,
      href,
      ...rest
    } = props as ButtonProps & { href?: string };

    const baseClasses = cn(
      "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-60",
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    if (href) {
      return (
        <a
          ref={forwardedRef as React.Ref<HTMLAnchorElement>}
          href={href}
          className={baseClasses}
          {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </a>
      );
    }

    return (
      <button
        ref={forwardedRef as React.Ref<HTMLButtonElement>}
        className={baseClasses}
        {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
