import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Search, FileText, Folder, List, Scale, DollarSign, LineChart, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const KnowledgeBase = () => {
  const [open, setOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'text' | 'file'>('text');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const categories = [
    { icon: <BookOpen className="h-4 w-4" />, name: "Company Boilerplates" },
    { icon: <Scale className="h-4 w-4" />, name: "Legal Disclaimers" },
    { icon: <FileText className="h-4 w-4" />, name: "Prior RFP Responses" },
    { icon: <LineChart className="h-4 w-4" />, name: "Industry Benchmarks" },
    { icon: <Folder className="h-4 w-4" />, name: "Competitive Insights" },
    { icon: <DollarSign className="h-4 w-4" />, name: "Pricing Templates" },
    { icon: <FileText className="h-4 w-4" />, name: "Estimation Tools" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadMode === 'file' && !selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }
    setOpen(false);
    toast.success("Entry added successfully!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) { // 20MB limit
        toast.error("File size must be less than 20MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto px-4 py-8 h-[calc(100vh-4rem)]">
        <div className="flex flex-col gap-8 h-full">
          <header className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
              Knowledge Base
            </h1>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <FileText className="h-4 w-4" />
                  Add New Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>Add New Knowledge Base Entry</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" placeholder="Enter the title of your entry" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.name} value={category.name.toLowerCase().replace(/\s+/g, '-')}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Content Type</Label>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant={uploadMode === 'text' ? 'default' : 'outline'}
                        onClick={() => setUploadMode('text')}
                      >
                        Text
                      </Button>
                      <Button
                        type="button"
                        variant={uploadMode === 'file' ? 'default' : 'outline'}
                        onClick={() => setUploadMode('file')}
                      >
                        Upload Document
                      </Button>
                    </div>
                  </div>
                  {uploadMode === 'text' ? (
                    <div className="space-y-2">
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        placeholder="Enter the content of your knowledge base entry"
                        className="min-h-[200px]"
                        required={uploadMode === 'text'}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="file">Upload Document</Label>
                      <div className="border-2 border-dashed rounded-lg p-4">
                        <Input
                          id="file"
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.txt"
                          required={uploadMode === 'file'}
                        />
                        <label
                          htmlFor="file"
                          className="flex flex-col items-center gap-2 cursor-pointer"
                        >
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            PDF, DOC, DOCX, TXT (max 20MB)
                          </span>
                        </label>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Save Entry</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
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
                <div className="flex flex-col gap-2">
                  {categories.map((category) => (
                    <Button key={category.name} variant="ghost" className="justify-start gap-2">
                      {category.icon}
                      {category.name}
                    </Button>
                  ))}
                </div>
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
