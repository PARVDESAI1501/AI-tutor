"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, Square, AudioLines } from "lucide-react";

interface Dialogue { speaker: string; text: string; }

export function AudioOverview({ data }: { data: { title: string; script: Dialogue[] } }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    // Pre-load voices
    synthRef.current.getVoices();
    return () => synthRef.current?.cancel();
  }, []);

  const playLine = (index: number) => {
    if (index >= data.script.length) {
      setIsPlaying(false);
      setCurrentIndex(0);
      return;
    }
    setCurrentIndex(index);
    const line = data.script[index];
    const u = new SpeechSynthesisUtterance(line.text);
    
    // Select Sweet & Soft Voices
    const voices = synthRef.current?.getVoices() || [];
    const premiumVoices = voices.filter(v => 
      v.name.includes("Premium") || v.name.includes("Natural") || 
      v.name.includes("Enhanced") || v.name.includes("Online") || 
      v.name.includes("Google")
    );
    const pool = premiumVoices.length > 0 ? premiumVoices : voices;

    const female = pool.find(v => v.name.includes("Female") || v.name.includes("Samantha") || v.name.includes("Zira") || v.name.includes("Google UK English Female")) || pool[0];
    const male = pool.find(v => v.name.includes("Male") || v.name.includes("Alex") || v.name.includes("David") || v.name.includes("Google UK English Male")) || pool[1] || pool[0];
    
    u.voice = line.speaker === "Sam" ? female : male;
    
    // Soft & natural adjustments
    u.rate = 0.95;  // Slightly slower for better articulation
    u.pitch = line.speaker === "Sam" ? 1.05 : 0.95; // Sam is slightly higher pitch
    u.volume = 0.9; // Softer volume

    u.onend = () => playLine(index + 1);
    synthRef.current?.speak(u);
  };

  const togglePlay = () => {
    if (isPlaying) {
      synthRef.current?.cancel();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playLine(currentIndex);
    }
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">{data.title}</h2>
        <div className="flex justify-center items-center gap-2 text-sm text-muted-foreground"><AudioLines className="h-4 w-4"/> AI Audio Overview</div>
      </div>

      <Card className="p-6 bg-card/50 backdrop-blur border-primary/20 glow-card flex flex-col items-center gap-6">
        <div className="flex items-end justify-center gap-1 h-12 w-full">
          {[...Array(15)].map((_, i) => (
            <motion.div key={i} className={`w-1.5 rounded-t-full ${isPlaying ? 'bg-primary' : 'bg-muted'}`}
              animate={isPlaying ? { height: ["20%", "100%", "40%", "80%", "20%"], transition: { repeat: Infinity, duration: 1.2, delay: i * 0.1 } } : { height: "20%" }}
            />
          ))}
        </div>
        <Button size="icon" className="h-12 w-12 rounded-full shadow-lg" onClick={togglePlay}>
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-1" />}
        </Button>
      </Card>

      <div className="flex-1 overflow-y-auto space-y-4 px-2 pb-4">
        {data.script.map((line, idx) => (
          <motion.div key={idx} 
            className={`p-4 rounded-xl transition-colors ${idx === currentIndex && isPlaying ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30'}`}
            animate={idx === currentIndex && isPlaying ? { scale: 1.02 } : { scale: 1 }}
          >
            <span className={`text-xs font-bold uppercase tracking-wider mb-1 block ${line.speaker === "Sam" ? "text-blue-500" : "text-purple-500"}`}>{line.speaker}</span>
            <p className="text-sm leading-relaxed">{line.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
