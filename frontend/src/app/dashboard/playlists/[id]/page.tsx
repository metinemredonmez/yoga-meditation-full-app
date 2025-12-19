import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { PlaylistForm } from '@/features/playlists/components/playlist-form';

export const metadata: Metadata = {
  title: 'Playlist Düzenle | Yoga Admin',
  description: 'Playlist düzenle',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPlaylistPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <PageContainer>
      <PlaylistForm playlistId={id} />
    </PageContainer>
  );
}
