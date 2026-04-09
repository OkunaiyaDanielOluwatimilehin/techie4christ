import React from 'react';
import { SOCIAL_LINKS } from '../constants';
import SocialPreviewLinks from './SocialPreviewLinks';
import { SiteSettings } from '../types';

interface AboutProps {
  settings: SiteSettings;
}

const About: React.FC<AboutProps> = ({ settings }) => {
  return (
    <div className='max-w-6xl mx-auto py-16 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12'>
      <div className='space-y-4'>
        <h1 className='text-4xl md:text-5xl font-extrabold tracking-tighter text-white'>
          About <span className='text-amber-400'>Techie 4 Christ</span>
        </h1>
        <p className='text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed'>
          {settings.bio}
        </p>
        <p className='text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed'>
          My mission is to help faith-driven organizations build systems that scale — from digital
          infrastructure and content workflows to training teams that steward technology for Kingdom impact.
        </p>
      </div>

      <div className='space-y-4'>
        <h2 className='text-2xl font-bold text-white'>Connect</h2>
        <p className='text-slate-400 text-sm leading-relaxed max-w-2xl'>
          Follow along for insights on ministry tech, digital mission, and practical tools for
          the Church. You can also reach me directly through the contact page.
        </p>
        <SocialPreviewLinks links={SOCIAL_LINKS} />
      </div>

    </div>
  );
};

export default About;
