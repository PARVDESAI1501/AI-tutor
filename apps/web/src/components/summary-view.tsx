"use client";

import { BookOpen, Lightbulb, List } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryData {
  title: string;
  overview: string;
  key_concepts: Array<{ concept: string; explanation: string }>;
  sections: Array<{
    heading: string;
    content: string;
    key_points: string[];
  }>;
  conclusion: string;
}

interface SummaryViewProps {
  data: SummaryData;
}

export function SummaryView({ data }: SummaryViewProps) {
  return (
    <div className="space-y-6 p-4 overflow-y-auto max-h-full">
      {/* Title & Overview */}
      <div>
        <h2 className="text-2xl font-bold mb-3">{data.title}</h2>
        <p className="text-muted-foreground leading-relaxed">{data.overview}</p>
      </div>

      {/* Key Concepts */}
      {data.key_concepts && data.key_concepts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Key Concepts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.key_concepts.map((item, index) => (
                <div key={index} className="border-l-2 border-primary pl-4">
                  <h4 className="font-semibold text-sm">{item.concept}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.explanation}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sections */}
      {data.sections && data.sections.length > 0 && (
        <div className="space-y-4">
          {data.sections.map((section, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  {section.heading}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed mb-3">{section.content}</p>
                {section.key_points && section.key_points.length > 0 && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <List className="h-3 w-3" />
                      Key Points
                    </p>
                    <ul className="space-y-1">
                      {section.key_points.map((point, i) => (
                        <li
                          key={i}
                          className="text-sm flex items-start gap-2"
                        >
                          <span className="text-primary mt-1">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Conclusion */}
      {data.conclusion && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <p className="text-sm font-medium mb-1">Conclusion</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.conclusion}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
