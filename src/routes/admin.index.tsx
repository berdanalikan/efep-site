import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Loader2, LogOut, ShieldOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "EFEP — Yönetici" }] }),
  component: AdminRoute,
});

type Reg = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  kvkk_consent_at: string | null;
  created_at: string;
};

type Phase = "loading" | "login" | "forbidden" | "panel";

function AdminRoute() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [rows, setRows] = useState<Reg[]>([]);
  const [search, setSearch] = useState("");
  const [tableError, setTableError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const runAdminGate = useCallback(async () => {
    setTableError(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setRows([]);
      setPhase("login");
      return;
    }

    const { data: isAdmin, error: rpcError } = await supabase.rpc("current_user_is_admin");

    if (rpcError) {
      console.error("[Admin] current_user_is_admin", rpcError);
      setTableError("İşlem şu an tamamlanamadı. Lütfen bir süre sonra yeniden deneyin.");
      setRows([]);
      setPhase("panel");
      return;
    }

    if (!isAdmin) {
      setRows([]);
      setPhase("forbidden");
      return;
    }

    // Oturum JWT’sinin istekle birlikte gittiğinden emin ol (özellikle girişten hemen sonra).
    await supabase.auth.getSession();

    const { data, error } = await supabase
      .from("efep_registrations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Admin] efep_registrations", error.message, error.code, error.details, error.hint);
      setTableError("Kayıtlar şu an yüklenemiyor. Bir süre sonra «Yeniden dene» ile tekrar deneyin.");
      setRows([]);
    } else {
      setRows((data as Reg[]) ?? []);
    }

    setPhase("panel");
  }, []);

  useEffect(() => {
    runAdminGate();
  }, [runAdminGate]);

  const logout = async () => {
    await supabase.auth.signOut();
    setEmail("");
    setPassword("");
    setSearch("");
    setRows([]);
    setTableError(null);
    setPhase("login");
  };

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoginLoading(false);
      toast.error("Giriş başarısız: " + error.message);
      return;
    }

    const { data: isAdmin, error: rpcError } = await supabase.rpc("current_user_is_admin");

    if (rpcError) {
      console.error("[Admin] current_user_is_admin", rpcError);
      await supabase.auth.signOut();
      setLoginLoading(false);
      toast.error("Giriş doğrulanamadı. Lütfen daha sonra tekrar deneyin.");
      return;
    }

    if (!isAdmin) {
      await supabase.auth.signOut();
      setLoginLoading(false);
      toast.error("Bu hesapla bu alana giriş yetkiniz bulunmuyor.");
      return;
    }

    setLoginLoading(false);
    await runAdminGate();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const downloadCSV = () => {
    if (filtered.length === 0) {
      toast.info("İndirilecek kayıt yok.");
      return;
    }
    const headers = ["Tarih", "Ad Soyad", "Telefon", "E-posta", "KVKK Onay Tarihi"];
    const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const lines = [
      headers.join(","),
      ...filtered.map((r) =>
        [
          new Date(r.created_at).toLocaleString("tr-TR"),
          r.full_name,
          r.phone,
          r.email,
          r.kvkk_consent_at ? new Date(r.kvkk_consent_at).toLocaleString("tr-TR") : "",
        ]
          .map(esc)
          .join(","),
      ),
    ];
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "efep-kayitlar.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (phase === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (phase === "login") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <form
          onSubmit={onLogin}
          className="w-full max-w-sm space-y-5 rounded-2xl border bg-card p-8 shadow-sm"
        >
          <div>
            <h1 className="text-2xl font-bold">Yönetici girişi</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kayıtları görüntülemek için size verilen hesap bilgileriyle giriş yapın.
            </p>
          </div>
          <div>
            <Label htmlFor="admin-email">E-posta</Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="admin-password">Şifre</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="mt-1.5"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loginLoading}>
            {loginLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Giriş yap
          </Button>
        </form>
      </main>
    );
  }

  if (phase === "forbidden") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldOff className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-semibold">Yönetici erişimi yok</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Bu hesapla bu panele erişim tanımlı değil. Erişim ihtiyacınız varsa dernek ile iletişime geçin.
          </p>
          <Button className="mt-6 w-full" variant="outline" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" /> Çıkış yap
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">EFEP — Yönetici paneli</h1>
            <p className="text-sm text-muted-foreground">Ön kayıt başvurularını görüntüleyin ve CSV olarak indirin.</p>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" /> Çıkış
          </Button>
        </header>

        {tableError && (
          <div className="mb-4 flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
            <p>{tableError}</p>
            <Button type="button" variant="outline" size="sm" className="shrink-0 border-destructive/40" onClick={() => runAdminGate()}>
              Yeniden dene
            </Button>
          </div>
        )}

        <div className="mb-4">
          <Input
            placeholder="Ada, e-postaya veya telefona göre ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="rounded-2xl border bg-card">
          <div className="flex items-center justify-between p-4">
            <span className="text-sm text-muted-foreground">{filtered.length} kayıt</span>
            <Button size="sm" onClick={downloadCSV} disabled={filtered.length === 0}>
              <Download className="mr-2 h-4 w-4" /> CSV İndir
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>KVKK Onayı</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      {rows.length === 0 ? "Henüz kayıt yok." : "Aramanızla eşleşen kayıt yok."}
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString("tr-TR")}
                    </TableCell>
                    <TableCell>{r.full_name}</TableCell>
                    <TableCell>{r.phone}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>
                      {r.kvkk_consent_at ? new Date(r.kvkk_consent_at).toLocaleDateString("tr-TR") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </main>
  );
}
