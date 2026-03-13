import { Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const comparisonData = [
  {
    feature: "Starting Price",
    loopio: "$20K/yr",
    responsive: "$18K/yr",
    pandadoc: "$228/yr",
    optirfp: "FREE",
  },
  {
    feature: "Per-Seat Pricing",
    loopio: true,
    responsive: true,
    pandadoc: true,
    optirfp: false,
  },
  {
    feature: "User Limit",
    loopio: "10 included",
    responsive: "Per-seat",
    pandadoc: "Per-seat",
    optirfp: "Unlimited",
  },
  {
    feature: "Your Cost (10 users)",
    loopio: "$20,000",
    responsive: "$18,000",
    pandadoc: "$2,280",
    optirfp: "$2,388",
  },
];

function CellValue({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <span className="text-destructive font-medium">Yes</span>
    ) : (
      <span className="text-brand-green font-bold">No ✓</span>
    );
  }
  return <span>{value}</span>;
}

export function CompetitorComparison() {
  return (
    <section className="container py-16">
      <div className="text-center mb-10">
        <h3 className="text-2xl font-bold tracking-tight sm:text-3xl mb-3">
          Why Unlimited Users Matter
        </h3>
        <p className="text-muted-foreground text-lg">
          See how OptiRFP compares to per-seat competitors
        </p>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold text-foreground">Feature</TableHead>
              <TableHead className="text-center text-muted-foreground">Loopio</TableHead>
              <TableHead className="text-center text-muted-foreground">Responsive</TableHead>
              <TableHead className="text-center text-muted-foreground">PandaDoc</TableHead>
              <TableHead className="text-center font-bold text-brand-green bg-brand-green/10">
                OptiRFP
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comparisonData.map((row) => (
              <TableRow key={row.feature}>
                <TableCell className="font-medium text-foreground">
                  {row.feature}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  <CellValue value={row.loopio} />
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  <CellValue value={row.responsive} />
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  <CellValue value={row.pandadoc} />
                </TableCell>
                <TableCell className="text-center font-semibold text-brand-green bg-brand-green/5">
                  <CellValue value={row.optirfp} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-center mt-6 text-lg font-semibold text-foreground">
        OptiRFP: Same features, <span className="text-brand-green">75% less cost</span>, unlimited team.
      </p>
    </section>
  );
}
