import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { PAGE_TRANSITION } from '../../utils/transitionConfig';

const ROUTE_ORDER = [
  '/dashboard',
  '/chats',
  '/communities',
  '/projects',
  '/library',
  '/admin',
  '/profile',
  '/settings',
  '/ui-playground'
];

const getRouteOrder = (pathname: string): number => {
  const idx = ROUTE_ORDER.findIndex((p) => pathname === p || pathname.startsWith(p + '/'));
  return idx >= 0 ? idx : 999;
};

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  const [direction, setDirection] = useState(0);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    const curr = getRouteOrder(location.pathname);
    const prev = getRouteOrder(prevPathRef.current);
    setDirection(curr > prev ? 1 : curr < prev ? -1 : 0);
    prevPathRef.current = location.pathname;
  }, [location.pathname]);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : dir < 0 ? '-100%' : 0
    }),
    center: {
      x: 0,
      transition: {
        duration: PAGE_TRANSITION.duration,
        ease: PAGE_TRANSITION.ease
      }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : dir < 0 ? '100%' : 0,
      transition: {
        duration: PAGE_TRANSITION.duration,
        ease: PAGE_TRANSITION.ease
      }
    })
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[var(--color-background)]">
      <AnimatePresence mode="sync" initial={false} custom={direction}>
        <motion.div
          key={location.pathname}
          custom={direction}
          className="absolute inset-0 z-0 min-h-screen w-full origin-center bg-[var(--color-background)]"
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
