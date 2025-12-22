'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconArrowLeft, IconShieldCheck, IconLock, IconEye, IconTrash, IconMail } from '@tabler/icons-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen overflow-y-auto bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Ana Sayfaya Don
          </Button>
        </Link>

        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
              <IconShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Gizlilik Politikasi</h1>
            <p className="text-muted-foreground mt-2">
              Son guncelleme: 21 Aralik 2024
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconEye className="h-5 w-5" />
                Genel Bakis
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                Yoga App olarak, kullanicilarimizin gizliligine bueyuk oenem veriyoruz. Bu gizlilik politikasi,
                kisisel verilerinizi nasil topladigimizi, kullandigimizi, sakladigimizi ve korudugumuzu aciklamaktadir.
              </p>
              <p>
                Hizmetlerimizi kullanarak, bu politikada belirtilen uygulamalari kabul etmis sayilirsiniz.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Topladikimiz Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Hesap Bilgileri</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Ad ve soyad</li>
                  <li>E-posta adresi</li>
                  <li>Telefon numarasi (istege bagli)</li>
                  <li>Profil fotografi (istege bagli)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Odeme Bilgileri</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Kart numarasinin son 4 hanesi</li>
                  <li>Kart sahibi adi</li>
                  <li>Son kullanma tarihi</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Not: Tam kart bilgileri sunucularimizda saklanmaz. Odeme islemleri PCI DSS uyumlu
                  ucuncu taraf odeme islemcileri tarafindan gerceklestirilir.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Kullanim Verileri</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Izlenen dersler ve tamamlanma durumu</li>
                  <li>Uygulama kullanim suresi</li>
                  <li>Tercih edilen ders turleri</li>
                  <li>Cihaz ve tarayici bilgileri</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconLock className="h-5 w-5" />
                Veri Guvenligi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Verilerinizi korumak icin endustri standartlarinda guvenlik onlemleri uyguluyoruz:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>256-bit SSL/TLS sifreleme ile veri iletimi</li>
                <li>Sifrelenmis veritabani depolama</li>
                <li>Duzelnli guvenlik denetimleri</li>
                <li>Cok faktorlu kimlik dogrulama secenegi</li>
                <li>PCI DSS uyumlu odeme altyapisi</li>
                <li>GDPR ve KVKK uyumlulugu</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verilerin Kullanimi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Topladigimiz verileri asagidaki amaclar icin kullaniriz:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Hesap olusturma ve yonetimi</li>
                <li>Abonelik ve odeme islemleri</li>
                <li>Kisisellestirilmis icerik onerileri</li>
                <li>Musteri destegi saglama</li>
                <li>Hizmet iyilestirme ve analiz</li>
                <li>Yasal yukumluluklerin yerine getirilmesi</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ucuncu Taraf Paylasimi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Kisisel verilerinizi asagidaki durumlar disinda ucuncu taraflarla paylasmiyor ve satmiyoruz:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Odeme islemleri icin odeme hizmet saglayicilari (Stripe, iyzico)</li>
                <li>E-posta hizmetleri icin teknik altyapi saglayicilari</li>
                <li>Yasal zorunluluklar ve mahkeme kararlari</li>
                <li>Acik izninizle yapilan paylasilmlar</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconTrash className="h-5 w-5" />
                Veri Saklama ve Silme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Kisisel verileriniz, hesabiniz aktif oldugu surece ve yasal saklama surelerince muhafaza edilir.
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Hesap silme talebinde bulundugdunuzda verileriniz 30 gun icinde silinir</li>
                <li>Fatura ve odeme kayitlari yasal gereklilikler geregi 10 yil saklanir</li>
                <li>Anonim istatistik verileri suresiz olarak saklanabilir</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Haklariniz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                KVKK ve GDPR kapsaminda asagidaki haklara sahipsiniz:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Verilerinize erisim hakki</li>
                <li>Verilerinizi duzeltme hakki</li>
                <li>Verilerinizi silme hakki (unutulma hakki)</li>
                <li>Veri tasima hakki</li>
                <li>Islem kisitlama hakki</li>
                <li>Itiraz hakki</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                Bu haklarinizi kullanmak icin asagidaki iletisim bilgilerinden bize ulasabilirsiniz.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cerezler (Cookies)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Web sitemizde ve uygulamamizda cerezler kullaniyoruz:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li><strong>Zorunlu Cerezler:</strong> Oturum yonetimi ve guvenlik</li>
                <li><strong>Islevsel Cerezler:</strong> Tercihlerinizi hatirlama</li>
                <li><strong>Analitik Cerezler:</strong> Kullanim istatistikleri (anonim)</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                Tarayici ayarlarinizdan cerez tercihlerinizi yonetebilirsiniz.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconMail className="h-5 w-5" />
                Iletisim
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Gizlilik politikamiz hakkinda sorulariniz veya talepleriniz icin:
              </p>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>E-posta:</strong>{' '}
                  <a href="mailto:gizlilik@yogaapp.com" className="text-primary hover:underline">
                    gizlilik@yogaapp.com
                  </a>
                </p>
                <p>
                  <strong>Veri Koruma Yetkilisi:</strong>{' '}
                  <a href="mailto:kvkk@yogaapp.com" className="text-primary hover:underline">
                    kvkk@yogaapp.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Politika Degisiklikleri</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Bu gizlilik politikasini zaman zaman guncelleyebiliriz. Onemli degisiklikler yapildiginda,
                sizi e-posta veya uygulama icinde bilgilendiririz. Guncellenmis politika bu sayfada
                yayinlanacaktir.
              </p>
            </CardContent>
          </Card>

          <div className="text-center pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              Bu politika hakkinda sorulariniz mi var?{' '}
              <a href="mailto:destek@yogaapp.com" className="text-primary hover:underline">
                Bize ulasin
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
