/**
 * Wallet.jsx
 * Polished wallet UI for /profile using shadcn-style components (Tailwind + Radix patterns)
 * - Prominent balance card with smooth count-up animation (no external deps)
 * - Scrollable transaction table with subtle fade-in on first load
 * - Badges for type (Credit/Refund vs Debit) and colored amounts
 *
 * This component expects Inertia props:
 *   props.balance: number
 *   props.transactions: Array<{ id, amount, type, description, reference_type, reference_id, created_at }>
 *   props.auth.user: { name, email, avatar }
 */

import React from "react";
import { Head, usePage, router } from "@inertiajs/react";

// shadcn/ui primitives
import { Alert } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Currency helper
import formatRupiah, { formatRupiahInput } from "@/Utils/formatRupiah";

const formatCurrency = (value) => {
  try {
    if (typeof formatRupiah === "function") return formatRupiah(value);
  } catch (_) {}
  const n = Number(value || 0);
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
};

const formatDateTime = (value) => {
  if (!value) return "-";
  try {
    const d = new Date(value);
    return new Intl.DateTimeFormat("id-ID", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return value;
  }
};

// Minimal shadcn-style Card primitives
const Card = ({ className = "", children }) => (
  <div className={`rounded-xl border bg-white shadow-sm ${className}`}>{children}</div>
);
const CardHeader = ({ className = "", children }) => (
  <div className={`px-6 py-4 border-b ${className}`}>{children}</div>
);
const CardContent = ({ className = "", children }) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
);

// Minimal Badge component (credit/debit variants)
const Badge = ({ variant = "default", children }) => {
  const base = "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium";
  const palette =
    variant === "success"
      ? "bg-emerald-100 text-emerald-700"
      : variant === "destructive"
      ? "bg-rose-100 text-rose-700"
      : "bg-gray-100 text-gray-700";
  return <span className={`${base} ${palette}`}>{children}</span>;
};

// Count-up hook for smooth balance animation
const useCountUp = (target = 0, durationMs = 900, deps = []) => {
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    let rafId;
    const start = performance.now();
    const startVal = 0;
    const endVal = Number(target) || 0;

    const tick = (now) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      // EaseOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round((startVal + (endVal - startVal) * eased) * 100) / 100;
      setDisplay(val);
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

   rafId = requestAnimationFrame(tick);
   return () => cancelAnimationFrame(rafId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps.concat([target, durationMs]));

  return display;
};

const Amount = ({ amount, type }) => {
  const isCredit = String(type).toUpperCase() === "CREDIT";
  const color = isCredit ? "text-emerald-600" : "text-rose-600";
  return <span className={`font-medium ${color}`}>{formatCurrency(amount)}</span>;
};

const TypePill = ({ type, referenceType }) => {
  const upper = String(type).toUpperCase();
  if (upper === "CREDIT") {
    const isRefund = String(referenceType).toLowerCase() === "transaction_item";
    return <Badge variant="success">{isRefund ? "Refund" : "Credit"}</Badge>;
  }
  if (upper === "DEBIT") return <Badge variant="destructive">Debit</Badge>;
  return <Badge>{type}</Badge>;
};

const withdrawalMethods = [
  {
    group: "E-Wallet",
    options: [
      { value: "dana", label: "Dana" },
      { value: "gopay", label: "Gopay" },
      { value: "ovo", label: "OVO" },
      { value: "shopeepay", label: "ShopeePay" },
    ],
  },
  {
    group: "Bank",
    options: [
      { value: "bca", label: "Bank Central Asia (BCA)" },
      { value: "bri", label: "Bank Rakyat Indonesia (BRI)" },
      { value: "mandiri", label: "Bank Mandiri" },
      { value: "bni", label: "Bank Negara Indonesia (BNI)" },
      { value: "btn", label: "Bank Tabungan Negara (BTN)" },
      { value: "cimb", label: "CIMB Niaga" },
      { value: "danamon", label: "Bank Danamon" },
      { value: "permata", label: "Bank Permata" },
      { value: "bii", label: "Bank Maybank Indonesia" },
      { value: "mega", label: "Bank Mega" },
      { value: "sinarmas", label: "Bank Sinarmas" },
      { value: "muamalat", label: "Bank Muamalat" },
      { value: "dki", label: "Bank DKI" },
      { value: "jatim", label: "Bank Jatim" },
      { value: "jabar", label: "Bank BJB" },
      { value: "sumut", label: "Bank Sumut" },
      { value: "jateng", label: "Bank Jateng" },
      { value: "bpdbali", label: "Bank BPD Bali" },
    ],
  },
  {
    group: "Lainnya",
    options: [{ value: "lainnya", label: "Lainnya (Misal: Western Union, dll.)" }],
  },
];

export default function Wallet() {
  const { props } = usePage();
  const user = props?.auth?.user;
  const balance = Number(props?.balance ?? 0);
  const transactions = Array.isArray(props?.transactions) ? props.transactions : [];

  const initials = React.useMemo(() => {
    const name = String(user?.name || "").trim();
    if (!name) return "U";
    const parts = name.split(/\s+/).filter(Boolean);
    return (parts[0]?.[0] || "U").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
  }, [user?.name]);

  // Fade-in on first load
  const [loaded, setLoaded] = React.useState(false);
  React.useEffect(() => {
    const id = setTimeout(() => setLoaded(true), 30);
    return () => clearTimeout(id);
  }, []);

  // Animate balance
  const animatedBalance = useCountUp(balance, 900, [balance]);

  // Withdraw dialog state
  const [openDialog, setOpenDialog] = React.useState(false);
  const [showOtherMethodInput, setShowOtherMethodInput] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    amount: "",
   method: "",
   account_holder_name: "",
   account_number: "",
   other_method: "",
  });
  const [formErrors, setFormErrors] = React.useState({});

  const handleAmountChange = (e) => {
    const raw = e.target.value || "";
    const numeric = raw.replace(/\./g, "");
    if (!isNaN(numeric) && numeric !== "") {
      setForm((f) => ({ ...f, amount: numeric }));
    } else {
      setForm((f) => ({ ...f, amount: "" }));
    }
  };

  const handleMethodChange = (value) => {
    setForm((f) => ({ ...f, method: value }));
    setShowOtherMethodInput(value === "lainnya");
  };

  const validate = () => {
    const errs = {};
    const amt = Number(form.amount || 0);
    if (!amt || isNaN(amt)) errs.amount = "Jumlah tidak valid.";
    else if (amt < 10000) errs.amount = "Jumlah harus lebih dari Rp 10.000.";
    else if (amt > balance) errs.amount = "Jumlah penarikan melebihi saldo.";
    if (!form.method) errs.method = "Metode wajib diisi.";
    if (showOtherMethodInput && !form.other_method) errs.other_method = "Nama metode lain-lain wajib diisi.";
    if (!form.account_holder_name) errs.account_holder_name = "Nama pemilik wajib diisi.";
    if (!form.account_number) errs.account_number = "Nomor rekening / e-wallet wajib diisi.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const payload = {
      ...form,
      method: form.method === "lainnya" ? form.other_method : form.method,
    };
    const url = typeof route === "function" ? route("profile.withdraw") : "/profile/withdraw";
    router.post(url, payload, {
      preserveScroll: true,
      onSuccess: () => {
        setSubmitting(false);
        setOpenDialog(false);
        setForm({ amount: "", method: "", account_holder_name: "", account_number: "", other_method: "" });
        setShowOtherMethodInput(false);
        setFormErrors({});
      },
      onError: (errs) => {
        setSubmitting(false);
        // Inertia validation errors mapping
        setFormErrors((prev) => ({ ...prev, ...errs }));
      },
    });
  };

  return (
    <>
      <Head title="Wallet" />

      <div className="container mx-auto max-w-5xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Avatar className="h-10 w-10 rounded-lg grayscale">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold">My Wallet</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {/* Balance + Withdraw */}
        <Card className="mb-6 transition-all duration-300 hover:shadow-md">
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Wallet Balance</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">{formatCurrency(animatedBalance)}</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground hidden sm:block">Updated recently</p>

              <AlertDialog open={openDialog} onOpenChange={setOpenDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="whitespace-nowrap">
                    Ajukan Penarikan Dana
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Ajukan Penarikan Dana</AlertDialogTitle>
                    <AlertDialogDescription>
                      Masukkan jumlah dana dan pilih metode penarikan. Proses penarikan akan diverifikasi oleh admin.
                      <p className="mt-2 font-bold text-red-500">
                        Saldo anda {formatCurrency(balance)}
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Jumlah Penarikan</Label>
                        <Input
                          id="amount"
                          type="text"
                          placeholder="Contoh: 50.000"
                          value={formatRupiahInput(form.amount)}
                          onChange={handleAmountChange}
                        />
                        {formErrors.amount && <p className="text-sm text-rose-600">{formErrors.amount}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="method">Metode Penarikan</Label>
                        <Select onValueChange={handleMethodChange}>
                          <SelectTrigger id="method">
                            <SelectValue placeholder="Pilih metode penarikan" />
                          </SelectTrigger>
                          <SelectContent>
                            {withdrawalMethods.map((group) => (
                              <SelectGroup key={group.group}>
                                <SelectLabel>{group.group}</SelectLabel>
                                {group.options.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            ))}
                          </SelectContent>
                        </Select>
                        {formErrors.method && <p className="text-sm text-rose-600">{formErrors.method}</p>}
                      </div>

                      {showOtherMethodInput && (
                        <div className="space-y-2">
                          <Label htmlFor="other_method">Nama Metode Lainnya</Label>
                          <Input
                            id="other_method"
                            type="text"
                            placeholder="Contoh: Western Union"
                            value={form.other_method}
                            onChange={(e) => setForm((f) => ({ ...f, other_method: e.target.value }))}
                          />
                          {formErrors.other_method && <p className="text-sm text-rose-600">{formErrors.other_method}</p>}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="account_holder_name">Nama Pemilik Rekening / E-Wallet</Label>
                        <Input
                          id="account_holder_name"
                          type="text"
                          placeholder="Masukkan nama pemilik"
                          value={form.account_holder_name}
                          onChange={(e) => setForm((f) => ({ ...f, account_holder_name: e.target.value }))}
                        />
                        {formErrors.account_holder_name && <p className="text-sm text-rose-600">{formErrors.account_holder_name}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="account_number">Nomor Rekening / E-Wallet</Label>
                        <Input
                          id="account_number"
                          type="text"
                          placeholder="Masukkan nomor rekening atau nomor telepon"
                          value={form.account_number}
                          onChange={(e) => setForm((f) => ({ ...f, account_number: e.target.value }))}
                        />
                        {formErrors.account_number && <p className="text-sm text-rose-600">{formErrors.account_number}</p>}
                      </div>
                    </div>

                    <AlertDialogFooter>
                      <AlertDialogCancel asChild>
                        <Button type="button" variant="ghost">
                          Batal
                        </Button>
                      </AlertDialogCancel>
                      <Button
                        type="submit"
                        disabled={
                          submitting ||
                          !form.amount ||
                          !form.method ||
                          !form.account_number ||
                          !form.account_holder_name ||
                          (showOtherMethodInput && !form.other_method)
                        }
                      >
                        {submitting ? "Memproses..." : "Ajukan"}
                      </Button>
                    </AlertDialogFooter>
                  </form>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Alert className="mb-4">
          Refunds caused by partner cancellations are immediately credited to your in-app wallet and logged in the history below.
        </Alert>

        {/* History Table */}
        <Card className={`overflow-hidden ${loaded ? "opacity-100" : "opacity-0"} transition-opacity duration-500`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Wallet History</h2>
                <p className="text-xs text-muted-foreground">Last 100 entries</p>
              </div>
            </div>
          </CardHeader>

          {transactions.length === 0 ? (
            <CardContent>
              <div className="py-8 text-center text-muted-foreground">No transactions yet. Your refunds and top-ups will appear here.</div>
            </CardContent>
          ) : (
            <div className="max-h-[520px] overflow-auto">
              <table className="min-w-full table-fixed">
                <thead className="sticky top-0 z-10 bg-gray-50/95 text-xs uppercase tracking-wide text-gray-600 backdrop-blur supports-[backdrop-filter]:bg-gray-50/75">
                  <tr>
                    <th className="w-24 px-6 py-3 text-left font-medium">Type</th>
                    <th className="w-40 px-6 py-3 text-left font-medium">Amount</th>
                    <th className="w-56 px-6 py-3 text-left font-medium">Reference</th>
                    <th className="px-6 py-3 text-left font-medium">Description</th>
                    <th className="w-48 px-6 py-3 text-left font-medium">Date / Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y bg-white">
                  {transactions.map((tx) => {
                    const referenceText = tx?.reference_type
                      ? `${String(tx.reference_type)}${tx.reference_id ? ` #${tx.reference_id}` : ""}`
                      : "-";

                    const description =
                      tx?.description ||
                      (tx?.reference_type === "transaction_item"
                        ? `Refund from Transaction Item #${tx?.reference_id}`
                        : tx?.reference_type === "withdraw"
                        ? `Withdrawal #${tx?.reference_id}`
                        : "-");

                    return (
                      <tr key={tx.id} className="hover:bg-gray-50/60">
                        <td className="px-6 py-3 align-top">
                          <TypePill type={tx.type} referenceType={tx.reference_type} />
                        </td>
                        <td className="px-6 py-3 align-top">
                          <Amount amount={tx.amount} type={tx.type} />
                        </td>
                        <td className="px-6 py-3 align-top text-sm text-gray-700">{referenceText}</td>
                        <td className="px-6 py-3 align-top text-sm text-gray-700">{description}</td>
                        <td className="px-6 py-3 align-top text-sm text-muted-foreground">{formatDateTime(tx.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}