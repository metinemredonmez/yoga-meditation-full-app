import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { ShopItemsTable } from '@/features/gamification/components/shop-items-table';

export const metadata: Metadata = {
  title: 'Mağaza | Gamification',
  description: 'Mağaza ürünlerini yönetin',
};

export default function ShopPage() {
  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mağaza</h2>
          <p className="text-muted-foreground">
            Kullanıcıların coin ve gem ile satın alabileceği ürünleri yönetin
          </p>
        </div>
        <ShopItemsTable />
      </div>
    </PageContainer>
  );
}
