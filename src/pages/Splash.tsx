import { useEffect } from 'react'
import { motion } from 'framer-motion'

export default function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="fixed inset-0 bg-primary flex flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="w-24 h-24 bg-accent rounded-3xl flex items-center justify-center shadow-xl">
          <span className="text-5xl">🐾</span>
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">CarePaw</h1>
          <p className="text-white/60 text-sm mt-1 tracking-wide">Community Care for Street Dogs</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-12 flex flex-col items-center gap-2"
      >
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 bg-white/40 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
        <p className="text-white/40 text-xs">Making streets safer, together</p>
      </motion.div>
    </div>
  )
}
