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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group mb-12 rounded-[40px] bg-card px-12 py-14 text-foreground transition-all duration-500 [box-shadow:var(--shadow-soft)] hover:-translate-y-1 hover:[box-shadow:var(--shadow-strong)]"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      ref={ref}
    >
      <div className="flex items-start justify-between gap-16">
        {/* Left Content */}
        <div className="flex-1 space-y-6">
          {/* Title */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-foreground text-[30px] font-semibold leading-[1.05] tracking-tight transition-opacity duration-500 group-hover:opacity-75">
                {title || "(Untitled)"}
              </h3>
              {subtitle && <p className="mt-2 text-sm uppercase tracking-[0.3em] text-muted-foreground">{subtitle}</p>}
            </div>
            {meta && <span className="text-xs uppercase tracking-wide text-muted-foreground">{meta}</span>}
          </div>

          {/* Preview */}
          <p className="max-w-3xl text-[18px] leading-relaxed text-muted-foreground">
            {preview}
          </p>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="pt-2">
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground/80">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-foreground/5 px-4 py-1 text-xs uppercase tracking-[0.28em] text-foreground/60"
                  >
                    #{tag.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Number */}
        {typeof childrenCount === "number" && (
          <div className="flex-shrink-0 text-foreground opacity-30 transition-opacity duration-500 group-hover:opacity-60">
            <span style={{
              fontSize: '80px',
              fontWeight: 300,
              lineHeight: 1,
              fontFamily: 'Outfit, sans-serif',
              letterSpacing: '-0.04em'
            }}>
              {childrenCount}
            </span>
          </div>
        )}
      </div>
      {actions && <div className="mt-12 flex flex-wrap gap-3">{actions}</div>}
    </motion.div>
  );
});
