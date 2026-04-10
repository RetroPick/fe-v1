import { useLanguage } from "@/context/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border/50 py-12 px-4 lg:px-8 bg-background">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
        <div className="flex items-center gap-6">
          <span>{t('footer.copyright')}</span>
          <div className="w-px h-3 bg-border" />
          <span>Oracle-resolved scheduled markets</span>
        </div>
        <div className="flex gap-8">
          <a href="#" className="hover:text-foreground transition-colors">{t('footer.terms')}</a>
          <a href="#" className="hover:text-foreground transition-colors">Docs</a>
          <a href="#" className="hover:text-foreground transition-colors">{t('footer.support')}</a>
          <a href="#" className="hover:text-foreground transition-colors">{t('footer.documentation')}</a>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-muted-foreground">
          <span className="size-1.5 animate-pulse rounded-full bg-primary" />
          <span>Deterministic settlement active</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
