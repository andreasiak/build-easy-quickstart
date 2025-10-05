import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Star, Clock, MessageSquare, Euro, User, MonitorSpeaker, Trash2, FileText } from 'lucide-react';
import InvoiceList from '@/components/invoice/InvoiceList';
import { BsCardChecklist } from 'react-icons/bs';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import EnhancedSendQuoteModal from '@/components/EnhancedSendQuoteModal';

import { formatClientName } from '@/utils/formatters';
import EnhancedChatModal from '@/components/EnhancedChatModal';
import TicketDetailsModal from '@/components/TicketDetailsModal';
import CreateInvoiceModal from '@/components/invoice/CreateInvoiceModal';

interface QuoteRequest {
  id: string;
  project: {
    title: string;
    description: string;
    budget_range: string;
    location: string;
    created_at: string;
  };
  client: {
    full_name: string;
    user_id: string;
  };
  status: string;
  created_at: string;
}

const VendorDashboard = () => {
  const { user } = useAuth();
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [sendQuoteModal, setSendQuoteModal] = useState<{
    isOpen: boolean;
    quoteRequestId: string;
    projectTitle: string;
  }>({
    isOpen: false,
    quoteRequestId: '',
    projectTitle: ''
  });

  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketDetailsOpen, setTicketDetailsOpen] = useState(false);

  const [chatModal, setChatModal] = useState<{
    isOpen: boolean;
    quoteRequestId: string;
    projectTitle: string;
    clientId: string;
    vendorId: string;
  }>({
    isOpen: false,
    quoteRequestId: '',
    projectTitle: '',
    clientId: '',
    vendorId: ''
  });

  const [createInvoiceModal, setCreateInvoiceModal] = useState<{
    isOpen: boolean;
    quoteRequestId: string;
  }>({
    isOpen: false,
    quoteRequestId: ''
  });


  useEffect(() => {
    fetchQuoteRequests();
  }, [user]);

  const fetchQuoteRequests = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('quote_requests')
        .select(`
          *,
          projects (
            title,
            description,
            budget_range,
            location,
            created_at,
            timeline,
            form_data
          )
        `)
        .eq('vendor_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get client profiles for each quote request
      const clientIds = data?.map(item => item.client_id) || [];
      let clientProfiles: any[] = [];
      
      if (clientIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', clientIds);
        
        if (!profilesError) {
          clientProfiles = profiles || [];
        }
      }

      const formattedData = data?.map(item => {
        const clientProfile = clientProfiles.find(p => p.user_id === item.client_id);
        return {
          id: item.id,
          status: item.status,
          created_at: item.created_at,
          project: {
            title: item.projects?.title || 'Untitled Project',
            description: item.projects?.description || '',
            budget_range: item.projects?.budget_range || 'Budget not specified',
            location: item.projects?.location || 'Location not specified',
            timeline: item.projects?.timeline || (item.projects?.form_data && typeof item.projects.form_data === 'object' && 'deliveryTime' in item.projects.form_data ? `${(item.projects.form_data as any).deliveryTime} months` : 'Timeline not specified'),
            created_at: item.projects?.created_at || item.created_at
          },
          client: {
            full_name: clientProfile?.full_name || 'Client',
            user_id: item.client_id
          }
        };
      }) || [];
      
      setQuoteRequests(formattedData);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load quote requests",
        variant: "destructive",
      });
      setQuoteRequests([]);
    }
    setLoading(false);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'quoted': return 'secondary';
      case 'accepted': return 'default';
      case 'declined': return 'destructive';
      default: return 'default';
    }
  };

  // Helper function removed - now using utility from formatters

  // Check if vendor is ETEK registered
  const isETEKRegistered = (vendorId: string) => {
    // This would typically check vendor profile for ETEK registration
    // For now, return false as placeholder
    return false;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSendQuote = (quoteRequestId: string, projectTitle: string) => {
    setSendQuoteModal({
      isOpen: true,
      quoteRequestId,
      projectTitle
    });
  };

  const handleQuoteSent = () => {
    fetchQuoteRequests(); // Refresh the list
    setSendQuoteModal({ isOpen: false, quoteRequestId: '', projectTitle: '' });
  };

  const handleViewTicket = (quote: any) => {
    setSelectedTicket({
      id: quote.id,
      project: quote.project,
      client: quote.client,
      status: quote.status,
      created_at: quote.created_at,
      vendorId: user?.id
    });
    setTicketDetailsOpen(true);
  };

  const handleChat = (quoteRequestId: string, projectTitle: string, clientId: string, vendorId: string) => {
    setChatModal({
      isOpen: true,
      quoteRequestId,
      projectTitle,
      clientId,
      vendorId
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedQuotes.length === 0) return;
    
    try {
      const { error } = await supabase
        .from('quote_requests')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', selectedQuotes);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedQuotes.length} quote request(s) deleted successfully`,
      });

      setSelectedQuotes([]);
      setIsSelecting(false);
      fetchQuoteRequests(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete quote requests",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
              <MonitorSpeaker className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {user?.email}</p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link to="/business-information">
              <User className="w-4 h-4 mr-2" />
              Business Information
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Quotes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: 'hsl(var(--primary))' }}>
                {quoteRequests.filter(q => q.status === 'pending').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: 'hsl(var(--primary))' }}>
                {quoteRequests.filter(q => q.status === 'accepted').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: 'hsl(var(--primary))' }}>94%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1">
                <div className="text-2xl font-bold" style={{ color: 'hsl(var(--primary))' }}>4.8</div>
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quote Requests */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Quote Requests
              </CardTitle>
              <div className="flex items-center gap-3">
                {isSelecting && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const allIds = quoteRequests.map(q => q.id);
                      setSelectedQuotes(selectedQuotes.length === allIds.length ? [] : allIds);
                    }}
                    className="text-primary hover:text-primary/80"
                  >
                    {selectedQuotes.length === quoteRequests.length ? "Deselect All" : "Select All"}
                  </Button>
                )}
                {isSelecting && selectedQuotes.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSelected}
                    className="text-white bg-destructive border-destructive hover:bg-destructive/90"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete Selected ({selectedQuotes.length})
                  </Button>
                )}
                <Button
                  variant={isSelecting ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => {
                    setIsSelecting(!isSelecting);
                    setSelectedQuotes([]);
                  }}
                  className={isSelecting ? "text-white bg-red-600 border-red-600 hover:bg-red-700" : ""}
                >
                  {isSelecting ? "Cancel" : "Select Multiple"}
                </Button>
              </div>
            </div>
            <CardDescription>
              Manage incoming project requests and send quotes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : quoteRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No quote requests yet. Keep your profile updated to receive more opportunities!
              </div>
            ) : (
              <div className="space-y-4">
                {quoteRequests.map((quote) => (
                  <Card key={quote.id} className={`hover:shadow-lg transition-shadow ${isSelecting && selectedQuotes.includes(quote.id) ? 'ring-2 ring-destructive' : ''}`}>
                    <CardContent className="p-6">
                      {isSelecting && (
                        <div className="flex items-center mb-4">
                          <input
                            type="checkbox"
                            checked={selectedQuotes.includes(quote.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedQuotes([...selectedQuotes, quote.id]);
                              } else {
                                setSelectedQuotes(selectedQuotes.filter(id => id !== quote.id));
                              }
                            }}
                            className="h-5 w-5 text-primary border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-primary cursor-pointer"
                            id={`vendor-select-${quote.id}`}
                          />
                          <label 
                            htmlFor={`vendor-select-${quote.id}`}
                            className="ml-3 text-sm font-medium text-gray-700 cursor-pointer select-none min-h-[44px] flex items-center"
                          >
                            Select for deletion
                          </label>
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{formatClientName(quote.client.full_name)}</h3>
                            <Badge variant={getStatusBadgeVariant(quote.status)}>
                              {quote.status}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm mb-2">
                            {quote.project.title}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {quote.project.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Euro className="w-4 h-4" />
                              {quote.project.budget_range}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDate(quote.created_at)}
                            </span>
                            <span className="flex items-center gap-1 text-orange-600 font-medium">
                              <div className="flex items-center justify-center w-4 h-4 bg-orange-100 rounded-sm">
                                <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                              </div>
                              {(quote.project as any).timeline}
                            </span>
                            {quote.project.location && (
                              <span>{quote.project.location}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <Button 
                            variant="modern" 
                            size="sm"
                            onClick={() => handleChat(quote.id, quote.project.title, quote.client.user_id, user?.id || '')}
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Chat
                          </Button>
                          {quote.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="modern"
                              onClick={() => handleSendQuote(quote.id, quote.project.title)}
                            >
                              <Euro className="w-4 h-4 mr-1" />
                              Send Quote
                            </Button>
                          )}
                          {quote.status === 'quoted' && (
                            <Button 
                              size="sm" 
                              variant="modern"
                              onClick={() => handleSendQuote(quote.id, quote.project.title)}
                            >
                              <Euro className="w-4 h-4 mr-1" />
                              Update Quote
                            </Button>
                          )}
                          {quote.status === 'accepted' && (
                            <Button 
                              size="sm" 
                              variant="modern"
                              onClick={() => setCreateInvoiceModal({ isOpen: true, quoteRequestId: quote.id })}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Euro className="w-4 h-4 mr-1" />
                              Invoice
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewTicket(quote)}
                            className="flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoices Section */}
        <div className="mt-8">
          <InvoiceList userRole="vendor" userId={user?.id || ''} />
        </div>

        {/* Modals */}
        <EnhancedSendQuoteModal
          isOpen={sendQuoteModal.isOpen}
          onClose={() => setSendQuoteModal({ isOpen: false, quoteRequestId: '', projectTitle: '' })}
          quoteRequestId={sendQuoteModal.quoteRequestId}
          projectTitle={sendQuoteModal.projectTitle}
          onQuoteSent={handleQuoteSent}
        />

        <EnhancedChatModal
          isOpen={chatModal.isOpen}
          onClose={() => setChatModal({ isOpen: false, quoteRequestId: '', projectTitle: '', clientId: '', vendorId: '' })}
          quoteRequestId={chatModal.quoteRequestId}
          projectTitle={chatModal.projectTitle}
          clientId={chatModal.clientId}
          vendorId={chatModal.vendorId}
        />

        <CreateInvoiceModal
          isOpen={createInvoiceModal.isOpen}
          onClose={() => setCreateInvoiceModal({ isOpen: false, quoteRequestId: '' })}
          quoteRequestId={createInvoiceModal.quoteRequestId}
          onInvoiceCreated={fetchQuoteRequests}
        />

        <TicketDetailsModal
          ticket={selectedTicket}
          isOpen={ticketDetailsOpen}
          onClose={() => {
            setTicketDetailsOpen(false);
            setSelectedTicket(null);
          }}
          userRole="vendor"
        />
      </div>
    </div>
  );
};

export default VendorDashboard;