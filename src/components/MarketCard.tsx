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

/** Filled green / red chips (not outline-only). */
const binaryYesClass =
  "rounded-md border border-emerald-600 bg-emerald-600 px-2 py-1.5 text-center text-[11px] font-semibold leading-none text-white shadow-none transition-colors hover:border-emerald-500 hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-card sm:text-xs";

const binaryNoClass =
  "rounded-md border border-rose-600 bg-rose-600 px-2 py-1.5 text-center text-[11px] font-semibold leading-none text-white shadow-none transition-colors hover:border-rose-500 hover:bg-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-card sm:text-xs";

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

  const cardShell =
    "group relative flex w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-border/60 bg-card p-2.5 shadow-sm outline-none transition-colors duration-200 hover:border-border hover:bg-card-hover focus-visible:ring-2 focus-visible:ring-ring sm:p-3 dark:border-white/[0.08] dark:shadow-none";

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
          <>
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
                <h3 className="line-clamp-2 text-xs font-semibold leading-tight tracking-tight text-foreground group-hover:text-primary sm:text-[13px]">
                  {market.title}
                </h3>
                <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground sm:text-[11px]">
                  {categoryLabel}
                  {market.totalPool || market.volume ? ` · ${market.totalPool || market.volume}` : ""}
                </p>
              </div>
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:mt-3 sm:gap-2">
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
          </>
        ) : (
          <>
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
                      className="rounded border border-emerald-600 bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white hover:border-emerald-500 hover:bg-emerald-500 sm:text-[10px]"
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleBet(e, "NO", outcome.label)}
                      className="rounded border border-rose-600 bg-rose-600 px-1.5 py-0.5 text-[9px] font-bold text-white hover:border-rose-500 hover:bg-rose-500 sm:text-[10px]"
                    >
                      NO
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2 dark:border-white/[0.06] sm:mt-3">
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
