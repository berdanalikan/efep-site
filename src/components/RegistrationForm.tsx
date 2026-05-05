import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** National mobile: 10 digits (5XXXXXXXXX) → form state `+905XXXXXXXXX` */
const TR_E164_REGEX = /^\+905\d{9}$/;

function extractNationalMobileDigits(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.startsWith("90")) digits = digits.slice(2);
  return digits.slice(0, 10);
}

function nationalDigitsToE164(national: string): string {
  return national.length === 0 ? "" : `+90${national}`;
}

/** Example: `5321234567` → `(532) 123 45 67` */
function formatTrNationalMask(d: string): string {
  const clean = d.slice(0, 10);
  if (!clean) return "";
  if (clean.length <= 3) {
    return clean.length < 3 ? `(${clean}` : `(${clean})`;
  }
  const p1 = clean.slice(0, 3);
  const rest = clean.slice(3);
  const p2 = rest.slice(0, 3);
  const p3 = rest.slice(3, 5);
  const p4 = rest.slice(5, 7);
  let s = `(${p1})`;
  if (p2) s += ` ${p2}`;
  if (p3) s += ` ${p3}`;
  if (p4) s += ` ${p4}`;
  return s;
}

const schema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Ad-soyad en az 2 karakter olmalı")
    .max(100, "Ad-soyad çok uzun"),
  phone: z
    .string()
    .trim()
    .regex(TR_E164_REGEX, "Geçerli bir Türkiye cep telefonu girin: +90 (5XX) XXX XX XX"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Geçerli bir e-posta girin")
    .max(255, "E-posta çok uzun"),
  kvkk_consent: z
    .boolean()
    .refine((value) => value === true, "KVKK metnini onaylayın"),
});

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  full_name: "",
  phone: "",
  email: "",
  kvkk_consent: false,
};

type SubmitResult =
  | { status: "success" }
  | { status: "error"; title: string; message: string };

type RegistrationFormProps = {
  accentClass?: string;
};

export function RegistrationForm({
  accentClass = "bg-primary hover:bg-primary/90 text-primary-foreground",
}: RegistrationFormProps = {}) {
  const [result, setResult] = useState<SubmitResult | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(
    async (values) => {
      try {
        const { error } = await supabase.from("efep_registrations").insert({
          full_name: values.full_name,
          phone: values.phone,
          email: values.email,
          kvkk_consent: true,
        });

        // Treat duplicate email (23505) as success to prevent email enumeration.
        if (error && error.code !== "23505") {
          setResult({
            status: "error",
            title: "Kaydınız başarısız",
            message: "Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.",
          });
          return;
        }

        reset(defaultValues);
        setResult({ status: "success" });
      } catch (err) {
        console.error("[RegistrationForm] submit failed", err);
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("Missing Supabase environment variable")) {
          setResult({
            status: "error",
            title: "Kayıt alınamıyor",
            message: "Şu an ön kayıt alınamıyor. Lütfen daha sonra tekrar deneyin.",
          });
          return;
        }
        if (
          msg.includes("Failed to fetch") ||
          msg.includes("NetworkError") ||
          msg.includes("Load failed")
        ) {
          setResult({
            status: "error",
            title: "Bağlantı hatası",
            message:
              "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip bir süre sonra tekrar deneyin.",
          });
          return;
        }
        setResult({
          status: "error",
          title: "Kaydınız başarısız",
          message: "Beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyip tekrar deneyin.",
        });
      }
    },
    () => {
      toast.error("Lütfen formu kontrol edin: zorunlu alanlar ve KVKK onayı eksik veya hatalı.");
    },
  );

  const isSuccess = result?.status === "success";

  return (
    <>
      <form
        onSubmit={onSubmit}
        noValidate
        className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm sm:p-8"
      >
        <Field
          id="full_name"
          label="Ad Soyad"
          error={errors.full_name?.message}
          inputProps={{
            ...register("full_name"),
            maxLength: 100,
            autoComplete: "name",
          }}
        />

        <div>
          <Label htmlFor="phone">Telefon</Label>
          <Controller
            control={control}
            name="phone"
            render={({ field }) => {
              const v = field.value ?? "";
              const national = v.startsWith("+90")
                ? v.slice(3).replace(/\D/g, "").slice(0, 10)
                : extractNationalMobileDigits(v);
              const display = formatTrNationalMask(national);
              return (
                <div
                  className={cn(
                    "mt-1.5 flex rounded-md border border-input bg-transparent shadow-sm focus-within:ring-1 focus-within:ring-ring",
                    errors.phone && "border-destructive focus-within:ring-destructive",
                  )}
                >
                  <span
                    className="flex shrink-0 items-center border-r border-input bg-muted/40 px-3 text-sm tabular-nums text-muted-foreground select-none"
                    aria-hidden
                  >
                    +90
                  </span>
                  <Input
                    id="phone"
                    type="text"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="(5XX) XXX XX XX"
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? "phone-error" : undefined}
                    className="border-0 shadow-none focus-visible:ring-0 md:text-sm"
                    value={display}
                    onChange={(e) => {
                      const nextNational = extractNationalMobileDigits(e.target.value);
                      field.onChange(nationalDigitsToE164(nextNational));
                    }}
                    onBlur={field.onBlur}
                  />
                </div>
              );
            }}
          />
          {errors.phone && (
            <p id="phone-error" className="mt-1 text-sm text-destructive">
              {errors.phone.message}
            </p>
          )}
        </div>

        <Field
          id="email"
          label="E-posta"
          error={errors.email?.message}
          inputProps={{
            ...register("email"),
            type: "email",
            maxLength: 255,
            autoComplete: "email",
          }}
        />

        <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
          <Controller
            control={control}
            name="kvkk_consent"
            render={({ field }) => (
              <Checkbox
                id="kvkk"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                onBlur={field.onBlur}
                aria-invalid={!!errors.kvkk_consent}
                aria-describedby={errors.kvkk_consent ? "kvkk-error" : undefined}
                className="mt-0.5"
              />
            )}
          />
          <Label htmlFor="kvkk" className="text-sm font-normal leading-relaxed">
            KVKK Aydınlatma ve Açık Rıza Metni'ni okudum, kişisel verilerimin belirtilen
            kapsamda işlenmesine açık rıza veriyorum.
          </Label>
        </div>
        {errors.kvkk_consent && (
          <p id="kvkk-error" className="text-sm text-destructive">
            {errors.kvkk_consent.message}
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className={`w-full ${accentClass}`}
          size="lg"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Ön Kayıt Oluştur
        </Button>
      </form>

      <Dialog open={!!result} onOpenChange={(open) => !open && setResult(null)}>
        <DialogContent>
          <DialogHeader>
            <div
              className={`mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full ${
                isSuccess ? "bg-emerald-100 text-emerald-600" : "bg-destructive/10 text-destructive"
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="h-8 w-8" />
              ) : (
                <AlertCircle className="h-8 w-8" />
              )}
            </div>
            <DialogTitle className="text-center">
              {isSuccess
                ? "Kaydınız başarılı"
                : result?.status === "error"
                  ? result.title
                  : ""}
            </DialogTitle>
            <DialogDescription className="text-center">
              {isSuccess
                ? "Ön kaydınız alındı. Süreçle ilgili gelişmelerde sizinle iletişime geçeceğiz."
                : result?.status === "error"
                  ? result.message
                  : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              onClick={() => setResult(null)}
              className={isSuccess ? accentClass : undefined}
              variant={isSuccess ? "default" : "secondary"}
            >
              {isSuccess ? "Tamam" : "Tekrar dene"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  inputProps: React.ComponentProps<typeof Input>;
};

function Field({ id, label, error, inputProps }: FieldProps) {
  const errorId = `${id}-error`;
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className="mt-1.5"
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
