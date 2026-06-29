import type { LucideIcon } from "lucide-react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Home,
  Landmark,
  MoreHorizontal,
  Plus,
  Route,
  Search,
  Settings,
  WalletCards,
} from "lucide-react";

import { cn } from "@/lib/utils";

type SidebarItemProps = {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  badge?: string;
  nested?: boolean;
};

type PillButtonProps = {
  children: React.ReactNode;
  primary?: boolean;
};

type TransactionRowProps = {
  date: string;
  description: string;
  amount: string;
  status: "Pending" | "Completed";
};

const accounts = [
  ["Credit", "$98,125.50"],
  ["Treasury", "$6,750,200.00"],
  ["Operations", "$1,592,864.82"],
];

const transactions: TransactionRowProps[] = [
  {
    date: "Mar 19",
    description: "AWS",
    amount: "-$5,200",
    status: "Pending",
  },
  {
    date: "Mar 18",
    description: "Client Payment",
    amount: "+$125,000",
    status: "Completed",
  },
  {
    date: "Mar 17",
    description: "Payroll",
    amount: "-$85,450",
    status: "Completed",
  },
  {
    date: "Mar 16",
    description: "Office Supplies",
    amount: "-$1,200",
    status: "Completed",
  },
];

function SidebarItem({
  icon: Icon,
  label,
  active,
  badge,
  nested,
}: SidebarItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5",
        active
          ? "bg-white text-foreground shadow-[0_1px_0_rgb(0_0_0_/_0.04)]"
          : "text-muted-foreground",
      )}
    >
      <Icon className="size-3" />
      <span className="flex-1 truncate text-[11px]">{label}</span>
      {badge ? (
        <span className="rounded bg-foreground/10 px-1.5 text-[9px] text-foreground/70">
          {badge}
        </span>
      ) : null}
      {nested ? <ChevronRight className="size-2.5" /> : null}
    </div>
  );
}

function PillButton({ children, primary }: PillButtonProps) {
  return (
    <button
      className={cn(
        "rounded-full border px-2.5 py-1 text-[10px] font-medium",
        primary
          ? "border-indigo-500 bg-indigo-500 text-white"
          : "border-border bg-white text-foreground",
      )}
      type="button"
    >
      {children}
    </button>
  );
}

function BalanceChart() {
  const path =
    "M0,58 C30,52 50,64 80,55 C110,46 130,30 165,28 C195,26 215,40 245,30 C270,22 285,14 300,10";

  return (
    <svg
      aria-label="Nexora balance trend"
      className="h-20 w-full"
      preserveAspectRatio="none"
      role="img"
      viewBox="0 0 300 80"
    >
      <defs>
        <linearGradient id="nexora-area-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L300,80 L0,80 Z`} fill="url(#nexora-area-fill)" />
      <path
        d={path}
        fill="none"
        stroke="#6366f1"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function TransactionRow({
  date,
  description,
  amount,
  status,
}: TransactionRowProps) {
  const positive = amount.startsWith("+");

  return (
    <tr className="border-t border-border/70">
      <td className="whitespace-nowrap py-2 pl-3 pr-2 text-muted-foreground">
        {date}
      </td>
      <td className="px-2 py-2 text-foreground">{description}</td>
      <td
        className={cn(
          "px-2 py-2 text-right tabular-nums",
          positive ? "text-emerald-700" : "text-foreground",
        )}
      >
        {amount}
      </td>
      <td className="py-2 pl-2 pr-3 text-right">
        <span
          className={cn(
            "inline-block rounded-full border px-2 py-px text-[9px]",
            status === "Completed"
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-amber-100 bg-amber-50 text-amber-600",
          )}
        >
          {status}
        </span>
      </td>
    </tr>
  );
}

export default function NexoraDashboardPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/45 p-2 shadow-[0_25px_80px_-12px_rgb(0_0_0_/_0.12),0_0_0_1px_rgb(0_0_0_/_0.04)] backdrop-blur-md sm:p-3 md:p-4">
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background text-[11px]">
        <div className="flex items-center gap-3 border-b border-border/70 bg-white px-3 py-2">
          <div className="flex items-center gap-1.5">
            <div className="grid size-5 place-items-center rounded-md bg-foreground text-[10px] font-semibold text-background">
              N
            </div>
            <span className="font-medium text-foreground">Nexora</span>
            <ChevronDown className="size-2.5 text-muted-foreground" />
          </div>

          <div className="hidden flex-1 items-center justify-center sm:flex">
            <div className="flex w-[55%] max-w-sm items-center gap-2 rounded-md border border-border/60 bg-secondary px-2 py-1 text-muted-foreground">
              <Search className="size-3" />
              <span className="flex-1 text-[10px]">Search</span>
              <span className="rounded border border-border/60 bg-white px-1 text-[9px]">
                Cmd K
              </span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              className="hidden rounded-md bg-foreground px-2 py-1 text-[10px] font-medium text-background sm:block"
              type="button"
            >
              Move Money
            </button>
            <Bell className="size-3 text-muted-foreground" />
            <div className="grid size-5 place-items-center rounded-full bg-indigo-500 text-[9px] font-semibold text-white">
              JB
            </div>
          </div>
        </div>

        <div className="flex">
          <aside className="hidden w-40 shrink-0 space-y-0.5 border-r border-border/60 bg-secondary/60 p-2 md:block">
            <SidebarItem active icon={Home} label="Home" />
            <SidebarItem badge="10" icon={Building2} label="Tasks" />
            <SidebarItem icon={CircleDollarSign} label="Transactions" />
            <SidebarItem icon={Landmark} label="Payments" nested />
            <SidebarItem icon={CreditCard} label="Cards" />
            <SidebarItem icon={WalletCards} label="Capital" />
            <SidebarItem icon={Landmark} label="Accounts" nested />

            <div className="px-2 pb-1 pt-3 text-[9px] uppercase tracking-wider text-muted-foreground/70">
              Workflows
            </div>
            <SidebarItem icon={Route} label="Track routes" />
            <SidebarItem icon={Landmark} label="Payments" />
            <SidebarItem icon={Bell} label="Notifications" />
            <SidebarItem icon={Settings} label="Settings" />
          </aside>

          <main className="min-w-0 flex-1 space-y-3 bg-secondary/30 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-foreground">
                Welcome, Jane
              </div>
              <div className="text-[10px] text-muted-foreground">
                Tue, Mar 19
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <PillButton primary>Send</PillButton>
              <PillButton>Request</PillButton>
              <PillButton>Transfer</PillButton>
              <PillButton>Deposit</PillButton>
              <PillButton>Pay Bill</PillButton>
              <PillButton>Create Invoice</PillButton>
              <span className="ml-1 text-[10px] text-muted-foreground">
                Customize
              </span>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <section className="min-w-0 rounded-lg border border-border/70 bg-white p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-foreground">
                    <span className="font-medium">Nexora Balance</span>
                    <span className="grid size-3.5 place-items-center rounded-full bg-emerald-500 text-white">
                      <Check className="size-2" strokeWidth={3} />
                    </span>
                  </div>
                  <MoreHorizontal className="size-3 text-muted-foreground" />
                </div>
                <div className="mt-2 flex items-baseline gap-0.5">
                  <span className="text-[22px] font-semibold tracking-tight text-foreground tabular-nums">
                    $8,450,190
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    .32
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-[10px]">
                  <span className="text-muted-foreground">Last 30 Days</span>
                  <span className="inline-flex items-center gap-0.5 text-emerald-600">
                    <ArrowUpRight className="size-2.5" /> +$1.8M
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-rose-600">
                    <ArrowDownLeft className="size-2.5" /> -$900K
                  </span>
                </div>
                <div className="-mx-1 mt-1">
                  <BalanceChart />
                </div>
              </section>

              <section className="min-w-0 rounded-lg border border-border/70 bg-white p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-foreground">Accounts</div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Plus className="size-3" />
                    <MoreHorizontal className="size-3" />
                  </div>
                </div>
                <div className="mt-1">
                  {accounts.map(([name, value]) => (
                    <div
                      className="flex items-center justify-between gap-3 py-3 text-xs"
                      key={name}
                    >
                      <span className="text-muted-foreground">{name}</span>
                      <span className="text-foreground tabular-nums">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="overflow-hidden rounded-lg border border-border/70 bg-white">
              <div className="border-b border-border/70 px-3 py-2 text-[11px] font-medium text-foreground">
                Recent Transactions
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-96 text-[10px]">
                  <thead className="text-muted-foreground">
                    <tr className="text-left">
                      <th className="py-1.5 pl-3 pr-2 font-normal">Date</th>
                      <th className="px-2 py-1.5 font-normal">Description</th>
                      <th className="px-2 py-1.5 text-right font-normal">
                        Amount
                      </th>
                      <th className="py-1.5 pl-2 pr-3 text-right font-normal">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <TransactionRow
                        {...transaction}
                        key={`${transaction.date}-${transaction.description}`}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
