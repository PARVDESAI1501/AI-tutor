"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
} from "lucide-react";

interface Flashcard {
  front: string;
  back: string;
  difficulty: "easy" | "medium" | "hard";
}

interface FlashcardViewerProps {
  data: { flashcards: Flashcard[] };
}

export function FlashcardViewer({ data }: FlashcardViewerProps) {
  const [cards, setCards] = useState<Flashcard[]>(data.flashcards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set());

  const currentCard = cards[currentIndex];
  const total = cards.length;

  const goNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const goPrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const shuffleCards = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCards(new Set());
  };

  const toggleKnown = () => {
    const newKnown = new Set(knownCards);
    if (newKnown.has(currentIndex)) {
      newKnown.delete(currentIndex);
    } else {
      newKnown.add(currentIndex);
    }
    setKnownCards(newKnown);
  };

  const difficultyColor = {
    easy: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    hard: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  };

  if (!currentCard) {
    return <div className="p-4 text-center text-muted-foreground">No flashcards available</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">
          Card {currentIndex + 1} of {total}
        </span>
        <span className="text-green-600 font-medium">
          {knownCards.size} known
        </span>
        <span className="text-orange-600 font-medium">
          {total - knownCards.size} remaining
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-lg h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all duration-300"
          style={{ width: `${(knownCards.size / total) * 100}%` }}
        />
      </div>

      {/* Flashcard */}
      <div
        className="w-full max-w-lg cursor-pointer perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <Card
          className={`min-h-[250px] transition-all duration-300 ${
            knownCards.has(currentIndex)
              ? "border-green-500 border-2"
              : ""
          }`}
        >
          <CardContent className="flex flex-col items-center justify-center min-h-[250px] p-8 text-center">
            {/* Difficulty Badge */}
            <Badge
              variant="secondary"
              className={`mb-4 ${difficultyColor[currentCard.difficulty]}`}
            >
              {currentCard.difficulty}
            </Badge>

            {/* Label */}
            <p className="text-xs text-muted-foreground mb-3">
              {isFlipped ? "ANSWER" : "QUESTION"} — Click to flip
            </p>

            {/* Content */}
            <p className="text-lg leading-relaxed">
              {isFlipped ? currentCard.back : currentCard.front}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={goPrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant={knownCards.has(currentIndex) ? "default" : "outline"}
          onClick={toggleKnown}
          className="min-w-[100px]"
        >
          {knownCards.has(currentIndex) ? "Known ✓" : "Mark Known"}
        </Button>

        <Button variant="outline" size="icon" onClick={shuffleCards}>
          <Shuffle className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setCurrentIndex(0);
            setIsFlipped(false);
            setKnownCards(new Set());
          }}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <Button variant="outline" size="icon" onClick={goNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
