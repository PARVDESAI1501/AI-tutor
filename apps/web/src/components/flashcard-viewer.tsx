"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Shuffle, Check, X } from "lucide-react";

export function FlashcardViewer({ data }: any) {
  const [cards, setCards] = useState(data.flashcards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);

  // Swipe physics
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const colorRight = useTransform(x, [0, 100], ["rgba(34, 197, 94, 0)", "rgba(34, 197, 94, 0.2)"]);
  const colorLeft = useTransform(x, [-100, 0], ["rgba(239, 68, 68, 0.2)", "rgba(239, 68, 68, 0)"]);

  const currentCard = cards[currentIndex];
  if (!currentCard) return null;

  const handleDragEnd = (e: any, info: any) => {
    if (info.offset.x > 100) {
      // Swiped Right (Known)
      setKnownCount(prev => prev + 1);
      nextCard();
    } else if (info.offset.x < -100) {
      // Swiped Left (Review)
      nextCard();
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev + 1) % cards.length), 200);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 space-y-8 overflow-hidden">
      <div className="flex w-full max-w-sm justify-between text-sm font-bold text-muted-foreground uppercase tracking-widest">
        <span>Cards: {currentIndex + 1} / {cards.length}</span>
        <span className="text-green-500">Known: {knownCount}</span>
      </div>

      <div className="relative w-full max-w-sm h-[400px] flex items-center justify-center perspective-1000">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            style={{ x, rotate, opacity }}
            onDragEnd={handleDragEnd}
            whileDrag={{ scale: 1.05, cursor: "grabbing" }}
            className="absolute inset-0 cursor-grab z-10"
          >
            <motion.div
              initial={false}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full h-full relative preserve-3d"
            >
              {/* Front */}
              <motion.div 
                className="absolute inset-0 backface-hidden w-full h-full rounded-3xl border-2 border-border/50 bg-card shadow-2xl p-8 flex flex-col items-center justify-center text-center"
                style={{ backgroundColor: x.get() > 0 ? colorRight as any : colorLeft as any }}
              >
                <Badge variant="outline" className="absolute top-6">{currentCard.difficulty}</Badge>
                <p className="text-xs font-bold text-muted-foreground mb-6 uppercase tracking-widest">Question</p>
                <p className="text-2xl font-bold">{currentCard.front}</p>
                
                {/* Swipe hints */}
                <div className="absolute bottom-6 flex w-full px-8 justify-between opacity-30">
                  <div className="flex items-center gap-1 text-red-500"><X className="h-4 w-4"/> Swipe Review</div>
                  <div className="flex items-center gap-1 text-green-500">Swipe Known <Check className="h-4 w-4"/></div>
                </div>
              </motion.div>

              {/* Back */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 w-full h-full rounded-3xl border-2 border-primary/50 bg-primary/5 shadow-2xl p-8 flex flex-col items-center justify-center text-center">
                <p className="text-xs font-bold text-primary mb-6 uppercase tracking-widest">Answer</p>
                <p className="text-xl font-medium leading-relaxed">{currentCard.back}</p>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" onClick={() => { setCurrentIndex(0); setKnownCount(0); }}><RotateCcw className="h-4 w-4 mr-2"/> Restart</Button>
      </div>
    </div>
  );
}
