import { prisma } from '../utils/database';
import { config } from '../utils/config';
import { EpisodeStatus, PodcastStatus } from '@prisma/client';
import { buildCdnUrl } from './storageService';

interface PodcastForRss {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  coverImage: string | null;
  category: string;
  hostName: string | null;
  hostBio: string | null;
  isExplicit: boolean;
  language: string;
  websiteUrl: string | null;
  status: string;
  episodes: {
    id: string;
    title: string;
    slug: string;
    description: string;
    audioUrl: string | null;
    audioFormat: string;
    audioSize: number | null;
    duration: number | null;
    isExplicit: boolean;
    seasonNumber: number | null;
    episodeNumber: number;
    publishedAt: Date | null;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get base URL for the application
 */
function getBaseUrl(): string {
  return (config as { APP_BASE_URL?: string }).APP_BASE_URL || 'https://app.example.com';
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format date for RSS (RFC 2822)
 */
function formatRssDate(date: Date): string {
  return date.toUTCString();
}

/**
 * Format duration for iTunes (HH:MM:SS or MM:SS)
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Map podcast category to iTunes category
 */
function getItunesCategory(category: string): { category: string; subcategory?: string } {
  const categoryMap: Record<string, { category: string; subcategory?: string }> = {
    WELLNESS: { category: 'Health &amp; Fitness', subcategory: 'Mental Health' },
    MEDITATION: { category: 'Health &amp; Fitness', subcategory: 'Mental Health' },
    YOGA_INSTRUCTION: { category: 'Health &amp; Fitness', subcategory: 'Fitness' },
    BREATHWORK: { category: 'Health &amp; Fitness', subcategory: 'Alternative Health' },
    PHILOSOPHY: { category: 'Society &amp; Culture', subcategory: 'Philosophy' },
    INTERVIEWS: { category: 'Health &amp; Fitness' },
    MUSIC: { category: 'Music' },
    STORIES: { category: 'Arts', subcategory: 'Performing Arts' },
    GUIDED_PRACTICE: { category: 'Health &amp; Fitness', subcategory: 'Fitness' },
    MINDFULNESS: { category: 'Health &amp; Fitness', subcategory: 'Mental Health' },
  };

  return categoryMap[category] || { category: 'Health &amp; Fitness' };
}

/**
 * Generate RSS feed XML for a podcast
 */
export async function generatePodcastRssFeed(podcastSlug: string): Promise<string | null> {
  const podcast = await prisma.podcasts.findUnique({
    where: { slug: podcastSlug },
    include: {
      podcast_episodes: {
        where: { status: EpisodeStatus.PUBLISHED },
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          audioUrl: true,
          audioFormat: true,
          audioSize: true,
          duration: true,
          isExplicit: true,
          seasonNumber: true,
          episodeNumber: true,
          publishedAt: true,
        },
      },
    },
  });

  if (!podcast) {
    return null;
  }

  // Map podcast_episodes to episodes for compatibility
  const podcastWithEpisodes: PodcastForRss | null = podcast ? {
    ...podcast,
    episodes: podcast.podcast_episodes
  } : null;

  if (!podcastWithEpisodes || podcastWithEpisodes.status !== PodcastStatus.PUBLISHED) {
    return null;
  }

  const baseUrl = getBaseUrl();
  const feedUrl = `${baseUrl}/api/podcasts/${podcastWithEpisodes.slug}/rss`;
  const podcastUrl = `${baseUrl}/podcasts/${podcastWithEpisodes.slug}`;
  const itunesCategory = getItunesCategory(podcastWithEpisodes.category);

  const authorName = podcastWithEpisodes.hostName || 'Unknown';
  const authorEmail = 'podcast@example.com';

  // Build RSS XML
  let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:podcast="https://podcastindex.org/namespace/1.0">
  <channel>
    <title>${escapeXml(podcastWithEpisodes.title)}</title>
    <link>${escapeXml(podcastUrl)}</link>
    <description>${escapeXml(podcastWithEpisodes.description)}</description>
    <language>${podcastWithEpisodes.language}</language>
    <lastBuildDate>${formatRssDate(podcastWithEpisodes.updatedAt)}</lastBuildDate>
    <pubDate>${formatRssDate(podcastWithEpisodes.createdAt)}</pubDate>
    <generator>Yoga App Podcast Platform</generator>

    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>

    <itunes:summary>${escapeXml(podcastWithEpisodes.shortDescription || podcastWithEpisodes.description)}</itunes:summary>
    <itunes:author>${escapeXml(authorName)}</itunes:author>
    <itunes:owner>
      <itunes:name>${escapeXml(authorName)}</itunes:name>
      <itunes:email>${escapeXml(authorEmail)}</itunes:email>
    </itunes:owner>
    <itunes:explicit>${podcastWithEpisodes.isExplicit ? 'yes' : 'no'}</itunes:explicit>
    <itunes:type>episodic</itunes:type>
    <itunes:category text="${itunesCategory.category}"${itunesCategory.subcategory ? `>
      <itunes:category text="${itunesCategory.subcategory}"/>
    </itunes:category>` : '/>'}
`;

  // Add podcast cover image
  if (podcastWithEpisodes.coverImage) {
    const coverUrl = podcastWithEpisodes.coverImage.startsWith('http')
      ? podcastWithEpisodes.coverImage
      : buildCdnUrl(podcastWithEpisodes.coverImage);
    rss += `    <image>
      <url>${escapeXml(coverUrl)}</url>
      <title>${escapeXml(podcastWithEpisodes.title)}</title>
      <link>${escapeXml(podcastUrl)}</link>
    </image>
    <itunes:image href="${escapeXml(coverUrl)}"/>
`;
  }

  // Add episodes
  for (const episode of podcastWithEpisodes.episodes) {
    if (!episode.audioUrl || !episode.publishedAt) continue;

    const audioUrl = episode.audioUrl.startsWith('http')
      ? episode.audioUrl
      : buildCdnUrl(episode.audioUrl);

    const episodeUrl = `${baseUrl}/podcasts/${podcastWithEpisodes.slug}/episodes/${episode.slug}`;
    const guid = `${podcastWithEpisodes.id}-${episode.id}`;

    rss += `
    <item>
      <title>${escapeXml(episode.title)}</title>
      <link>${escapeXml(episodeUrl)}</link>
      <description>${escapeXml(episode.description)}</description>
      <pubDate>${formatRssDate(episode.publishedAt)}</pubDate>
      <guid isPermaLink="false">${guid}</guid>

      <enclosure
        url="${escapeXml(audioUrl)}"
        length="${episode.audioSize || 0}"
        type="audio/${episode.audioFormat === 'mp3' ? 'mpeg' : episode.audioFormat}"/>

      <itunes:summary>${escapeXml(episode.description)}</itunes:summary>
      <itunes:explicit>${episode.isExplicit ? 'yes' : 'no'}</itunes:explicit>
      <itunes:episodeType>full</itunes:episodeType>
      <itunes:episode>${episode.episodeNumber}</itunes:episode>
      ${episode.seasonNumber ? `<itunes:season>${episode.seasonNumber}</itunes:season>` : ''}
      ${episode.duration ? `<itunes:duration>${formatDuration(episode.duration)}</itunes:duration>` : ''}
    </item>`;
  }

  rss += `
  </channel>
</rss>`;

  return rss;
}

/**
 * Get RSS feed URL for a podcast
 */
export function getPodcastRssUrl(podcastSlug: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/api/podcasts/${podcastSlug}/rss`;
}
