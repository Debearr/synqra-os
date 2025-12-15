"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function Hero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 lg:pt-56 lg:pb-40">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="max-w-5xl mx-auto text-center space-y-12 md:space-y-16">
          <h1 
            className={`
              text-6xl sm:text-7xl md:text-8xl lg:text-[96px] 
              font-light tracking-[-0.025em] 
              leading-[0.95] 
              transition-all duration-1000 ease-out
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            `}
          >
            Premium content
            <br />
            for luxury brands
          </h1>

          <p 
            className={`
              text-base md:text-lg lg:text-xl 
              text-muted-foreground 
              max-w-2xl mx-auto 
              leading-relaxed 
              font-light
              transition-all duration-1000 delay-200 ease-out
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            `}
          >
            AI-driven content intelligence for luxury brands. Agency-quality output, minimal cost, zero complexity.
          </p>

          <div 
            className={`
              flex flex-col sm:flex-row items-center justify-center gap-4 pt-4
              transition-all duration-1000 delay-400 ease-out
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            `}
          >
            <Button
              size="lg"
              className="
                h-12 px-10 text-base font-light w-full sm:w-auto
                bg-foreground text-background 
                hover:bg-foreground/90 
                transition-all duration-300 ease-out
                motion-reduce:transition-none
              "
            >
              Start creating
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="
                h-12 px-10 text-base font-light w-full sm:w-auto
                border-border hover:bg-accent 
                transition-all duration-300 ease-out
                motion-reduce:transition-none
              "
            >
              Watch demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
