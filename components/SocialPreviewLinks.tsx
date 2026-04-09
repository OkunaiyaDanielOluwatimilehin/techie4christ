import React, { useEffect, useState } from 'react';
import { SocialLink } from '../types';
import { SocialIcon } from './SocialIcons';

type PreviewData = {
  image: string;
  title: string;
  description: string;
};

interface SocialPreviewLinksProps {
  links: SocialLink[];
  compact?: boolean;
}

const fallbackTitle = (platform: string) => `${platform} Profile`;

const SocialPreviewLinks: React.FC<SocialPreviewLinksProps> = ({ links, compact = false }) => {
  const [previews, setPreviews] = useState<Record<string, PreviewData>>({});

  useEffect(() => {
    let cancelled = false;

    const loadPreviews = async () => {
      const entries = await Promise.all(
        links.map(async (link) => {
          try {
            const res = await fetch(`/api/og?url=${encodeURIComponent(link.url)}`);
            if (!res.ok) {
              return [
                link.platform,
                { image: '', title: fallbackTitle(link.platform), description: link.url },
              ] as const;
            }
            const data = (await res.json()) as Partial<PreviewData>;
            return [
              link.platform,
              {
                image: typeof data.image === 'string' ? data.image : '',
                title: typeof data.title === 'string' && data.title.trim() ? data.title : fallbackTitle(link.platform),
                description:
                  typeof data.description === 'string' && data.description.trim()
                    ? data.description
                    : link.url,
              },
            ] as const;
          } catch {
            return [
              link.platform,
              { image: '', title: fallbackTitle(link.platform), description: link.url },
            ] as const;
          }
        })
      );

      if (cancelled) return;
      setPreviews(Object.fromEntries(entries));
    };

    loadPreviews();

    return () => {
      cancelled = true;
    };
  }, [links]);

  return (
    <div className={compact ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'}>
      {links.map((link) => {
        const preview = previews[link.platform];
        return (
          <a
            key={link.platform}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className={`glass-card preview-card overflow-hidden border border-white/10 hover:border-amber-400/30 transition-all block ${compact ? 'rounded-2xl' : 'rounded-[1.75rem]'}`}
          >
            <div className={compact ? 'flex items-stretch gap-3 p-3' : 'space-y-0'}>
              <div className={compact ? 'w-24 h-20 shrink-0 overflow-hidden rounded-xl bg-slate-900' : 'aspect-[16/9] overflow-hidden bg-slate-900'}>
                {preview?.image ? (
                  <img src={preview.image} alt={preview?.title || link.platform} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-amber-400/15 via-slate-900/30 to-slate-900/70 flex items-center justify-center">
                    <SocialIcon platform={link.platform} className="w-8 h-8 text-amber-300" />
                  </div>
                )}
              </div>
              <div className={compact ? 'min-w-0 flex-1 py-1 pr-1 space-y-1' : 'p-5 space-y-3'}>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.28em] text-amber-300">
                    {link.platform}
                  </span>
                </div>
                <h3 className={`${compact ? 'text-sm' : 'text-2xl'} font-bold text-white leading-snug`}>
                  {preview?.title || fallbackTitle(link.platform)}
                </h3>
                <p className={`text-slate-400 ${compact ? 'text-[10px] line-clamp-2' : 'text-sm leading-relaxed line-clamp-3'}`}>
                  {preview?.description || link.url}
                </p>
                <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-amber-300">
                  Open link
                  <span aria-hidden="true">↗</span>
                </span>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
};

export default SocialPreviewLinks;
