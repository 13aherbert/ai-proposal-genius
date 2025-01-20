import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Search, FileText, Folder, List } from "lucide-react";

const KnowledgeBase = () => {
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <header className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
              Knowledge Base
            </h1>
            <Button className="gap-2">
              <FileText className="h-4 w-4" />
              Add New Entry
            </Button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <Card className="lg:col-span-1 bg-secondary/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-20rem)]">
                  <div className="flex flex-col gap-2">
                    <Button variant="ghost" className="justify-start gap-2">
                      <BookOpen className="h-4 w-4" />
                      Company Information
                    </Button>
                    <Button variant="ghost" className="justify-start gap-2">
                      <Folder className="h-4 w-4" />
                      Product Descriptions
                    </Button>
                    <Button variant="ghost" className="justify-start gap-2">
                      <FileText className="h-4 w-4" />
                      Proposal Templates
                    </Button>
                    <Button variant="ghost" className="justify-start gap-2">
                      <FileText className="h-4 w-4" />
                      Case Studies
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
                    {[1, 2, 3].map((item) => (
                      <div key={item}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">
                              Company Overview Document
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Last updated 2 days ago
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </div>
                        {item !== 3 && <Separator className="my-4" />}
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