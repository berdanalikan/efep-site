import { createFileRoute } from "@tanstack/react-router";
import efepLogo from "@/assets/efep-logo.jpeg";
import { RegistrationForm } from "@/components/RegistrationForm";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EFEP Derneği — Bilgilendirme Ön Talep Formu" },
      {
        name: "description",
        content:
          "EFEP Derneği kuruluş sürecinden ilk haberdar olanlar arasında yer almak için ön kayıt oluşturun.",
      },
      { property: "og:title", content: "EFEP Derneği — Ön Kayıt" },
      {
        property: "og:description",
        content:
          "Eczacılık Fakültesi Öğrencileri Eğitimde Eşitlik Platformu Derneği ön kayıt formu.",
      },
    ],
  }),
  component: EfepPage,
});

function EfepPage() {
  return (
    <main className="min-h-screen bg-background" style={{ ["--page" as string]: "var(--efep)" }}>
      <section
        className="relative overflow-hidden border-b"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--efep) 12%, transparent), color-mix(in oklab, var(--efep-accent) 14%, transparent))",
        }}
      >
        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:py-20">
          <img
            src={efepLogo}
            alt="EFEP Derneği"
            className="mx-auto max-h-40 object-contain"
          />
          <h1 className="mt-8 text-3xl font-bold leading-tight tracking-tight sm:text-4xl" style={{ color: "var(--efep)" }}>
            EFEP Derneği Kuruluş Sürecinden İlk Haberdar Olanlar Arasında Yer Almak İçin
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Bilgilerinizi paylaşın, dernek faaliyetleri başladığında sizinle iletişime geçelim.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-6"
            style={{ backgroundColor: "var(--efep)", color: "white" }}
          >
            <a href="#kayit">Ön Kayıt Ol</a>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <h2 className="text-2xl font-bold sm:text-3xl">EFEP Derneği Bilgilendirme Ön Talep Formu</h2>
        <div className="mt-6 space-y-4 text-base leading-relaxed text-foreground/90">
          <p>
            Eczacılık Fakültesi öğrencileri ve yeni mezunların eğitimde fırsat eşitliğini desteklemek
            amacıyla <strong>EFEP Derneği</strong> kurulma sürecindedir.
          </p>
          <p>
            Bu form, derneğimizin kuruluş süreci tamamlandığında sizleri bilgilendirmek; eğitimler,
            mentorluk programları ve etkinlikler hakkında ilk haberdar olanlar arasında yer almanızı
            sağlamak amacıyla oluşturulmuştur.
          </p>
          <p>
            Bilgilerinizi paylaşmanız halinde, yalnızca bu kapsamda sizinle iletişime geçilecektir.
          </p>
          <p>
            Birlikte öğrenmek, gelişmek ve mesleğimiz için daha güçlü bir gelecek oluşturmak üzere
            sizi de bu sürecin bir parçası olmaya davet ediyoruz.
          </p>
        </div>
      </section>

      <section id="kayit" className="mx-auto max-w-2xl scroll-mt-8 px-4 pb-12">
        <RegistrationForm accentClass="text-white hover:opacity-90" />
        <style>{`#kayit button[type="submit"]{background-color: var(--efep);}`}</style>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16">
        <Accordion type="single" collapsible className="rounded-2xl border bg-card px-4 sm:px-6">
          <AccordionItem value="kvkk" className="border-0">
            <AccordionTrigger className="text-left text-base font-semibold">
              KVKK Aydınlatma ve Açık Rıza Metni
            </AccordionTrigger>
            <AccordionContent className="space-y-4 text-sm leading-relaxed text-foreground/85">
              <p>
                Kurulmakta olan <strong>EFEP Derneği (Eczacılık Fakültesi Öğrencileri Eğitimde Eşitlik
                Platformu Derneği)</strong> kapsamında, dernek kuruluş süreci ve sonrasında
                gerçekleştirilecek faaliyetler hakkında bilgilendirme yapılabilmesi amacıyla;
                ad-soyad, telefon numarası ve e-posta bilgileriniz talep edilmektedir.
              </p>
              <p>
                Paylaştığınız kişisel verileriniz, yalnızca bilgilendirme ve iletişim süreçlerinin
                yürütülmesi amacıyla işlenecek olup, üçüncü kişilerle paylaşılmayacaktır.
              </p>
              <p>
                Kişisel verileriniz, dernek kuruluş süreci tamamlanana kadar güvenli şekilde
                saklanacak, talebiniz halinde silinecek veya anonim hale getirilecektir.
              </p>
              <p>
                Bu formu doldurarak, yukarıda belirtilen kapsamda kişisel verilerinizin işlenmesine
                açık rıza verdiğinizi beyan etmiş olursunuz.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} EFEP Derneği — Tüm hakları saklıdır.
      </footer>
    </main>
  );
}
