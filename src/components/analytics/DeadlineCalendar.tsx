import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";
import { Link } from "react-router-dom";
import type { ProposalWithOutcome } from "@/hooks/useAnalyticsDashboard";

interface DeadlineCalendarProps {
  projects: ProposalWithOutcome[];
}

export function DeadlineCalendar({ projects }: DeadlineCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const projectsWithDeadlines = projects.filter(p => p.deadline);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const getDeadlinesForDay = (day: number) => {
    const date = new Date(year, month, day);
    return projectsWithDeadlines.filter(p => {
      const d = new Date(p.deadline!);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  };

  const getStatusColor = (deadline: string) => {
    const d = new Date(deadline);
    const now = new Date();
    const diffDays = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays < 0) return "bg-red-500";
    if (diffDays < 7) return "bg-amber-500";
    return "bg-green-500";
  };

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CalIcon className="h-4 w-4" />
            Deadline Calendar
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-px">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
          ))}
          {days.map((day, i) => {
            const deadlines = day ? getDeadlinesForDay(day) : [];
            const isToday = day && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            return (
              <div
                key={i}
                className={`min-h-[60px] p-1 border rounded-sm ${
                  day ? 'bg-card' : 'bg-transparent border-transparent'
                } ${isToday ? 'ring-1 ring-primary' : ''}`}
              >
                {day && (
                  <>
                    <span className={`text-xs ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                      {day}
                    </span>
                    <div className="space-y-0.5 mt-0.5">
                      {deadlines.slice(0, 2).map(p => (
                        <Link key={p.project_id} to={`/projects/${p.project_id}`}>
                          <div className="flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(p.deadline!)}`} />
                            <span className="text-[9px] truncate">{p.title}</span>
                          </div>
                        </Link>
                      ))}
                      {deadlines.length > 2 && (
                        <span className="text-[9px] text-muted-foreground">+{deadlines.length - 2}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> On track</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Due soon</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Overdue</div>
        </div>
      </CardContent>
    </Card>
  );
}
