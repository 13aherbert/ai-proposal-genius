import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LifeBuoy, Plus, Clock, MessageSquare, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow, differenceInMinutes, isPast } from 'date-fns';

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  sla_deadline_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_staff_reply: boolean;
  created_at: string;
}

export function SupportTickets() {
  const { organization } = useCurrentOrganization();
  const { session } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newTicket, setNewTicket] = useState({ subject: '', description: '', priority: 'medium' });

  useEffect(() => {
    if (organization?.id) fetchTickets();
  }, [organization?.id]);

  const fetchTickets = async () => {
    if (!organization?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTickets((data as SupportTicket[]) || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    const { data, error } = await supabase
      .from('support_ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    if (error) { console.error(error); return; }
    setMessages((data as TicketMessage[]) || []);
  };

  const createTicket = async () => {
    if (!organization?.id || !session?.user?.id || !newTicket.subject || !newTicket.description) {
      toast.error('Please fill in all fields');
      return;
    }

    // Enterprise orgs get 4-hour SLA for high/critical
    const isEnterprise = organization.subscription_tier === 'enterprise' || organization.subscription_tier === 'white_label';
    let slaDeadline: string | null = null;
    if (isEnterprise && (newTicket.priority === 'high' || newTicket.priority === 'critical')) {
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 4);
      slaDeadline = deadline.toISOString();
    }

    try {
      const { error } = await supabase.from('support_tickets').insert({
        organization_id: organization.id,
        user_id: session.user.id,
        subject: newTicket.subject,
        description: newTicket.description,
        priority: newTicket.priority,
        sla_deadline_at: slaDeadline,
      });
      if (error) throw error;
      toast.success('Support ticket created');
      setShowCreate(false);
      setNewTicket({ subject: '', description: '', priority: 'medium' });
      fetchTickets();
    } catch (error) {
      console.error(error);
      toast.error('Failed to create ticket');
    }
  };

  const sendMessage = async () => {
    if (!selectedTicket || !session?.user?.id || !newMessage.trim()) return;
    try {
      const { error } = await supabase.from('support_ticket_messages').insert({
        ticket_id: selectedTicket.id,
        user_id: session.user.id,
        message: newMessage.trim(),
      });
      if (error) throw error;
      setNewMessage('');
      fetchMessages(selectedTicket.id);
    } catch (error) {
      console.error(error);
      toast.error('Failed to send message');
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return <Badge className={variants[priority] || 'bg-muted text-muted-foreground'}>{priority}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-muted text-muted-foreground',
    };
    return <Badge className={variants[status] || 'bg-muted text-muted-foreground'}>{status.replace('_', ' ')}</Badge>;
  };

  const getSlaIndicator = (ticket: SupportTicket) => {
    if (!ticket.sla_deadline_at || ticket.status === 'resolved' || ticket.status === 'closed') return null;
    const deadline = new Date(ticket.sla_deadline_at);
    const isOverdue = isPast(deadline);
    const minutesLeft = differenceInMinutes(deadline, new Date());

    if (isOverdue) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> SLA Breached
        </Badge>
      );
    }
    if (minutesLeft < 60) {
      return (
        <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1">
          <Clock className="h-3 w-3" /> {minutesLeft}m left
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
        <Clock className="h-3 w-3" /> {Math.round(minutesLeft / 60)}h left
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><LifeBuoy className="h-5 w-5" />Support</CardTitle></CardHeader>
        <CardContent><div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></CardContent>
      </Card>
    );
  }

  // Ticket detail view
  if (selectedTicket) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" size="sm" className="mb-2" onClick={() => { setSelectedTicket(null); setMessages([]); }}>← Back</Button>
              <CardTitle className="flex items-center gap-2">{selectedTicket.subject}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                {getPriorityBadge(selectedTicket.priority)}
                {getStatusBadge(selectedTicket.status)}
                {getSlaIndicator(selectedTicket)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm">{selectedTicket.description}</p>
            <p className="text-xs text-muted-foreground mt-2">Created {formatDistanceToNow(new Date(selectedTicket.created_at))} ago</p>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {messages.map((msg) => (
              <div key={msg.id} className={`p-3 rounded-lg text-sm ${msg.is_staff_reply ? 'bg-primary/10 ml-8' : 'bg-muted mr-8'}`}>
                <p>{msg.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {msg.is_staff_reply ? 'Staff' : 'You'} • {formatDistanceToNow(new Date(msg.created_at))} ago
                </p>
              </div>
            ))}
          </div>

          {selectedTicket.status !== 'closed' && (
            <div className="flex gap-2">
              <Textarea
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={2}
              />
              <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <LifeBuoy className="h-5 w-5" />
              Support Tickets
            </CardTitle>
            <CardDescription>Get help from our support team</CardDescription>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New Ticket</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Support Ticket</DialogTitle>
                <DialogDescription>Describe your issue and we'll get back to you.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input value={newTicket.subject} onChange={(e) => setNewTicket(p => ({ ...p, subject: e.target.value }))} placeholder="Brief description of the issue" />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={newTicket.priority} onValueChange={(v) => setNewTicket(p => ({ ...p, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  {(organization?.subscription_tier === 'enterprise' || organization?.subscription_tier === 'white_label') && 
                    (newTicket.priority === 'high' || newTicket.priority === 'critical') && (
                    <p className="text-xs text-green-600">🎯 Enterprise SLA: 4-hour response guarantee</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={newTicket.description} onChange={(e) => setNewTicket(p => ({ ...p, description: e.target.value }))} rows={4} placeholder="Provide details about your issue..." />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button onClick={createTicket}>Submit Ticket</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <LifeBuoy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No support tickets yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <Card key={ticket.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => { setSelectedTicket(ticket); fetchMessages(ticket.id); }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">{ticket.subject}</h4>
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(ticket.priority)}
                        {getStatusBadge(ticket.status)}
                        {getSlaIndicator(ticket)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created {formatDistanceToNow(new Date(ticket.created_at))} ago
                      </p>
                    </div>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
