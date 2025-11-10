import { forwardRef } from "react";
import { Search } from "lucide-react";
import { motion } from "motion/react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(function SearchBar(
  { value, onChange, placeholder = "Search repository..." },
  ref
) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative"
    >
      <Search
        className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
        strokeWidth={1.5}
      />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          ref={ref}
          className="w-full rounded-full bg-foreground/[0.05] pl-16 pr-6 py-5 text-base text-foreground transition focus:bg-foreground/[0.1] focus:shadow-[0_18px_48px_rgba(17,17,17,0.12)] focus:outline-none focus:ring-0 placeholder:text-muted-foreground/60"
        />
    </motion.div>
  );
});
