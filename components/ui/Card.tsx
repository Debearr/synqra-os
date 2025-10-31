import * as React from "react";
import { cn } from "@/lib/utils";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "glassmorphism transition-transform duration-300 hover:-translate-y-0.5 hover:glow-teal",
        className
      )}
      {...props}
    />
  );
}

export default Card;
