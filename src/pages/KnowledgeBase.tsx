import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Search, FileText, Folder, List, Scale, DollarSign, LineChart } from "lucide-react";

const KnowledgeBase = () => {
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto px-4 py-8 h-[calc(100vh-4rem)]">
        <div className="flex flex-col gap-8 h-full">
          <header className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
              Knowledge Base
            </h1>
            <Button className="gap-2">
              <FileText className="h-4 w-4" />
              Add New Entry
            </Button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100%-5rem)]">
            {/* Sidebar */}
            <Card className="lg:col-span-1 bg-secondary/50 backdrop-blur-sm h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-16rem)]">
                  <div className="flex flex-col gap-2">
                    <Button variant="ghost" className="justify-start gap-2">
                      <BookOpen className="h-4 w-4" />
                      Company Boilerplates
                    </Button>
                    <Button variant="ghost" className="justify-start gap-2">
                      <Scale className="h-4 w-4" />
                      Legal Disclaimers
                    </Button>
                    <Button variant="ghost" className="justify-start gap-2">
                      <FileText className="h-4 w-4" />
                      Prior RFP Responses
                    </Button>
                    <Button variant="ghost" className="justify-start gap-2">
                      <LineChart className="h-4 w-4" />
                      Industry Benchmarks
                    </Button>
                    <Button variant="ghost" className="justify-start gap-2">
                      <Folder className="h-4 w-4" />
                      Competitive Insights
                    </Button>
                    <Button variant="ghost" className="justify-start gap-2">
                      <DollarSign className="h-4 w-4" />
                      Pricing Templates
                    </Button>
                    <Button variant="ghost" className="justify-start gap-2">
                      <FileText className="h-4 w-4" />
                      Estimation Tools
                    </Button>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              <Card className="bg-secondary/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search knowledge base..."
                      className="pl-9"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-secondary/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Recent Entries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        title: "Standard Legal Disclaimer Template",
                        category: "Legal Disclaimers",
                        updated: "1 day ago"
                      },
                      {
                        title: "Q4 2023 Pricing Guidelines",
                        category: "Pricing Templates",
                        updated: "2 days ago"
                      },
                      {
                        title: "Government RFP Response Template",
                        category: "Prior RFP Responses",
                        updated: "3 days ago"
                      }
                    ].map((item, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{item.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {item.category} • Last updated {item.updated}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </div>
                        {index !== 2 && <Separator className="my-4" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;