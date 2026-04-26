import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

interface Props {
  children: ReactNode;
}

/**
 * Simple fade page transition. Keyed by route so it re-runs on navigation.
 * Wrap any top-level page content with this for a subtle entrance.
 */
const PageTransition = ({ children }: Props) => {
  const location = useLocation();
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
