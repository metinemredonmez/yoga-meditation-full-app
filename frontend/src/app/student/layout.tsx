import KBar from '@/components/kbar';
import { StudentSidebar } from '@/components/layout/student-sidebar';
import Header from '@/components/layout/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Kullanıcı Paneli | Yoga',
  description: 'Yoga kullanıcı paneli'
};

export default async function StudentLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <KBar>
      <SidebarProvider defaultOpen={defaultOpen}>
        <StudentSidebar />
        <SidebarInset>
          <Header />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </KBar>
  );
}
