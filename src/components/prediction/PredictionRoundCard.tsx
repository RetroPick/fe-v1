import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Clock3, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PredictionRound } from "@/types/prediction";

interface PredictionRoundCardProps {
  round: PredictionRound;
  onRequestLogin?: () => void;
}

/** Compact tile for carousel (Polymarket-ish proportions, not oversized square). */
const ROUND_CARD_SQUARE =
  "aspect-[4/5] w-[min(100%,260px)] min-w-[220px] max-w-[260px] shrink-0 sm:aspect-[3/4] sm:max-w-[280px]";

const statusStyles: Record<string, {
  badge: string;
  frame: string;
  glow: string;
  accent: string;
}> = {
  live: {
    badge: "border-primary/30 bg-primary/10 text-primary",
    frame: "border-blue-200/70 bg-[linear-gradient(180deg,rgba(244,249,255,0.98),rgba(227,239,255,0.96))] dark:border-border/80 dark:bg-card dark:bg-none",
    glow: "shadow-sm dark:shadow-none",
    accent: "before:bg-primary",
  },
  next: {
    badge: "border-primary/25 bg-primary/10 text-primary",
    frame: "border-sky-200/70 bg-[linear-gradient(180deg,rgba(247,251,255,0.98),rgba(232,244,255,0.96))] dark:border-border/80 dark:bg-card dark:bg-none",
    glow: "shadow-sm dark:shadow-none",
    accent: "before:bg-primary",
  },
  expired: {
    badge: "border-slate-300/80 bg-slate-200/70 text-slate-600 dark:border-border dark:bg-muted dark:text-muted-foreground",
    frame: "border-slate-200/90 bg-[linear-gradient(180deg,rgba(249,250,251,0.98),rgba(241,245,249,0.98))] dark:border-border/80 dark:bg-card dark:bg-none",
    glow: "shadow-sm dark:shadow-none",
    accent: "before:bg-muted-foreground",
  },
  later: {
    badge: "border-slate-300/80 bg-slate-200/70 text-slate-600 dark:border-border dark:bg-muted dark:text-muted-foreground",
    frame: "border-slate-200/90 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.98))] dark:border-border/80 dark:bg-card dark:bg-none",
    glow: "shadow-sm dark:shadow-none",
    accent: "before:bg-muted-foreground",
  },
};

function formatStatus(status: PredictionRound["status"]) {
  if (status === "expired") return "Expired";
  if (status === "live") return "Live";
  if (status === "later") return "Later";
  return "Next";
}

function formatPrice(value: number) {
  return `$${value.toFixed(2)}`;
}

function sanitizeAmountInput(value: string) {
  const normalized = value.replace(/[^0-9.]/g, "");
  const [whole = "", ...decimals] = normalized.split(".");
  const decimal = decimals.join("").slice(0, 2);
  return decimal.length > 0 ? `${whole}.${decimal}` : whole + (normalized.includes(".") ? "." : "");
}

function addAmount(currentValue: string, increment: string) {
  const current = Number.parseFloat(currentValue || "0");
  const next = Number.parseFloat(increment);

  if (!Number.isFinite(next)) return currentValue;

  const total = (Number.isFinite(current) ? current : 0) + next;
  return sanitizeAmountInput(total.toFixed(2));
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value < 100 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function getResolvedOutcome(round: PredictionRound) {
  if (round.closePrice === undefined) return null;
  if (round.closePrice > round.lockPrice) return "Up";
  if (round.closePrice < round.lockPrice) return "Down";
  return "Tie";
}

function formatLiveCountdown(targetMs: number, format: NonNullable<PredictionRound["startsInFormat"]>) {
  const totalSeconds = Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingMinutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (format === "mm:ss") {
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function PredictionRoundCard({ round, onRequestLogin }: PredictionRoundCardProps) {
  const { isConnected } = useAccount();
  const marketTag = `#${round.id}`;
  const isNext = round.status === "next";
  const isLive = round.status === "live";
  const isLater = round.status === "later";
  const isExpired = round.status === "expired";
  const statusStyle = statusStyles[round.status] || statusStyles.expired;
  const marketPrice = round.closePrice ?? round.lastPrice;
  const priceLabel = round.closePrice !== undefined ? "Closed Price" : round.lastPrice !== undefined ? "Last Price" : undefined;
  const resolvedOutcome = getResolvedOutcome(round);
  const favoredSide = round.upPercent >= round.downPercent ? "Up" : "Down";
  const favoredPercent = Math.max(round.upPercent, round.downPercent);
  const favoredPayout = favoredSide === "Up" ? round.upPayout : round.downPayout;
  const opposingPayout = favoredSide === "Up" ? round.downPayout : round.upPayout;
  const isUpFavored = favoredSide === "Up";
  const isExtremeLean = favoredPercent >= 80;
  const outcomePayout = resolvedOutcome === "Up" ? round.upPayout : resolvedOutcome === "Down" ? round.downPayout : null;
  const [entrySide, setEntrySide] = useState<"Up" | "Down" | null>(null);
  const [entryAmount, setEntryAmount] = useState("");
  const [isEntryFocused, setIsEntryFocused] = useState(false);
  const [liveStartsIn, setLiveStartsIn] = useState(() =>
    round.startsInTargetMs && round.startsInFormat
      ? formatLiveCountdown(round.startsInTargetMs, round.startsInFormat)
      : round.startsIn,
  );

  useEffect(() => {
    if (!round.startsInTargetMs || !round.startsInFormat) {
      setLiveStartsIn(round.startsIn);
      return;
    }

    const updateCountdown = () => {
      setLiveStartsIn(formatLiveCountdown(round.startsInTargetMs!, round.startsInFormat!));
    };

    updateCountdown();
    const timerId = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timerId);
  }, [round.startsIn, round.startsInFormat, round.startsInTargetMs]);

  const setQuickAmount = (value: string) => setEntryAmount((current) => addAmount(current, value));

  if (isNext) {
    const isUp = entrySide === "Up";
    const nextUpPercent = round.upPercent;
    const nextDownPercent = round.downPercent;
    const selectedPayout = isUp ? round.upPayout : round.downPayout;
    const parsedEntryAmount = Number(entryAmount);
    const potentialWin = Number.isFinite(parsedEntryAmount) && parsedEntryAmount > 0 ? parsedEntryAmount * selectedPayout : null;

    const nextFaceShell =
      "absolute inset-0 overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-sm dark:shadow-none";
    const hasCommitAmount = entryAmount.trim().length > 0;

    return (
      <div className={ROUND_CARD_SQUARE}>
        <div
          className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]"
          style={{ transform: entrySide ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          <div
            className={cn(nextFaceShell, entrySide ? "pointer-events-none" : "pointer-events-auto")}
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="relative flex h-full min-h-0 flex-col gap-3 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  {round.assetImage ? (
                    <img src={round.assetImage} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-border" />
                  ) : null}
                  <div className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-foreground">
                    <PlayCircle className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span>Next</span>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-medium tabular-nums text-muted-foreground">{marketTag}</span>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">Open bias</span>
                  <span className="font-medium text-foreground">Use current price</span>
                </div>
                <div className="flex items-center justify-between text-lg font-semibold tracking-tight tabular-nums">
                  <span className="text-up">Up {nextUpPercent}%</span>
                  <span className="text-down">Down {nextDownPercent}%</span>
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                  <div style={{ width: `${nextUpPercent}%` }} className="h-full bg-up" />
                  <div style={{ width: `${nextDownPercent}%` }} className="h-full bg-down" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Price</div>
                  <div className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                    {round.lastPrice !== undefined ? formatPrice(round.lastPrice) : "—"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-muted-foreground">Prize pool</div>
                  <div className="mt-1 text-lg font-semibold tabular-nums text-foreground">{round.prizePool}</div>
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => setEntrySide("Up")}
                  className="w-full rounded-xl bg-up py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-up/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  Enter up
                </button>
                <button
                  type="button"
                  onClick={() => setEntrySide("Down")}
                  className="w-full rounded-xl bg-down py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-down/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  Enter down
                </button>
              </div>
            </div>
          </div>

          <div
            className={cn(nextFaceShell, entrySide ? "pointer-events-auto" : "pointer-events-none")}
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="relative flex h-full min-h-0 flex-col gap-3 px-4 pb-4 pt-3 sm:gap-4 sm:pb-5 sm:pt-4">
              <div className="flex shrink-0 items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setEntrySide(null)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground transition hover:text-muted-foreground"
                >
                  <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                  Set position
                </button>
                <button
                  type="button"
                  onClick={() => setEntrySide(isUp ? "Down" : "Up")}
                  className={cn(
                    "min-h-[2rem] shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] sm:px-3.5 sm:text-xs sm:tracking-[0.16em]",
                    isUp
                      ? "border-up/40 bg-up/15 text-up focus-visible:outline-up/50"
                      : "border-down/40 bg-down/15 text-down focus-visible:outline-down/50",
                  )}
                  aria-pressed={true}
                  aria-label={isUp ? "Side: Up. Click to switch to Down." : "Side: Down. Click to switch to Up."}
                >
                  {entrySide}
                </button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col justify-start gap-3 sm:gap-3.5">
                <div className="flex flex-col gap-2">
                  <label htmlFor={`entry-amount-${round.id}`} className="sr-only">
                    Amount in USD
                  </label>
                  <div className="flex min-h-[2.5rem] items-center sm:min-h-[2.75rem]">
                    <input
                      id={`entry-amount-${round.id}`}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      spellCheck={false}
                      value={entryAmount}
                      onChange={(event) => setEntryAmount(sanitizeAmountInput(event.target.value))}
                      onFocus={() => setIsEntryFocused(true)}
                      onBlur={() => setIsEntryFocused(false)}
                      pattern="[0-9]*[.]?[0-9]{0,2}"
                      placeholder={isEntryFocused && !hasCommitAmount ? "" : "Enter amount"}
                      dir="ltr"
                      className={cn(
                        "m-0 block w-full min-w-0 appearance-none bg-transparent p-0",
                        "border-0 shadow-none outline-none ring-0 ring-offset-0",
                        "rounded-none focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0",
                        "[color-scheme:dark]",
                        "font-mono text-[1.65rem] font-semibold tabular-nums tracking-tight leading-none sm:text-[1.85rem] md:text-[2.15rem]",
                        "caret-primary",
                        hasCommitAmount
                          ? "text-foreground"
                          : "text-foreground/90 placeholder:font-sans placeholder:font-medium placeholder:text-muted-foreground",
                      )}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {["0.5", "1", "10", "100"].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setQuickAmount(value)}
                        className="min-w-[3.25rem] flex-1 rounded-lg border border-border bg-muted py-2 text-xs font-medium text-foreground transition hover:bg-muted/80"
                      >
                        +${value}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-border pt-3 sm:gap-2 sm:pt-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-muted-foreground sm:text-sm">To win</span>
                    <span className="text-lg font-semibold tabular-nums text-foreground sm:text-xl">
                      {potentialWin ? formatUsd(potentialWin) : "—"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground sm:text-sm">{selectedPayout.toFixed(2)}× payout</p>
                  <button
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => {
                      if (!isConnected) {
                        onRequestLogin?.();
                        return;
                      }
                    }}
                    className={cn(
                      "mt-1 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95 sm:py-3 sm:text-base",
                      isUp ? "bg-up" : "bg-down",
                    )}
                  >
                    {!isConnected ? "Connect wallet" : entryAmount ? `Commit $${entryAmount}` : "Commit $0"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const mutedCard = isExpired || isLater;
  const expiredOutcomeTheme = isExpired
    ? resolvedOutcome === "Up"
      ? "border-emerald-200/90 bg-[linear-gradient(180deg,rgba(249,250,251,0.98),rgba(236,253,245,0.98),rgba(16,185,129,0.18))] shadow-sm dark:border-up/30 dark:bg-card dark:bg-none dark:shadow-none"
      : resolvedOutcome === "Down"
        ? "border-rose-200/90 bg-[linear-gradient(180deg,rgba(249,250,251,0.98),rgba(255,241,242,0.98),rgba(244,63,94,0.16))] shadow-sm dark:border-down/30 dark:bg-card dark:bg-none dark:shadow-none"
        : statusStyle.frame
    : "";

  return (
    <div className={ROUND_CARD_SQUARE}>
      <div
        className={cn(
          "group relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border p-3 text-foreground transition-colors duration-200 hover:border-primary/20",
          isExpired ? expiredOutcomeTheme : statusStyle.frame,
          statusStyle.glow,
          mutedCard && "opacity-85 saturate-75 dark:opacity-100 dark:saturate-100",
        )}
      >
      <div className={cn("pointer-events-none absolute inset-y-4 left-0 w-1 rounded-r-full opacity-90", statusStyle.accent)} />
      <div className="relative flex shrink-0 items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {round.assetImage ? (
            <img src={round.assetImage} alt="" className="size-8 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/15" />
          ) : null}
          <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em]", statusStyle.badge)}>
            {isLive || isNext ? <PlayCircle className="size-3.5" /> : <Clock3 className="size-3.5" />}
            {formatStatus(round.status)}
          </div>
        </div>
        <div className="rounded-full border border-black/5 bg-black/[0.03] px-3 py-1 text-[11px] font-semibold text-muted-foreground dark:border-border dark:bg-muted/50">
          {marketTag}
        </div>
      </div>

      <div className="relative mt-2 flex min-h-0 flex-1 flex-col gap-0">
        {isExpired ? (
          <div className="grid gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className={cn(
                  "text-[11px] font-bold uppercase tracking-[0.22em]",
                  resolvedOutcome === "Up" ? "text-up" : "text-down",
                )}>
                  Outcome
                </div>
                <div className={cn(
                  "mt-1.5 text-[1.6rem] font-black tracking-tight",
                  resolvedOutcome === "Up" ? "text-up" : "text-down",
                )}>
                  {resolvedOutcome}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  {outcomePayout?.toFixed(2)}x
                </div>
                <div className="mt-1.5 text-base font-semibold text-foreground">Payout</div>
              </div>
            </div>
          </div>
        ) : !isLater && (
          <div className="grid grid-cols-[1fr_auto] items-end gap-4">
            <div>
              <div className="mt-1.5 flex items-center gap-2">
                {favoredSide === "Up" ? (
                  <ArrowUpRight className="size-5 text-sky-600 dark:text-sky-300" />
                ) : (
                  <ArrowDownRight className="size-5 text-blue-700 dark:text-blue-300" />
                )}
                <span className="text-[1.45rem] font-semibold tracking-tight text-foreground">
                  {favoredSide} {favoredPercent}%
                </span>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {isLive ? "Calculating resolution" : `${favoredPayout}x payout`}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Other</div>
              <div className="mt-1.5 text-xl font-semibold tracking-tight text-foreground">{opposingPayout}x</div>
            </div>
          </div>
        )}

        {!isLater && (
        <div className={cn("mt-3 pt-3", !isNext && "border-t border-slate-200/80 dark:border-white/10")}>
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em]">
            <span
              className={cn(
                isExtremeLean ? (isUpFavored ? "text-up" : "text-down/80") : "text-up",
              )}
            >
              Up {round.upPercent}%
            </span>
            <span className={cn(
              isExtremeLean
                ? !isUpFavored
                  ? "text-down"
                  : "text-up/80"
                : "text-down",
            )}>
              Down {round.downPercent}%
            </span>
          </div>
          <div
            className={cn(
              "flex h-2.5 overflow-hidden rounded-full bg-muted",
              !isExtremeLean && "bg-slate-200/80 dark:bg-muted",
            )}
          >
            <div style={{ width: `${round.upPercent}%` }} className="h-full rounded-full bg-up" />
            <div style={{ width: `${round.downPercent}%` }} className="h-full rounded-full bg-down" />
          </div>
        </div>
        )}

        <div
          className={cn(
            "grid gap-2.5 border-t border-slate-200/80 dark:border-white/10",
            isExpired ? "mt-2 pt-2" : "mt-3 pt-3",
            (isExpired || isLive) && !isLater && "grid-cols-2 items-start",
            isLive && !isLater && "grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-3",
          )}
        >
          {!isLater && priceLabel && marketPrice !== undefined ? (
            <div className={cn("grid min-w-0 content-start gap-1", isLive && "text-sm")}>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{isLive ? "Last Price" : "Close"}</div>
              <div className={cn(
                "font-semibold text-foreground tabular-nums",
                isLive ? "min-h-[1.75rem] whitespace-nowrap text-base leading-7 sm:text-lg" : "text-[1.45rem] tracking-tight",
              )}>
                {formatPrice(marketPrice)}
              </div>
            </div>
          ) : null}

          {isExpired && (
            <div className="text-right text-sm">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Prize Pool</div>
              <div className="mt-1 font-semibold text-foreground">{round.prizePool}</div>
            </div>
          )}

          {isLive && (
            <div className="grid min-w-0 content-start gap-1 text-sm">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Locked Price</div>
              <div className="min-h-[1.75rem] whitespace-nowrap text-base font-semibold leading-7 text-foreground tabular-nums sm:text-lg">{formatPrice(round.lockPrice)}</div>
            </div>
          )}

          {isLive && (
            <div className="col-span-2 flex items-end justify-between gap-3 text-sm">
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Prize Pool</div>
                <div className="mt-1 font-semibold text-foreground">{round.prizePool}</div>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-2xl border border-blue-200/70 bg-white/55 px-4 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-blue-900 transition-colors hover:bg-blue-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-blue-100 dark:hover:bg-white/[0.06]"
              >
                Details
              </button>
            </div>
          )}

          {isLater && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Time Left</div>
              <div className="mt-1.5 text-[1.55rem] font-black tracking-tight text-foreground">
                {liveStartsIn ?? "--"}
              </div>
            </div>
          )}
        </div>

        {mutedCard ? (
          <div className="mt-auto border-t border-slate-200/80 pt-3 dark:border-white/10">
            <div className="ml-auto flex items-center justify-between gap-3">
              <button
                type="button"
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-xs font-black uppercase tracking-[0.18em] transition-colors",
                  "border border-slate-300/80 bg-slate-200/70 text-slate-600 dark:border-border dark:bg-muted/60 dark:text-muted-foreground",
                )}
                disabled
              >
                {isLater ? "Waiting" : "Settled"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
      </div>
    </div>
  );
}
