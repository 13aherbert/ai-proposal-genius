
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Book, Video, MessageCircle, ExternalLink, ChevronRight } from 'lucide-react';

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  category: 'getting-started' | 'proposals' | 'knowledge-base' | 'troubleshooting';
  type: 'article' | 'video' | 'tutorial';
  readTime: string;
  href: string;
}

const helpArticles: HelpArticle[] = [
  {
    id: 'first-proposal',
    title: 'Creating Your First Proposal',
    description: 'Step-by-step guide to uploading an RFP and generating your first proposal',
    category: 'getting-started',
    type: 'tutorial',
    readTime: '5 min',
    href: '/docs/first-proposal'
  },
  {
    id: 'knowledge-setup',
    title: 'Setting Up Your Knowledge Base',
    description: 'Learn how to organize and structure your content library for maximum efficiency',
    category: 'knowledge-base',
    type: 'article',
    readTime: '8 min',
    href: '/docs/knowledge-setup'
  },
  {
    id: 'proposal-customization',
    title: 'Customizing Proposal Templates',
    description: 'How to modify and create custom templates for your specific industry',
    category: 'proposals',
    type: 'video',
    readTime: '12 min',
    href: '/docs/proposal-customization'
  },
  {
    id: 'export-formats',
    title: 'Exporting Proposals in Different Formats',
    description: 'Understanding PDF, Word, and other export options for your proposals',
    category: 'proposals',
    type: 'article',
    readTime: '3 min',
    href: '/docs/export-formats'
  },
  {
    id: 'upload-issues',
    title: 'Troubleshooting File Upload Issues',
    description: 'Solutions for common problems when uploading RFP documents',
    category: 'troubleshooting',
    type: 'article',
    readTime: '4 min',
    href: '/docs/upload-issues'
  }
];

const faqs = [
  {
    question: 'How long does it take to generate a proposal?',
    answer: 'Most proposals are generated within 2-5 minutes, depending on the complexity and length of your RFP document.'
  },
  {
    question: 'What file formats can I upload?',
    answer: 'We support PDF, Word documents (.docx), and plain text files. The maximum file size is 10MB.'
  },
  {
    question: 'Can I edit the generated proposal?',
    answer: 'Yes! All generated content can be edited, customized, and reorganized to match your specific needs.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use enterprise-grade encryption and never share your data with third parties.'
  }
];

export function SelfServiceHelp() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredArticles = helpArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'tutorial': return <Book className="h-4 w-4" />;
      default: return <Book className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'getting-started': return 'bg-green-100 text-green-800';
      case 'proposals': return 'bg-blue-100 text-blue-800';
      case 'knowledge-base': return 'bg-purple-100 text-purple-800';
      case 'troubleshooting': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Help Center</h2>
        <p className="text-muted-foreground">
          Find answers and learn how to make the most of OptiRFP
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search help articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="knowledge-base">Knowledge Base</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          <div className="grid gap-4">
            {filteredArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(article.type)}
                        <CardTitle className="text-lg">{article.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryColor(article.category)}>
                          {article.category.replace('-', ' ')}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{article.readTime}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription>{article.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No articles found matching your search.
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b pb-4 last:border-b-0">
              <h3 className="font-medium mb-2">{faq.question}</h3>
              <p className="text-muted-foreground text-sm">{faq.answer}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="font-semibold">Still need help?</h3>
            <p className="text-muted-foreground text-sm">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <Button>
              Contact Support
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
