"use client";

import { Search, Download, BarChart3 } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

const tips = [
  {
    Icon: Search,
    title: "Lead-Suche starten",
    description:
      "Suche nach Unternehmen in deiner Zielbranche und Region — Kontaktdaten werden automatisch angereichert.",
    iconBg: "bg-primary/8",
    iconColor: "text-primary",
  },
  {
    Icon: Download,
    title: "Leads exportieren",
    description:
      "Exportiere deine Leads als CSV für dein CRM, E-Mail-Kampagnen oder zur Weiterverarbeitung.",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    Icon: BarChart3,
    title: "Pipeline verwalten",
    description:
      "Verfolge jeden Lead von der Erfassung bis zur Konvertierung und behalte den Überblick.",
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
];

export function QuickStartCarousel() {
  return (
    <Carousel opts={{ loop: true }} className="w-full px-10">
      <CarouselContent>
        {tips.map((tip) => (
          <CarouselItem key={tip.title}>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div
                className={`h-12 w-12 rounded-xl ${tip.iconBg} flex items-center justify-center mb-3`}
              >
                <tip.Icon className={`h-6 w-6 ${tip.iconColor}`} />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">
                {tip.title}
              </p>
              <p className="text-xs text-muted-foreground max-w-xs">
                {tip.description}
              </p>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-0" />
      <CarouselNext className="right-0" />
    </Carousel>
  );
}
