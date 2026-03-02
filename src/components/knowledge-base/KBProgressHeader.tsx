import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { KnowledgeReadiness } from "@/hooks/use-knowledge-readiness";
import { enhancedKnowledgeCategories } from "./data/categories";

interface KBProgressHeaderProps {
  readiness: KnowledgeReadiness;
}

const RING_SIZE = 80;
const STROKE_WIDTH = 6;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const KBProgressHeader = ({ readiness }: KBProgressHeaderProps) => {
  const { essentialScore, categoryCoverage, isLoading } = readiness;

  const essentialFilled = categoryCoverage.filter(c => c.priority === 'essential' && c.hasContent).length;
  const essentialTotal = categoryCoverage.filter(c => c.priority === 'essential').length;
  const totalFilled = categoryCoverage.filter(c => c.hasContent).length;
  const totalCategories = categoryCoverage.length;

  const offset = CIRCUMFERENCE * (1 - essentialScore / 100);

  const segments = useMemo(() => {
    return enhancedKnowledgeCategories.map((cat) => {
      const coverage = categoryCoverage.find(c => c.name === cat.name);
      return {
        name: cat.name,
        priority: cat.priority,
        filled: coverage?.hasContent ?? false,
      };
    });
  }, [categoryCoverage]);

  if (isLoading) return null;

  return (
    <div className="sticky top-0 z-10">
      {/* Mobile: collapsible */}
      <div className="block sm:hidden">
        <Collapsible>
          <Card className="bg-secondary/50 backdrop-blur-sm">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full flex items-center justify-between p-4">
                <span className="text-sm font-medium">
                  Progress: {essentialFilled}/{essentialTotal} essentials
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <ProgressContent
                  essentialScore={essentialScore}
                  essentialFilled={essentialFilled}
                  essentialTotal={essentialTotal}
                  totalFilled={totalFilled}
                  totalCategories={totalCategories}
                  offset={offset}
                  segments={segments}
                />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* Desktop: always visible */}
      <div className="hidden sm:block">
        <Card className="bg-secondary/50 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-6">
            <ProgressContent
              essentialScore={essentialScore}
              essentialFilled={essentialFilled}
              essentialTotal={essentialTotal}
              totalFilled={totalFilled}
              totalCategories={totalCategories}
              offset={offset}
              segments={segments}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface ProgressContentProps {
  essentialScore: number;
  essentialFilled: number;
  essentialTotal: number;
  totalFilled: number;
  totalCategories: number;
  offset: number;
  segments: { name: string; priority: string; filled: boolean }[];
}

const ProgressContent = ({
  essentialScore,
  essentialFilled,
  essentialTotal,
  totalFilled,
  totalCategories,
  offset,
  segments,
}: ProgressContentProps) => (
  <div className="flex flex-col sm:flex-row items-center gap-4">
    {/* Circular progress ring */}
    <div className="relative flex-shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
      <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={STROKE_WIDTH}
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="hsl(var(--brand-green, 142 71% 45%))"
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold">{essentialScore}%</span>
      </div>
    </div>

    {/* Text stats */}
    <div className="flex-1 space-y-2 text-center sm:text-left">
      <p className="text-sm font-medium">
        {essentialFilled} of {essentialTotal} essential categories filled
      </p>
      <p className="text-xs text-muted-foreground">
        {totalFilled} of {totalCategories} total categories complete
      </p>

      {/* Segmented progress bar */}
      <div className="flex gap-0.5">
        {segments.map((seg, i) => (
          <div
            key={seg.name}
            className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
              seg.filled
                ? seg.priority === 'essential'
                  ? 'bg-green-500'
                  : 'bg-blue-400'
                : 'bg-muted'
            }`}
            title={seg.name}
          />
        ))}
      </div>
    </div>
  </div>
);
