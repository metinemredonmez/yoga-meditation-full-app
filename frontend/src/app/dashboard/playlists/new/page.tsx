import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { PlaylistForm } from '@/features/playlists/components/playlist-form';

export const metadata: Metadata = {
  title: 'Yeni Playlist | Yoga Admin',
  description: 'Yeni playlist oluştur',
};

export default function NewPlaylistPage() {
  return (
    <PageContainer>
      <PlaylistForm />
    </PageContainer>
  );
}
