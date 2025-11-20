import { Clock, Target, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui";
import { PILOT_BENEFITS } from "@/lib/pilot";

const iconMap = {
  clock: Clock,
  target: Target,
  "trending-up": TrendingUp,
};

export function Benefits() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="caption text-brand-teal mb-4 block">
            Why Founders Choose Synqra
          </span>
          <h2 className="h-h1 font-bold text-brand-fg mb-4">
            Marketing That Actually Works
          </h2>
          <p className="body-lg text-brand-gray max-w-2xl mx-auto">
            Stop trading your time for content. Let Synqra handle the heavy lifting
            while you focus on building your business.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {PILOT_BENEFITS.map((benefit, index) => {
            const Icon = iconMap[benefit.icon as keyof typeof iconMap];
            return (
              <Card
                key={index}
                className="group hover:border-brand-teal/40 transition-all duration-300 hover:shadow-lg hover:shadow-brand-teal/10"
              >
                <CardHeader className="space-y-4">
                  <div className="w-14 h-14 rounded-xl bg-brand-teal/10 flex items-center justify-center group-hover:bg-brand-teal/20 transition-colors">
                    <Icon className="w-7 h-7 text-brand-teal" />
                  </div>
                  <CardTitle className="text-xl">{benefit.title}</CardTitle>
                  <CardDescription className="text-brand-gray leading-relaxed">
                    {benefit.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Stats Bar */}
        <div className="mt-16 grid md:grid-cols-3 gap-8 p-8 rounded-2xl bg-gradient-to-r from-brand-teal/5 to-brand-gold/5 border border-white/10">
          <div className="text-center">
            <div className="text-4xl font-bold text-brand-teal mb-2">15hrs</div>
            <div className="text-sm text-brand-gray">Average time saved per week</div>
          </div>
          <div className="text-center border-l border-r border-white/10 md:border-x">
            <div className="text-4xl font-bold text-brand-teal mb-2">3x</div>
            <div className="text-sm text-brand-gray">Increase in engagement</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-brand-teal mb-2">100%</div>
            <div className="text-sm text-brand-gray">Content consistency</div>
          </div>
        </div>
      </div>
    </section>
  );
}
