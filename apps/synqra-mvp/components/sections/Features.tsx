"use client"

const features = [
  {
    title: "AI Intelligence",
    description: "Advanced AI trained on luxury branding and editorial precision.",
  },
  {
    title: "Instant Deployment",
    description: "Optimized workflow. Concept to publish in minutes.",
  },
  {
    title: "Brand Consistency",
    description: "Maintain unwavering quality standards across every content touchpoint.",
  },
  {
    title: "Performance Insights",
    description: "Real-time analytics and data-driven recommendations for strategic growth.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 md:py-32 lg:py-40 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="max-w-2xl mb-16 md:mb-24">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-[-0.02em] mb-6">
            Built for excellence
          </h2>
          <p className="text-base md:text-lg text-muted-foreground font-light leading-relaxed">
            Every feature designed for brands that refuse to compromise
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border/50">
          {features.map((feature, index) => (
            <div
              key={index}
              className="
                group relative p-8 md:p-10 
                bg-background
                hover:bg-accent/40
                transition-all duration-500 ease-out
                motion-reduce:transition-none
              "
            >
              <div className="space-y-4">
                <h3 className="
                  text-lg font-light tracking-tight
                  group-hover:text-foreground
                  transition-colors duration-300
                ">
                  {feature.title}
                </h3>
                <p className="
                  text-sm text-muted-foreground 
                  leading-relaxed font-light
                  group-hover:text-muted-foreground/90
                  transition-colors duration-300
                ">
                  {feature.description}
                </p>
              </div>

              {/* Subtle accent line on hover */}
              <div className="
                absolute bottom-0 left-0 right-0 h-px 
                bg-gradient-to-r from-transparent via-foreground/10 to-transparent
                scale-x-0 group-hover:scale-x-100
                transition-transform duration-700 ease-out
                motion-reduce:transition-none
              " />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
