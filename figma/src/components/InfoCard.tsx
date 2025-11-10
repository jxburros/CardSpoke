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
      className="group mb-10 rounded-[32px] px-10 py-12 bg-card/95 text-foreground shadow-[0_40px_80px_rgba(17,17,17,0.08)] transition duration-500 hover:shadow-[0_50px_120px_rgba(17,17,17,0.12)]"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      ref={ref}
    >
      <div className="flex items-start justify-between gap-16">
        {/* Left Content */}
        <div className="flex-1 space-y-4">
          {/* Title */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-foreground text-2xl group-hover:opacity-80 transition-opacity duration-500 font-semibold">
                {title || "(Untitled)"}
              </h3>
              {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
            </div>
            {meta && <span className="text-xs uppercase tracking-wide text-muted-foreground">{meta}</span>}
          </div>

          {/* Preview */}
          <p className="max-w-2xl pl-8 text-lg leading-relaxed text-muted-foreground">
            {preview}
          </p>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="pl-8 pt-2">
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-foreground/5 px-4 py-1 text-xs uppercase tracking-[0.3em] text-foreground/70"
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
          <div className="text-foreground flex-shrink-0 opacity-30 group-hover:opacity-60 transition-opacity duration-500">
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
      {actions && <div className="mt-10 flex flex-wrap gap-3">{actions}</div>}
    </motion.div>
  );
});
