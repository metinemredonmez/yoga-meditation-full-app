import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { PlaylistsTable } from '@/features/playlists/components/playlists-table';

export const metadata: Metadata = {
  title: 'Playlistler | Yoga Admin',
  description: 'Playlist yönetimi',
};

export default function PlaylistsPage() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Playlistler</h1>
          <p className="text-muted-foreground">
            Sistem ve kullanıcı playlistlerini yönetin
          </p>
        </div>
        <PlaylistsTable />
      </div>
    </PageContainer>
  );
}
