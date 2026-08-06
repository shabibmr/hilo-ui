import { FounderStoryContent } from '../types';

export const MOCK_FOUNDER_STORY: FounderStoryContent = {
  headline: 'Meet the hands behind HILO ARTE',
  subheadline: 'A journey from a single thread to a universe of quiet, slow-living creativity.',
  founderName: 'Naima',
  founderTitle: 'Founder & Creative Director',
  portraitImage: { url: '/images/founder/naima-portrait.jpg', altText: 'Naima in her embroidery studio' },
  storyParagraphs: [
    'Hi, I’m Naima.',
    'What began with a simple thread slowly became a world of stitches, florals, quiet moments, and handmade stories.',
    'In a world that constantly asks us to move faster, HILO ARTE was born from a desire to reclaim the slow hour. The quiet evening. The simple joy of holding fabric inside a wooden hoop and watching a floral pattern blossom under your hands.',
    'Every kit is designed in our studio with utmost care — using 100% natural organic linen, non-toxic water-soluble ink, and threads selected for their soft lustre and warm tones.',
    'Whether you have never held an embroidery needle before or are returning to creative craft, these kits are created for your peace of mind.'
  ],
  galleryImages: [
    { url: '/images/founder/workspace-1.jpg', altText: 'Studio thread collection' },
    { url: '/images/founder/workspace-2.jpg', altText: 'Hand drawing floral patterns' },
    { url: '/images/founder/workspace-3.jpg', altText: 'Linen stitching detail' },
    { url: '/images/founder/workspace-4.jpg', altText: 'Gift box packaging process' }
  ],
  quote: 'Beautiful things do not need to be rushed. Your first stitch is a gentle invitation to pause.'
};
