// Add SocialLink interface used by constants.tsx and social media components
export interface SocialLink {
  platform: string;
  url: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image: string;
  externalUrl: string;
  tag?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  content: string;
  thumbnail: string;
  source: string;
}

export interface InternalArticle {
  id: string;
  title: string;
  content: string;
  thumbnail: string;
  pubDate: string;
  category: string;
  slug: string;
}

export interface Asset {
  id: string;
  name: string;
  price: string;
  isPaid?: boolean | string;
  category: string;
  description: string;
  image: string;
  platform: 'Gumroad' | 'Google Drive' | 'Direct';
  externalUrl: string;
}

export interface YouTubeVideo {
  id: string;
  url: string;
  title: string;
}

export interface PodcastEpisode {
  id: string;
  title: string;
  audioUrl: string;
  link: string;
  pubDate: string;
  description: string;
  thumbnail: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  link: string;
}

export interface SiteSettings {
  name: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  heroImageSecondary?: string;
  bio: string;
  substackUrl: string;
  formspreeContactId: string;
  calendlyUrl: string;
  formspreeBookingId: string;
  bookingMethod: 'automatic' | 'manual' | 'both';
}

export interface FeedConfig {
  id: string;
  name: string;
  rssUrl: string;
}



