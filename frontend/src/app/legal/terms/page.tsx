'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconArrowLeft, IconFileText, IconScale, IconAlertTriangle, IconCreditCard, IconUserCheck, IconBan, IconMail } from '@tabler/icons-react';

export default function TermsOfServicePage() {
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
              <IconFileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Kullanim Sartlari</h1>
            <p className="text-muted-foreground mt-2">
              Son guncelleme: 21 Aralik 2024
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconScale className="h-5 w-5" />
                Genel Hukumler
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                Bu kullanim sartlari (&quot;Sartlar&quot;), Yoga App (&quot;Sirket&quot;, &quot;biz&quot;, &quot;bizim&quot;) tarafindan sunulan
                hizmetlerin kullanimini duzzenlemektedir. Hizmetlerimizi kullanarak bu sartlari kabul etmis sayilirsiniz.
              </p>
              <p>
                Bu sartlari kabul etmiyorsaniz, lutfen hizmetlerimizi kullanmayiniz.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hizmet Tanimi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Yoga App, kullanicilarina asagidaki hizmetleri sunar:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Online yoga ve meditasyon dersleri</li>
                <li>Kisisellestirilmis egzersiz programlari</li>
                <li>Ilerleme takibi ve istatistikler</li>
                <li>Topluluk ozellikleri</li>
                <li>Premium icerik ve ozellikler (abonelik gerektrir)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUserCheck className="h-5 w-5" />
                Hesap Olusturma ve Sorumluluklar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Hesap Gereksinimleri</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>18 yasindan buyuk olmalisiniz (veya ebeveyn izni gereklidir)</li>
                  <li>Gecerli bir e-posta adresi saglmalisiniz</li>
                  <li>Dogru ve guncel bilgiler vermalisiniz</li>
                  <li>Hesabinizin guvenliginden siz sorumlusunuz</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Kullici Sorumluluklari</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Hesap bilgilerinizi gizli tutmak</li>
                  <li>Yetkisiz erisimleri derhal bildirmek</li>
                  <li>Hesabiniz altinda yapilan tum islemlerden sorumlu olmak</li>
                  <li>Hizmetleri yasal amaclarla kullanmak</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCreditCard className="h-5 w-5" />
                Abonelik ve Odemeler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Abonelik Planlari</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Ucretsiz plan: Sinirli icerik erisimi</li>
                  <li>Premium Aylik: Tum iceriklere erisim, aylik faturalandirma</li>
                  <li>Premium Yillik: Tum iceriklere erisim, yillik faturalandirma (indirimli)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Odeme Kosullari</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Abonelikler otomatik olarak yenilenir</li>
                  <li>Fiyatlar KDV dahildir</li>
                  <li>Odeme Turk Lirasi (TRY) cinsinden yapilir</li>
                  <li>Kabul edilen odeme yontemleri: Kredi/Banka karti, Google Pay, Apple Pay</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Iptal ve Iade</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Aboneligi istediginiz zaman iptal edebilirsiniz</li>
                  <li>Iptal, mevcut donem sonunda gecerli olur</li>
                  <li>7 gun icinde kullanilmamis abonelikler icin tam iade yapilir</li>
                  <li>Kismi donem iadeleri yapilmaz</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBan className="h-5 w-5" />
                Yasakli Kullanim
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Asagidaki eylemler kesinlikle yasaktir:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Iceriklerimizi izinsiz kopyalamak, dagitmak veya satmak</li>
                <li>Hesabinizi baskasina devretmek veya paylasmak</li>
                <li>Hizmetlerimize zarar verecek yazilimlar kullanmak</li>
                <li>Diger kullanicilari taciz etmek veya rahatsiz etmek</li>
                <li>Yaniltici veya sahte bilgi paylasmak</li>
                <li>Sistemlerimizin guvenligini tehlikeye atacak eylemler</li>
                <li>Otomatik araclarlaa veri toplamak (scraping)</li>
                <li>Spam veya istenmeyen reklam yapmak</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fikri Mulkiyet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Tum icerikler (videolar, gorseller, metinler, logolar, yazilim) Yoga App&apos;e aittir
                ve telif haklari ile korunmaktadir.
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Icerikleri yalnizca kisisel kullanim icin izleyebilirsiniz</li>
                <li>Ticari kullanim kesinlikle yasaktir</li>
                <li>Iceriklerin indirilmesi veya kaydedilmesi yasaktir</li>
                <li>Ihlal durumunda hesabiniz feshedilir ve yasal islem baslatilabilir</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconAlertTriangle className="h-5 w-5" />
                Saglik Uyarisi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Yoga App, egitim ve genel wellness amaclidir. Tibbi tavsiye yerine gecmez.
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Herhangi bir saglik sorununuz varsa doktorunuza danisin</li>
                <li>Egzersizleri kendi fiziksel durumunuza gore uyarlayin</li>
                <li>Agri veya rahatsizlik hissettildinde durun</li>
                <li>Hamilelik, yaralanma veya kronik hastalik durumunda uzman gorusu alin</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4 font-medium">
                Yoga App, egzersiz sirasinda meydana gelebilecek yaralanmalardan sorumlu tutulamaz.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sorumluluk Sinirlamasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Yoga App, yasalarin izin verdigi olcude:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Hizmetin kesintisiz veya hatasiz olacagini garanti etmez</li>
                <li>Dolayli, arizi veya sonucta ortaya cikan zararlardan sorumlu degildir</li>
                <li>Ucuncu taraf iceriklerinden veya linklerinden sorumlu degildir</li>
                <li>Force majeure durumlarinda sorumlu tutulamaz</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                Toplam sorumlulugumuz, son 12 ayda odediginiz abonelik ucretini asamaz.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hesap Feshi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Kullanici Tarafindan Fesih</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Hesabinizi istediginiz zaman silebilirsiniz</li>
                  <li>Aktif abonelikler donem sonuna kadar gecerlidir</li>
                  <li>Silinen veriler geri alinamaz</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Sirket Tarafindan Fesih</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Kullanim sartlarinin ihlali durumunda</li>
                  <li>Uzun sureli hesap inaktivitesi (2 yil+)</li>
                  <li>Yasalara aykiri faaliyetler</li>
                  <li>Odeme sorunlari ve borclar</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Degisiklikler</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Bu sartlari zaman zaman guncelleyebiliriz. Onemli degisiklikler yapildiginda,
                sizi en az 30 gun once e-posta veya uygulama icinde bilgilendiririz.
                Guncellenmis sartlar yayinlandiktan sonra hizmeti kullanmaya devam etmeniz,
                yeni sartlari kabul ettiginiz anlamina gelir.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Uygulanacak Hukuk</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Bu sartlar Turkiye Cumhuriyeti yasalarina tabidir. Uyusmazlik durumunda
                Istanbul Mahkemeleri yetkilidir.
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
                Bu sartlar hakkinda sorulariniz icin:
              </p>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>E-posta:</strong>{' '}
                  <a href="mailto:hukuk@yogaapp.com" className="text-primary hover:underline">
                    hukuk@yogaapp.com
                  </a>
                </p>
                <p>
                  <strong>Genel Destek:</strong>{' '}
                  <a href="mailto:destek@yogaapp.com" className="text-primary hover:underline">
                    destek@yogaapp.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="text-center pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              Diger politikalarimiz:{' '}
              <Link href="/legal/privacy" className="text-primary hover:underline">
                Gizlilik Politikasi
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
