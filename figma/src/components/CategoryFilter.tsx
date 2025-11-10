import { motion } from "motion/react";

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export function CategoryFilter({ categories, selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="flex flex-wrap gap-3"
    >
      <button
        onClick={() => onSelectCategory(null)}
        className={`px-5 py-2 rounded-full border transition-all duration-300 ${
          selectedCategory === null
            ? 'bg-foreground text-background border-foreground'
            : 'bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground'
        }`}
        style={{ fontSize: '14px', fontWeight: 300 }}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelectCategory(category)}
          className={`px-5 py-2 rounded-full border transition-all duration-300 ${
            selectedCategory === category
              ? 'bg-foreground text-background border-foreground'
              : 'bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground'
          }`}
          style={{ fontSize: '14px', fontWeight: 300 }}
        >
          {category}
        </button>
      ))}
    </motion.div>
  );
}
