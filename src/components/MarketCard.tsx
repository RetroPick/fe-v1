import { useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Market } from "@/types/market";
import Icon from "./Icon";
import BetModal from "./BetModal";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface MarketCardProps {
  market: Market;
  /** When provided, passes this state when navigating to market detail (e.g. { market }) */
  navigationState?: Record<string, unknown>;
  /** When set, card and outcome actions navigate here instead of market detail / bet modal */
  href?: string;
}

const MarketCard = memo(({ market, navigationState, href }: MarketCardProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [betModal, setBetModal] = useState<{ open: boolean; side: 'YES' | 'NO'; outcome: string } | null>(null);

  const handleBet = (e: React.MouseEvent, side: 'YES' | 'NO', outcomeLabel: string) => {
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

  return (
    <>
      <div
        onClick={handleCardClick}
        className="group relative flex aspect-[4/3] w-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-black/10 bg-card shadow-sm isolate transition-colors duration-200 hover:border-primary/20 hover:bg-card-hover dark:border-border dark:shadow-none md:aspect-square"
      >
        {/* Image Header with Gradient Overlay - -inset-0.5 for pixel-perfect edge coverage, no bleed */}
        <div className="relative h-48 w-full overflow-hidden isolate z-0 rounded-t-3xl">
          <div className="absolute -inset-0.5 bg-gradient-to-t from-black/85 via-black/55 via-black/30 via-black/10 to-transparent z-10 rounded-t-3xl" />
          <div className="absolute -inset-0.5 z-10 rounded-t-3xl bg-gradient-to-b from-black/15 via-transparent to-transparent transition-opacity duration-200 group-hover:opacity-0" />
          {market.image ? (
            <img
              src={market.image}
              alt={market.title}
              className="absolute inset-0 size-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02]"
              style={{ transformOrigin: 'center center' }}
            />
          ) : (
            <div className="w-full h-full bg-secondary/50 flex items-center justify-center">
              <Icon name={market.icon} className="text-6xl text-muted-foreground/20" />
            </div>
          )}

          {/* Category Badge */}
          <div className="absolute top-4 left-4 z-20">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
              <Icon name={market.icon} className={cn("text-xs", market.iconColor || "text-white")} />
              <span className="text-[10px] font-medium tracking-wide uppercase text-white/90">
                {categoryLabel}
              </span>
            </div>
          </div>

          {/* Volume Badge */}
          <div className="absolute top-4 right-4 z-20">
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
              <Icon name="attach_money" className="text-[10px] text-primary" />
              <span className="text-[10px] font-mono tabular-nums text-white/90">
                {t("market_card.volume")}: {market.totalPool || market.volume}
              </span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col flex-1 p-5 relative z-20">
          {/* Title & Description */}
          <div className="mb-6">
            <h3 className="text-lg font-bold leading-tight text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {market.title}
            </h3>
            {market.description && market.category !== "Commodities" && market.category !== "Metals" && (
              <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                {market.description}
              </p>
            )}
          </div>

          {/* Outcomes / Interaction */}
          <div className="mt-auto space-y-3">
            {market.isBinary ? (
              <div className="grid grid-cols-2 gap-3">
                {market.outcomes.map((outcome) => {
                  const isYes = outcome.label.toLowerCase() === "yes";
                  const colorClass = isYes ? "text-up" : "text-down";
                  const bgHoverClass = isYes
                    ? "border-border bg-muted/30 hover:border-up/35 hover:bg-up/10"
                    : "border-border bg-muted/30 hover:border-down/35 hover:bg-down/10";

                  return (
                    <button
                      key={outcome.id}
                      aria-label={`${isYes ? "Enter YES" : "Enter NO"}: ${market.title}`}
                      onClick={(e) => handleBet(e, isYes ? 'YES' : 'NO', outcome.label)}
                      className={cn(
                        "relative overflow-hidden rounded-xl border py-3 px-4 transition-colors duration-200 group/btn",
                        bgHoverClass,
                      )}
                    >
                      <div className="relative z-10 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors group-hover/btn:text-foreground">
                          {outcome.label}
                        </span>
                        <span className={cn("text-xl font-black tabular-nums tracking-tight", colorClass)}>
                          {Math.round(outcome.probability)}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {market.outcomes.slice(0, 3).map((outcome) => (
                  <div key={outcome.id} className="group/row flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/40">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-1 rounded-full bg-border transition-colors group-hover/row:bg-primary" />
                      <span className="text-sm font-medium text-muted-foreground transition-colors group-hover/row:text-foreground">
                        {outcome.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold tabular-nums text-foreground">{Math.round(outcome.probability)}%</span>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => handleBet(e, 'YES', outcome.label)}
                          aria-label={`Enter YES ${market.title}`}
                          className="rounded-lg border border-up/25 bg-up/10 px-3 py-1.5 text-[10px] font-bold text-up transition-colors duration-200 hover:bg-up hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          YES
                        </button>
                        <button
                          onClick={(e) => handleBet(e, 'NO', outcome.label)}
                          aria-label={`Enter NO ${market.title}`}
                          className="rounded-lg border border-down/25 bg-down/10 px-3 py-1.5 text-[10px] font-bold text-down transition-colors duration-200 hover:bg-down hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          NO
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
