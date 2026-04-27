import { ReactNode } from "react";
import { motion } from "framer-motion";

interface Props {
  children: ReactNode;
}

/**
 * Subtle fade/slide entrance for a route's content.
 *
 * IMPORTANT: This component must be rendered INSIDE each route's element,
 * not wrapped around <Routes>. Wrapping <Routes> with a single keyed
 * PageTransition causes the whole router subtree (including layouts and
 * their useState/useEffect hooks) to unmount and remount on every
 * navigation, which is why dashboard pages were "kicked back to home".
 */
const PageTransition = ({ children }: Props) => {
  return (
    <motion.div
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
