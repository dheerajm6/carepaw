import { motion } from 'framer-motion'
import { useNavDirection } from '../lib/navigation'

// iOS-tuned spring: fast, tight, no overshoot
const SPRING = { type: 'spring' as const, stiffness: 420, damping: 42, mass: 0.85 }
const FADE   = { duration: 0.16, ease: [0.25, 0.1, 0.25, 1] as any }

// ── Stack page (detail screens pushed onto the nav stack) ─────────────────────
// push → slides in from right; the tab page behind it recedes to the left
// pop  → slides out to right;  the tab page behind it returns from the left
const STACK: Record<string, { initial: object; animate: object; exit: object; transition: object }> = {
  push: {
    initial:    { x: '100%' },
    animate:    { x: 0 },
    exit:       { x: '-20%', opacity: 0.6 },  // recede behind a deeper push
    transition: SPRING,
  },
  pop: {
    initial:    { x: '-20%', opacity: 0.6 },  // shouldn't normally happen, safety fallback
    animate:    { x: 0, opacity: 1 },
    exit:       { x: '100%' },                 // slide off to the right (back gesture)
    transition: SPRING,
  },
  tab: {
    initial:    { opacity: 0 },
    animate:    { opacity: 1 },
    exit:       { opacity: 0 },
    transition: FADE,
  },
  none: {
    initial:    { opacity: 0 },
    animate:    { opacity: 1 },
    exit:       { opacity: 0 },
    transition: FADE,
  },
}

// ── Tab page (screens that live in the bottom tab bar) ────────────────────────
// push → recedes to the left as a stack page pushes over it
// pop  → slides back from the left as a stack page pops off
// tab  → fades in (iOS-style instant tab switch)
const TAB: Record<string, { initial: object; animate: object; exit: object; transition: object }> = {
  push: {
    initial:    { x: 0, opacity: 1 },          // already visible, no entry needed
    animate:    { x: 0, opacity: 1 },
    exit:       { x: '-20%', opacity: 0.6 },   // recede behind the incoming stack page
    transition: SPRING,
  },
  pop: {
    initial:    { x: '-20%', opacity: 0.6 },   // return from "behind" the popped screen
    animate:    { x: 0, opacity: 1 },
    exit:       { opacity: 0 },
    transition: SPRING,
  },
  tab: {
    initial:    { opacity: 0 },
    animate:    { opacity: 1 },
    exit:       { opacity: 0 },
    transition: FADE,
  },
  none: {
    initial:    { opacity: 0 },
    animate:    { opacity: 1 },
    exit:       { opacity: 0 },
    transition: FADE,
  },
}

interface PageProps {
  children: React.ReactNode
  className?: string
}

export function StackPage({ children, className = '' }: PageProps) {
  const dir = useNavDirection()
  const v = STACK[dir] ?? STACK.none
  return (
    <motion.div
      className={`fixed inset-0 ${className}`}
      initial={v.initial}
      animate={v.animate}
      exit={v.exit}
      transition={v.transition}
      style={{ willChange: 'transform' }}
    >
      {children}
    </motion.div>
  )
}

export function TabPage({ children, className = '' }: PageProps) {
  const dir = useNavDirection()
  const v = TAB[dir] ?? TAB.none
  return (
    <motion.div
      className={`fixed inset-0 ${className}`}
      initial={v.initial}
      animate={v.animate}
      exit={v.exit}
      transition={v.transition}
      style={{ willChange: 'transform' }}
    >
      {children}
    </motion.div>
  )
}
