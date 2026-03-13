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
    autorfp: "$700/mo",
    loopio: "$1,667/mo",
    responsive: "$1,500/mo",
    optirfp: "FREE",
  },
  {
    feature: "Free Tier",
    autorfp: false,
    loopio: false,
    responsive: false,
    optirfp: true,
  },
  {
    feature: "Per-Seat Pricing",
    autorfp: true,
    loopio: true,
    responsive: true,
    optirfp: false,
  },
  {
    feature: "Team Members",
    autorfp: "Per-seat",
    loopio: "10 included",
    responsive: "Per-seat",
    optirfp: "Unlimited",
  },
  {
    feature: "Cost for 10 Users",
    autorfp: "$8,400/yr",
    loopio: "$20,000/yr",
    responsive: "$18,000/yr",
    optirfp: "$5,388/yr",
  },
];

function CellValue({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <span className="text-brand-green font-bold">Yes ✓</span>
    ) : (
      <span className="text-destructive font-medium">No</span>
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
          See how OptiRFP compares — only OptiRFP offers a free tier
        </p>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold text-foreground">Feature</TableHead>
              <TableHead className="text-center text-muted-foreground">AutoRFP.ai</TableHead>
              <TableHead className="text-center text-muted-foreground">Loopio</TableHead>
              <TableHead className="text-center text-muted-foreground">Responsive</TableHead>
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
                  <CellValue value={row.autorfp} />
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  <CellValue value={row.loopio} />
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  <CellValue value={row.responsive} />
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
        Save <span className="text-brand-green">$8,400/year</span> vs AutoRFP.ai — same features, unlimited team.
      </p>
    </section>
  );
}
