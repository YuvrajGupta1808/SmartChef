import { AnimatePresence, motion } from "framer-motion";
import { ChefHat } from "lucide-react";
import { useEffect, useState } from "react";

interface GenerationLoaderProps {
  query?: string;
  status?: string;
}

const searchingPhrases = [
  "Searching the culinary universe...",
  "Scanning thousands of recipes...",
  "Finding the perfect match...",
  "Exploring flavor combinations...",
  "Checking ingredient availability...",
  "Analyzing cooking techniques...",
  "Comparing price options...",
  "Calculating nutritional info...",
  "Optimizing for your budget...",
  "Crafting your perfect recipe...",
  "Adding the finishing touches...",
  "Almost ready to serve...",
];

export function GenerationLoader({ query, status }: GenerationLoaderProps) {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  useEffect(() => {
    if (status) return; // Don't rotate if we have a real status
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prev) => (prev + 1) % searchingPhrases.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [status]);

  const displayMessage = status || searchingPhrases[currentPhraseIndex];

  return (
    <div className="w-full max-w-xl mx-auto py-20">
      <div className="flex flex-col items-center">
        {/* Animated chef hat */}
        <motion.div
          className="relative mb-8"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <motion.div
            className="w-20 h-20 rounded-full gradient-warm flex items-center justify-center"
            animate={{
              scale: [1, 1.05, 1],
              boxShadow: [
                "0 0 0 0 rgba(249, 115, 22, 0.4)",
                "0 0 0 20px rgba(249, 115, 22, 0)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <ChefHat className="w-10 h-10 text-primary-foreground" />
          </motion.div>
        </motion.div>

        {/* Rotating status message */}
        <div className="h-8 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={status || currentPhraseIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-lg text-muted-foreground text-center"
            >
              {displayMessage}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Dots animation */}
        <div className="flex gap-2 mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
