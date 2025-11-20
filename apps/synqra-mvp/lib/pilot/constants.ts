/**
 * Synqra Founder Pilot - Constants
 * Core configuration for the pilot program
 */

export const PILOT_PRICING = {
  price: 97,
  duration: 7,
  currency: "USD",
  displayPrice: "$97",
  displayDuration: "7 days",
} as const;

export const PILOT_BENEFITS = [
  {
    title: "Get Your Time Back",
    description: "Stop spending 10+ hours weekly on content. Synqra handles planning, creation, and posting automatically.",
    icon: "clock",
  },
  {
    title: "Build Consistency",
    description: "Never miss a post again. Show up daily with high-quality content that maintains your brand voice.",
    icon: "target",
  },
  {
    title: "Create More Opportunities",
    description: "More visibility means more conversations, more leads, and more revenue. Marketing that actually works.",
    icon: "trending-up",
  },
] as const;

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Apply in 5 Minutes",
    description: "Tell us about your business and marketing goals. We'll review your application within 24 hours.",
  },
  {
    step: "02",
    title: "7-Day Test Drive",
    description: "Synqra runs your marketing for a full week. Plans, creates, posts, and engages — completely hands-off.",
  },
  {
    step: "03",
    title: "Review Results",
    description: "See the impact: time saved, engagement metrics, and new opportunities. Then decide if you want to continue.",
  },
] as const;

export const TESTIMONIALS = [
  {
    quote: "Synqra gave me back 15 hours a week. My LinkedIn engagement is up 3x and I'm closing more deals.",
    author: "Sarah Chen",
    role: "Founder, TechFlow Studio",
    avatar: "/pilot/testimonial-1.jpg",
  },
  {
    quote: "I was skeptical about AI content, but Synqra nailed my voice. Prospects think I'm everywhere.",
    author: "Marcus Rodriguez",
    role: "CEO, BuildRight",
    avatar: "/pilot/testimonial-2.jpg",
  },
  {
    quote: "Best $97 I ever spent. Synqra pays for itself with one new client conversation.",
    author: "Emily Watkins",
    role: "Creative Director, Studio MINT",
    avatar: "/pilot/testimonial-1.jpg",
  },
] as const;

export const FAQ_ITEMS = [
  {
    question: "What exactly does Synqra do?",
    answer: "Synqra is your AI marketing assistant. It plans your content calendar, creates posts in your voice, publishes automatically, and engages with your audience. It's like hiring a marketing team, but faster and more affordable.",
  },
  {
    question: "How is this different from ChatGPT?",
    answer: "ChatGPT gives you raw text. Synqra gives you a complete marketing system: strategy, content creation, scheduling, publishing, and engagement tracking. Plus, it learns your specific voice and brand over time.",
  },
  {
    question: "What happens after the 7 days?",
    answer: "You'll receive a detailed report showing time saved, content performance, and engagement metrics. If you're happy with the results, you can continue with a monthly subscription. No pressure, no auto-renewal.",
  },
  {
    question: "Do I need to provide anything?",
    answer: "Just a brief overview of your business and goals during the application. We'll handle everything else. If you have existing brand guidelines or sample content, that helps us match your voice faster.",
  },
  {
    question: "Which platforms does Synqra support?",
    answer: "Currently: LinkedIn, Twitter/X, and email newsletters. We're expanding to Instagram, YouTube, and TikTok soon. Let us know your priorities in your application.",
  },
  {
    question: "Is this right for my business?",
    answer: "Synqra works best for founders, consultants, coaches, and creative professionals who want consistent online presence but don't have time for daily content creation. If you're selling services or building authority, this is for you.",
  },
] as const;

export const PILOT_CTA = {
  primary: "Start Your 7-Day Test Drive",
  secondary: "See How It Works",
  footer: "Join the Founder Pilot",
} as const;
