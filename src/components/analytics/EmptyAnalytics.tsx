import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Upload } from "lucide-react";
import { Link } from "react-router-dom";

export function EmptyAnalytics() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-primary" />
        Analytics Dashboard
      </h1>
      <Card className="max-w-lg mx-auto">
        <CardContent className="flex flex-col items-center text-center py-12 px-6">
          <div className="p-4 rounded-full bg-primary/10 mb-4">
            <BarChart3 className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-lg font-semibold mb-2">No data yet</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Complete your first proposal to see analytics here — track win rates, ROI, team performance, and more.
          </p>
          <Button asChild>
            <Link to="/upload-rfp">
              <Upload className="h-4 w-4 mr-2" />
              Create Your First Proposal
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
