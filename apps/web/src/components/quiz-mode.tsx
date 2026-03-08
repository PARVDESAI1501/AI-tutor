"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Trophy,
} from "lucide-react";

interface Question {
  question: string;
  type: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

interface QuizModeProps {
  data: { questions: Question[] };
}

export function QuizMode({ data }: QuizModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [finished, setFinished] = useState(false);

  const questions = data.questions;
  const currentQuestion = questions[currentIndex];
  const total = questions.length;

  const handleAnswer = (letter: string) => {
    if (showExplanation) return;

    setSelectedAnswer(letter);
    setShowExplanation(true);

    if (!answeredQuestions.has(currentIndex)) {
      if (letter === currentQuestion.correct_answer) {
        setScore((prev) => prev + 1);
      }
      setAnsweredQuestions((prev) => new Set(prev).add(currentIndex));
    }
  };

  const goNext = () => {
    if (currentIndex + 1 >= total) {
      setFinished(true);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  const restart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setAnsweredQuestions(new Set());
    setFinished(false);
  };

  const getLetterFromOption = (option: string): string => {
    const match = option.match(/^([A-D])\)/);
    return match ? match[1] : "";
  };

  // Results Screen
  if (finished) {
    const percentage = Math.round((score / total) * 100);

    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
        <div className="rounded-full bg-primary/10 p-6">
          <Trophy className="h-12 w-12 text-primary" />
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
          <p className="text-muted-foreground">
            Here are your results
          </p>
        </div>

        <div className="text-5xl font-bold">
          <span
            className={
              percentage >= 70
                ? "text-green-600"
                : percentage >= 50
                ? "text-yellow-600"
                : "text-red-600"
            }
          >
            {percentage}%
          </span>
        </div>

        <p className="text-lg">
          You got{" "}
          <span className="font-bold text-primary">{score}</span> out of{" "}
          <span className="font-bold">{total}</span> questions correct
        </p>

        <div className="text-sm text-muted-foreground">
          {percentage >= 90
            ? "🌟 Excellent! You have mastered this material!"
            : percentage >= 70
            ? "👍 Good job! Review the topics you missed."
            : percentage >= 50
            ? "📚 Keep studying! Review the material and try again."
            : "💪 Don't give up! Re-read the material and retake the quiz."}
        </div>

        <Button onClick={restart} size="lg">
          <RotateCcw className="h-4 w-4 mr-2" />
          Retake Quiz
        </Button>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="p-4 text-center text-muted-foreground">No questions available</div>;
  }

  return (
    <div className="flex flex-col h-full p-4 space-y-6 overflow-y-auto">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Question {currentIndex + 1} of {total}
        </span>
        <span className="text-sm font-medium text-primary">
          Score: {score}/{answeredQuestions.size}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
      </div>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base leading-relaxed">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const letter = getLetterFromOption(option);
            const isSelected = selectedAnswer === letter;
            const isCorrect = letter === currentQuestion.correct_answer;

            let className =
              "w-full text-left p-4 rounded-lg border-2 transition-all text-sm ";

            if (!showExplanation) {
              className +=
                "hover:border-primary hover:bg-primary/5 cursor-pointer border-border";
            } else if (isCorrect) {
              className +=
                "border-green-500 bg-green-50 dark:bg-green-950 cursor-default";
            } else if (isSelected && !isCorrect) {
              className +=
                "border-red-500 bg-red-50 dark:bg-red-950 cursor-default";
            } else {
              className += "border-border opacity-50 cursor-default";
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(letter)}
                className={className}
                disabled={showExplanation}
              >
                <div className="flex items-center gap-3">
                  {showExplanation && isCorrect && (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  )}
                  {showExplanation && isSelected && !isCorrect && (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  )}
                  <span>{option}</span>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Explanation */}
      {showExplanation && (
        <Card
          className={
            selectedAnswer === currentQuestion.correct_answer
              ? "border-green-200 bg-green-50/50 dark:bg-green-950/30"
              : "border-red-200 bg-red-50/50 dark:bg-red-950/30"
          }
        >
          <CardContent className="pt-6">
            <p className="text-sm font-medium mb-2">
              {selectedAnswer === currentQuestion.correct_answer
                ? "✅ Correct!"
                : `❌ Incorrect. The correct answer is ${currentQuestion.correct_answer}.`}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentQuestion.explanation}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Next Button */}
      {showExplanation && (
        <div className="flex justify-end">
          <Button onClick={goNext}>
            {currentIndex + 1 >= total ? "See Results" : "Next Question"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
