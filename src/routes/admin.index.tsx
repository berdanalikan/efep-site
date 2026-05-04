import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "EFEP — Admin Paneli" }] }),
  component: AdminPanel,
});

type Reg = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  kvkk_consent_at: string | null;
  created_at: string;
};

function AdminPanel() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [rows, setRows] = useState<Reg[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        navigate({ to: "/admin/login" });
        return;
      }
      setAuthChecked(true);
      const { data, error: err } = await supabase
        .from("efep_registrations")
        .select("*")
        .order("created_at", { ascending: false });
      if (err) {
        setError("Yetkiniz yok ya da kayıtlar yüklenemedi. Yönetici hesabınızla giriş yaptığınızdan emin olun.");
      } else {
        setRows(data || []);
      }
      setLoading(false);
    })();
  }, [navigate]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
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

  if (!authChecked || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">EFEP — Admin Paneli</h1>
            <p className="text-sm text-muted-foreground">Ön kayıt başvurularını yönetin.</p>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" /> Çıkış
          </Button>
        </header>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
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
            <Button size="sm" onClick={downloadCSV}>
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
                      Henüz kayıt yok.
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
