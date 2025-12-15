"use client"

const steps = [
  {
    number: "01",
    title: "Define your vision",
    description: "Define brand guidelines, voice, and goals. Our AI learns your style.",
  },
  {
    number: "02",
    title: "Generate content",
    description: "Create editorial pieces, social narratives, and marketing materials with AI-powered sophistication.",
  },
  {
    number: "03",
    title: "Deploy at scale",
    description: "Publish across all channels while tracking performance with intelligent analytics.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 lg:py-40 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="max-w-2xl mb-16 md:mb-24">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-[-0.02em] mb-6">
            How it works
          </h2>
          <p className="text-base md:text-lg text-muted-foreground font-light leading-relaxed">
            Three steps to premium content
          </p>
        </div>

        <div className="max-w-5xl space-y-12 md:space-y-20">
          {steps.map((step, index) => (
            <div
              key={index}
              className="
                group relative 
                grid md:grid-cols-[160px_1fr] gap-8 md:gap-12 
                items-start 
                pb-12 md:pb-20 
                border-b border-border/30 
                last:border-0 last:pb-0
              "
            >
              {/* Number display */}
              <div className="relative">
                <span className="
                  block text-8xl md:text-9xl 
                  font-extralight 
                  text-muted-foreground/20
                  leading-none tracking-tighter
                  group-hover:text-muted-foreground/30
                  transition-colors duration-500
                ">
                  {step.number}
                </span>
              </div>

              {/* Content */}
              <div className="space-y-5 pt-2">
                <h3 className="
                  text-2xl md:text-3xl lg:text-4xl 
                  font-light tracking-tight
                  group-hover:text-foreground
                  transition-colors duration-300
                ">
                  {step.title}
                </h3>
                <p className="
                  text-base md:text-lg 
                  text-muted-foreground 
                  leading-relaxed font-light 
                  max-w-2xl
                ">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
