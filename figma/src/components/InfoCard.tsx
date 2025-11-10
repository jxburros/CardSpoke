import { motion } from "motion/react";
import { ReactNode, forwardRef } from "react";

interface InfoCardProps {
  title: string;
  preview: string;
  tags?: string[];
  childrenCount?: number;
  subtitle?: string;
  meta?: string;
  onClick?: () => void;
  actions?: ReactNode;
}

export const InfoCard = forwardRef<HTMLDivElement, InfoCardProps>(function InfoCard(
  { title, preview, tags = [], childrenCount, subtitle, meta, onClick, actions }: InfoCardProps,
  ref
) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="group relative mb-12 overflow-hidden rounded-[40px] bg-card/95 px-10 py-12 text-foreground shadow-[0_36px_80px_rgba(17,17,17,0.08)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_48px_120px_rgba(17,17,17,0.14)]"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      ref={ref}
    >
      {typeof childrenCount === "number" && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-12 top-8 text-[84px] font-light leading-none text-muted-foreground/20 transition group-hover:text-muted-foreground/30"
          style={{ fontFamily: "Outfit, sans-serif", letterSpacing: "-0.04em" }}
        >
          {childrenCount}
        </span>
      )}

      <div className="relative z-10 space-y-6">
        <div className="space-y-2">
          <h3 className="text-3xl font-semibold tracking-tight text-foreground transition-opacity duration-500 group-hover:opacity-80">
            {title || "(Untitled)"}
          </h3>
          {subtitle && <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{subtitle}</p>}
          {meta && <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{meta}</span>}
        </div>

        <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">{preview}</p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full bg-foreground/5 px-4 py-1 text-foreground/70">
                #{tag.toLowerCase()}
              </span>
            ))}
          </div>
        )}

        {actions && <div className="pt-4">{actions}</div>}
      </div>
    </motion.article>
  );
});
