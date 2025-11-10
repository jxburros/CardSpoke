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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="group rounded-[48px] px-12 py-14 text-foreground transition duration-500 hover:-translate-y-1"
      style={{ background: "var(--panel-surface)", boxShadow: "var(--panel-shadow)" }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      ref={ref}
    >
      <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 space-y-6">
          <div className="space-y-2">
            <div className="flex items-start gap-4">
              <h3 className="text-3xl font-semibold leading-tight tracking-tight text-foreground transition-opacity duration-300 group-hover:opacity-90">
                {title || "(Untitled)"}
              </h3>
              {meta && <span className="text-xs uppercase tracking-[0.28em] text-muted-foreground/70">{meta}</span>}
            </div>
            {subtitle && <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground/70">{subtitle}</p>}
          </div>

          <p className="max-w-3xl text-lg leading-relaxed text-foreground/75">
            {preview}
          </p>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.28em] text-muted-foreground/70">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full bg-foreground/[0.06] px-4 py-1">
                  #{tag.toLowerCase()}
                </span>
              ))}
            </div>
          )}
        </div>

        {typeof childrenCount === "number" && (
          <div className="flex items-center text-foreground/30 transition duration-300 group-hover:text-foreground/60">
            <span
              style={{
                fontSize: "86px",
                fontWeight: 300,
                lineHeight: 1,
                fontFamily: "Outfit, sans-serif",
                letterSpacing: "-0.04em"
              }}
            >
              {childrenCount}
            </span>
          </div>
        )}
      </div>
      {actions && <div className="mt-12 flex flex-wrap gap-3 text-sm text-foreground/80">{actions}</div>}
    </motion.article>
  );
});
