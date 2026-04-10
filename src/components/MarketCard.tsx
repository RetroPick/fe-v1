import { useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark } from "lucide-react";
import { Market } from "@/types/market";
import Icon from "./Icon";
import BetModal from "./BetModal";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface MarketCardProps {
  market: Market;
  navigationState?: Record<string, unknown>;
  href?: string;
}

function pickBinaryOutcomes(market: Market) {
  const yes =
    market.outcomes.find((o) => /^(yes|up)\b/i.test(o.label.trim())) ??
    market.outcomes.find((o) => o.label.toUpperCase() === "YES") ??
    market.outcomes[0];
  const no =
    market.outcomes.find((o) => /^(no|down)\b/i.test(o.label.trim())) ??
    market.outcomes.find((o) => o.label.toUpperCase() === "NO") ??
    market.outcomes[1];
  return { yes, no };
}

function isUpDownPresentation(market: Market) {
  if (market.binaryPresentation === "updown") return true;
  const { yes, no } = pickBinaryOutcomes(market);
  if (!yes || !no) return false;
  const a = yes.label.trim().toLowerCase();
  const b = no.label.trim().toLowerCase();
  return (a === "up" && b === "down") || (a === "down" && b === "up");
}

/** Inline Up odds — same row height as icon + title (keeps grid cards uniform). */
function CompactUpPercent({ upPercent }: { upPercent: number }) {
  return (
    <div className="flex shrink-0 flex-col items-end justify-center self-start leading-none" aria-hidden>
      <span className="text-xs font-bold tabular-nums text-emerald-500 sm:text-[13px]">{Math.round(upPercent)}%</span>
      <span className="mt-0.5 text-[9px] font-medium text-muted-foreground sm:text-[10px]">Up</span>
    </div>
  );
}

/** Shared Yes/No and Up/Down CTAs: 70% opacity until hover, raised 3D edge. */
const binaryYesClass =
  "rounded-lg border border-emerald-700/95 bg-gradient-to-b from-emerald-500 to-emerald-700 px-3 py-2.5 text-center text-xs font-semibold leading-none text-white opacity-70 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_3px_0_0_rgb(6,95,70),0_4px_10px_rgba(0,0,0,0.28)] transition-[opacity,transform,filter,box-shadow] duration-200 hover:opacity-100 hover:brightness-[1.06] active:translate-y-px active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.18),0_1px_0_0_rgb(6,95,70)] focus-visible:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-card sm:py-3 sm:text-sm";

const binaryNoClass =
  "rounded-lg border border-rose-700/95 bg-gradient-to-b from-rose-500 to-rose-700 px-3 py-2.5 text-center text-xs font-semibold leading-none text-white opacity-70 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_3px_0_0_rgb(159,18,57),0_4px_10px_rgba(0,0,0,0.28)] transition-[opacity,transform,filter,box-shadow] duration-200 hover:opacity-100 hover:brightness-[1.06] active:translate-y-px active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.18),0_1px_0_0_rgb(159,18,57)] focus-visible:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-card sm:py-3 sm:text-sm";

const MarketCard = memo(({ market, navigationState, href }: MarketCardProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [betModal, setBetModal] = useState<{ open: boolean; side: "YES" | "NO"; outcome: string } | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  const handleBet = (e: React.MouseEvent, side: "YES" | "NO", outcomeLabel: string) => {
    e.stopPropagation();
    if (href) {
      navigate(href);
      return;
    }
    setBetModal({ open: true, side, outcome: outcomeLabel });
  };

  const handleCardClick = () => {
    if (href) {
      navigate(href);
      return;
    }
    navigate(`/app/market/${market.id}`, navigationState ? { state: navigationState } : {});
  };

  const categoryLabel =
    t(`categories.${market.category.toLowerCase()}` as "categories.trending") || market.category;

  const statusLabel = (market.status ?? "Open").toLowerCase() === "open" ? "LIVE" : (market.status ?? "—").toUpperCase();
  const isLive = (market.status ?? "Open").toLowerCase() === "open";

  const { yes: yesOutcome, no: noOutcome } = market.isBinary ? pickBinaryOutcomes(market) : { yes: undefined, no: undefined };
  const binaryReady = Boolean(market.isBinary && yesOutcome && noOutcome);
  const upDownLayout = binaryReady && isUpDownPresentation(market);

  const upPercent = binaryReady && yesOutcome ? Math.round(yesOutcome.probability) : 50;

  const cardShell = cn(
    "group relative flex h-full min-h-0 w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-border/60 bg-card p-3 shadow-sm outline-none transition-colors duration-200 hover:border-border hover:bg-card-hover focus-visible:ring-2 focus-visible:ring-ring dark:border-white/[0.08] dark:shadow-none sm:p-4",
  );

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick();
          }
        }}
        className={cardShell}
      >
        {binaryReady && yesOutcome && noOutcome ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex gap-2.5 sm:gap-3">
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1 ring-border/50 sm:size-10",
                  market.iconBg || "bg-muted",
                )}
              >
                {market.image ? (
                  <img src={market.image} alt="" className="size-full object-cover" />
                ) : (
                  <Icon name={market.icon} className={cn("text-lg sm:text-xl", market.iconColor || "text-foreground")} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug tracking-tight text-foreground group-hover:text-primary sm:text-sm">
                  {market.title}
                </h3>
                <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground sm:text-xs">
                  {categoryLabel}
                  {market.totalPool || market.volume ? ` · ${market.totalPool || market.volume}` : ""}
                </p>
              </div>
              {upDownLayout ? <CompactUpPercent upPercent={upPercent} /> : null}
            </div>

            <div className="mt-3.5 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-2.5">
              <button
                type="button"
                aria-label={`${yesOutcome.label} — ${market.title}`}
                onClick={(e) => handleBet(e, "YES", yesOutcome.label)}
                className={binaryYesClass}
              >
                {yesOutcome.label}
              </button>
              <button
                type="button"
                aria-label={`${noOutcome.label} — ${market.title}`}
                onClick={(e) => handleBet(e, "NO", noOutcome.label)}
                className={binaryNoClass}
              >
                {noOutcome.label}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex gap-2">
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1 ring-border/50 sm:size-9",
                  market.iconBg || "bg-muted",
                )}
              >
                {market.image ? (
                  <img src={market.image} alt="" className="size-full object-cover" />
                ) : (
                  <Icon name={market.icon} className={cn("text-base sm:text-lg", market.iconColor || "text-foreground")} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-xs font-semibold leading-tight text-foreground group-hover:text-primary sm:text-[13px]">
                  {market.title}
                </h3>
                {market.description && market.category !== "Commodities" && market.category !== "Metals" ? (
                  <p className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">{market.description}</p>
                ) : null}
              </div>
            </div>
            <div className="mt-2 space-y-1 sm:mt-2.5">
              {market.outcomes.slice(0, 3).map((outcome) => (
                <div
                  key={outcome.id}
                  className="flex items-center justify-between gap-1.5 rounded-md border border-border/50 bg-muted/25 px-1.5 py-1"
                >
                  <span className="min-w-0 truncate text-[11px] font-medium text-foreground sm:text-xs">{outcome.label}</span>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleBet(e, "YES", outcome.label)}
                      className="rounded border border-emerald-700/95 bg-gradient-to-b from-emerald-500 to-emerald-700 px-1.5 py-0.5 text-[9px] font-bold text-white opacity-70 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_0_0_rgb(6,95,70),0_2px_6px_rgba(0,0,0,0.25)] transition-[opacity,transform,filter,box-shadow] duration-200 hover:opacity-100 hover:brightness-[1.06] active:translate-y-px focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 sm:text-[10px]"
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleBet(e, "NO", outcome.label)}
                      className="rounded border border-rose-700/95 bg-gradient-to-b from-rose-500 to-rose-700 px-1.5 py-0.5 text-[9px] font-bold text-white opacity-70 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_0_0_rgb(159,18,57),0_2px_6px_rgba(0,0,0,0.25)] transition-[opacity,transform,filter,box-shadow] duration-200 hover:opacity-100 hover:brightness-[1.06] active:translate-y-px focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 sm:text-[10px]"
                    >
                      NO
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          className={cn(
            "mt-auto flex items-center justify-between border-t border-border/50 pt-3 dark:border-white/[0.06] sm:pt-3.5",
          )}
        >
          <div className="flex min-w-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[11px]">
            <span
              className={cn("size-1.5 shrink-0 rounded-full sm:size-2", isLive ? "bg-rose-500" : "bg-muted-foreground")}
              aria-hidden
            />
            <span className={cn(isLive ? "text-rose-400" : "text-muted-foreground")}>{statusLabel}</span>
            <span className="truncate font-normal normal-case">
              · {t("market_card.volume")} {market.totalPool || market.volume}
            </span>
          </div>
          <button
            type="button"
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark market"}
            onClick={(e) => {
              e.stopPropagation();
              setBookmarked((b) => !b);
            }}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Bookmark className={cn("size-3.5 sm:size-4", bookmarked && "fill-primary text-primary")} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {!href && betModal && (
        <BetModal
          open={betModal.open}
          onClose={() => setBetModal(null)}
          marketTitle={market.title}
          outcome={betModal.outcome}
          side={betModal.side}
          price={0.5}
        />
      )}
    </>
  );
});

export default MarketCard;
