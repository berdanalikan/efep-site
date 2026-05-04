import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

const schema = z.object({
  full_name: z.string().trim().min(2, "Ad-soyad en az 2 karakter olmalı").max(100),
  phone: z
    .string()
    .trim()
    .min(10, "Geçerli bir telefon numarası girin")
    .max(20)
    .regex(/^[0-9+()\s-]+$/, "Telefon yalnızca rakam ve +()- içerebilir"),
  email: z.string().trim().email("Geçerli bir e-posta girin").max(255),
  kvkk_consent: z.literal(true, { errorMap: () => ({ message: "KVKK metnini onaylayın" }) }),
});

export function RegistrationForm({
  accentClass = "bg-primary hover:bg-primary/90 text-primary-foreground",
}: {
  accentClass?: string;
} = {}) {
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", kvkk_consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[i.path[0] as string] = i.message));
      setErrors(errs);
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("efep_registrations").insert({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      kvkk_consent: true,
      kvkk_consent_at: new Date().toISOString(),
    });
    setLoading(false);
    if (error) {
      if (error.code === "23505") {
        toast.error("Bu e-posta ile daha önce ön kayıt yapılmış.");
      } else {
        toast.error("Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.");
      }
      return;
    }
    setDone(true);
    toast.success("Ön kaydınız alındı. Teşekkür ederiz!");
  };

  if (done) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-emerald-500" />
        <h3 className="text-2xl font-semibold">Teşekkür ederiz!</h3>
        <p className="mt-2 text-muted-foreground">
          Ön kaydınız başarıyla alındı. Süreçle ilgili gelişmelerde sizinle iletişime geçeceğiz.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
      <div>
        <Label htmlFor="full_name">Ad Soyad</Label>
        <Input
          id="full_name"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          maxLength={100}
          className="mt-1.5"
        />
        {errors.full_name && <p className="mt-1 text-sm text-destructive">{errors.full_name}</p>}
      </div>
      <div>
        <Label htmlFor="phone">Telefon</Label>
        <Input
          id="phone"
          inputMode="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          maxLength={20}
          placeholder="0 5xx xxx xx xx"
          className="mt-1.5"
        />
        {errors.phone && <p className="mt-1 text-sm text-destructive">{errors.phone}</p>}
      </div>
      <div>
        <Label htmlFor="email">E-posta</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          maxLength={255}
          className="mt-1.5"
        />
        {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email}</p>}
      </div>
      <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
        <Checkbox
          id="kvkk"
          checked={form.kvkk_consent}
          onCheckedChange={(c) => setForm({ ...form, kvkk_consent: c === true })}
          className="mt-0.5"
        />
        <Label htmlFor="kvkk" className="text-sm font-normal leading-relaxed">
          KVKK Aydınlatma ve Açık Rıza Metni'ni okudum, kişisel verilerimin belirtilen
          kapsamda işlenmesine açık rıza veriyorum.
        </Label>
      </div>
      {errors.kvkk_consent && <p className="text-sm text-destructive">{errors.kvkk_consent}</p>}
      <Button type="submit" disabled={loading} className={`w-full ${accentClass}`} size="lg">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Ön Kayıt Oluştur
      </Button>
    </form>
  );
}
