import { SocialLink, SiteSettings } from './types';

export const SOCIAL_LINKS: SocialLink[] = [
  { platform: 'Twitter', url: 'https://x.com/techie_4_christ' },
  { platform: 'LinkedIn', url: 'https://www.linkedin.com/in/techie4christ/' },
  { platform: 'YouTube', url: 'https://www.youtube.com/@alex_d_techie_4_christ' },
  { platform: 'Substack', url: 'https://techie4christ.substack.com' }
];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  name: "Alexander Timilehin-Daniels",
  heroTitle: "Hi, I'm Alexander Timilehin-Daniels",
  heroSubtitle: "Content Creator & Creative Writer",
  heroImage: "https://raw.githubusercontent.com/StackBlitz/stackblitz-images/main/alexander-bio.png",
  heroImageSecondary: "https://raw.githubusercontent.com/StackBlitz/stackblitz-images/main/alexander-bio.png",
  bio: "Based in Lagos, Nigeria. I create content bordering on tech-based solutions, innovations, and tools, analyzing how they can be beneficial to the church and the body of Christ.",
  calendlyUrl: "https://calendly.com/techie4christ", 
  substackUrl: "https://techie4christ.substack.com",
  formspreeContactId: "xoqorder",
  formspreeBookingId: "xoqorder",
  bookingMethod: 'both'
};

