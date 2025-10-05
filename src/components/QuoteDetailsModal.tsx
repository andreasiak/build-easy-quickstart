import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import NegotiateQuoteModal from './NegotiateQuoteModal';
import QuotesArchive from './QuotesArchive';

import { 
  Euro, 
  Calendar, 
  Clock, 
  FileText, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  MessageSquare,
  Star,
  Trash2,
  Archive,
  AlertCircle,
  Eye
} from 'lucide-react';

interface QuoteDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteRequestId: string;
  onQuoteAction?: (action: 'accept' | 'decline' | 'review' | 'cancel') => void;
}

interface QuoteDetails {
  quote_id: string;
  total_amount: number;
  estimated_timeline: string;
  cost_breakdown: any;
  start_date: string;
  duration_weeks: number;
  milestones: any;
  payment_schedule: any;
  validity_date: string;
  site_visit_required: boolean;
  proposed_visit_dates: any;
  insurance_will_be_used: boolean;
  insurance_provider_used: string;
  inclusions: string[];
  exclusions: string[];
  assumptions_dependencies: string;
  notes_to_client: string;
  vendor_notes: string;
  portfolio_references: any;
  created_at: string;
  vendor_business_name: string;
  vendor_rating: number;
}

const QuoteDetailsModal: React.FC<QuoteDetailsModalProps> = ({
  isOpen,
  onClose,
  quoteRequestId,
  onQuoteAction
}) => {
  const [quoteDetails, setQuoteDetails] = useState<QuoteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showNegotiateModal, setShowNegotiateModal] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showPortfolioWarning, setShowPortfolioWarning] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [isQuoteAccepted, setIsQuoteAccepted] = useState(false);

  useEffect(() => {
    if (isOpen && quoteRequestId) {
      fetchQuoteDetails();
    }
  }, [isOpen, quoteRequestId]);

  const fetchQuoteDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_client_quote_details', {
        quote_request_id_param: quoteRequestId
      });

      if (error) throw error;
      if (data && data.length > 0) {
        setQuoteDetails(data[0]);
      }

      // Check if quote is accepted
      const { data: quoteRequestData } = await supabase
        .from('quote_requests')
        .select('status')
        .eq('id', quoteRequestId)
        .single();
      
      if (quoteRequestData?.status === 'accepted') {
        setIsQuoteAccepted(true);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load quote details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteAction = async (action: 'accept' | 'decline' | 'review' | 'cancel') => {
    if (!quoteDetails) return;

    try {
      if (action === 'cancel') {
        const { error } = await supabase
          .from('quote_requests')
          .update({ 
            status: 'declined',
            deletion_reason: 'Cancelled by client',
            deleted_at: new Date().toISOString()
          })
          .eq('id', quoteRequestId);

        if (error) throw error;

        toast({
          title: 'Quote Cancelled',
          description: 'The quote has been cancelled and moved to archive',
        });
      } else if (action === 'review') {
        if (!reviewNotes.trim()) {
          toast({
            title: 'Error',
            description: 'Please provide review notes',
            variant: 'destructive',
          });
          return;
        }

        // Create quote review entry
        const { error: reviewError } = await supabase
          .from('quote_reviews')
          .insert({
            quote_id: quoteDetails.quote_id,
            reviewer_id: (await supabase.auth.getUser()).data.user?.id,
            review_type: 'revision_request',
            review_notes: reviewNotes
          });

        if (reviewError) throw reviewError;

        toast({
          title: 'Review Sent',
          description: 'Your review has been sent to the vendor for consideration',
        });
      } else {
        // Update quote request status
        const { error } = await supabase
          .from('quote_requests')
          .update({ status: action === 'accept' ? 'accepted' : 'declined' })
          .eq('id', quoteRequestId);

        if (error) throw error;

        if (action === 'accept') {
          toast({
            title: 'Quote Accepted',
            description: 'Creating invoice for digital signature and payment...',
          });
          setIsQuoteAccepted(true);
          // Open invoice modal for e-signature process
          setShowInvoiceModal(true);
        } else {
          toast({
            title: 'Quote Declined',
            description: 'You have declined this quote',
          });
        }
      }

      onQuoteAction?.(action);
      if (action !== 'cancel') onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to ${action} quote`,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteQuote = async () => {
    try {
      const { error } = await supabase
        .from('quote_requests')
        .update({ 
          status: 'declined',
          deletion_reason: 'Deleted by client',
          deleted_at: new Date().toISOString()
        })
        .eq('id', quoteRequestId);

      if (error) throw error;

      toast({
        title: 'Quote Deleted',
        description: 'The quote has been deleted successfully',
      });

      onQuoteAction?.('cancel');
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete quote',
        variant: 'destructive',
      });
    }
  };

  const handlePortfolioClick = () => {
    // Check if vendor has portfolio for this category
    // For now, show warning - this should be enhanced to check actual portfolio
    setShowPortfolioWarning(true);
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!quoteDetails) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="text-center py-8">
            <p className="text-muted-foreground">No quote details available</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[85vw] max-w-[85vw] h-[85vh] max-h-[85vh] overflow-hidden bg-background/95 backdrop-blur-lg border border-border/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" />
            Quote Details from {quoteDetails.vendor_business_name}
            {quoteDetails.vendor_rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-muted-foreground">{quoteDetails.vendor_rating}</span>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Quote Summary */}
            <div className="bg-gradient-primary/10 p-6 rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Quote Summary</h3>
                <Badge variant="secondary">
                  Created {new Date(quoteDetails.created_at).toLocaleDateString()}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
                    <Euro className="w-6 h-6" />
                    {quoteDetails.total_amount.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold flex items-center justify-center gap-2">
                    <Clock className="w-5 h-5" />
                    {quoteDetails.estimated_timeline || `${quoteDetails.duration_weeks} weeks`}
                  </div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold flex items-center justify-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {quoteDetails.start_date ? new Date(quoteDetails.start_date).toLocaleDateString() : 'TBD'}
                  </div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            {quoteDetails.cost_breakdown && Array.isArray(quoteDetails.cost_breakdown) && quoteDetails.cost_breakdown.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Cost Breakdown</h3>
                <div className="space-y-2">
                  {(Array.isArray(quoteDetails.cost_breakdown) ? quoteDetails.cost_breakdown : []).map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded">
                      <span>{item.description || item.item}</span>
                      <span className="font-medium">€{item.amount || item.cost}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Included Services
                </h3>
                <ul className="space-y-2">
                  {quoteDetails.inclusions?.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  )) || <p className="text-muted-foreground text-sm">No specific inclusions listed</p>}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  Excluded Services
                </h3>
                <ul className="space-y-2">
                  {quoteDetails.exclusions?.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  )) || <p className="text-muted-foreground text-sm">No specific exclusions listed</p>}
                </ul>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              {quoteDetails.notes_to_client && (
                <div>
                  <h3 className="font-semibold mb-2">Notes from Vendor</h3>
                  <p className="text-sm bg-muted/50 p-3 rounded">{quoteDetails.notes_to_client}</p>
                </div>
              )}

              {quoteDetails.assumptions_dependencies && (
                <div>
                  <h3 className="font-semibold mb-2">Assumptions & Dependencies</h3>
                  <p className="text-sm bg-muted/50 p-3 rounded">{quoteDetails.assumptions_dependencies}</p>
                </div>
              )}

              {quoteDetails.site_visit_required && (
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span>Site visit required</span>
                  {quoteDetails.proposed_visit_dates && Array.isArray(quoteDetails.proposed_visit_dates) && quoteDetails.proposed_visit_dates.length > 0 && (
                    <span className="text-muted-foreground">
                      (Proposed dates: {quoteDetails.proposed_visit_dates.join(', ')})
                    </span>
                  )}
                </div>
              )}

              {quoteDetails.insurance_will_be_used && (
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Insurance coverage included</span>
                  {quoteDetails.insurance_provider_used && (
                    <span className="text-muted-foreground">({quoteDetails.insurance_provider_used})</span>
                  )}
                </div>
              )}
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Request Quote Revision</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reviewNotes">Review Notes</Label>
                    <Textarea
                      id="reviewNotes"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Please provide specific feedback on what you'd like revised..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-between pt-4 border-t">
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button 
              variant="outline" 
              onClick={handlePortfolioClick}
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              Portfolio
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowArchive(true)}
              className="text-gray-600 border-gray-600 hover:bg-gray-50"
            >
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteQuote}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Quote
            </Button>
            {isQuoteAccepted && (
              <Button 
                variant="outline" 
                onClick={() => setShowInvoiceModal(true)}
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <FileText className="w-4 h-4 mr-2" />
                View Invoice
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            {!isQuoteAccepted && !showReviewForm ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setShowReviewForm(true)}
                  className="text-orange-600 border-orange-600 hover:bg-orange-50"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Request Review
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowNegotiateModal(true)}
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  Negotiate
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleQuoteAction('cancel')}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cancel Quote
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => handleQuoteAction('decline')}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Decline Quote
                </Button>
                <Button 
                  onClick={() => handleQuoteAction('accept')}
                  className="bg-gradient-primary"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Accept Quote
                </Button>
              </>
            ) : isQuoteAccepted ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Quote Accepted - Invoice Available</span>
              </div>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowReviewForm(false);
                    setReviewNotes('');
                  }}
                >
                  Cancel Review
                </Button>
                <Button 
                  onClick={() => handleQuoteAction('review')}
                  className="bg-gradient-primary"
                >
                  Send Review Request
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Modals */}
        {quoteDetails && (
          <NegotiateQuoteModal
            isOpen={showNegotiateModal}
            onClose={() => setShowNegotiateModal(false)}
            quoteDetails={{
              quote_id: quoteDetails.quote_id,
              total_amount: quoteDetails.total_amount,
              duration_weeks: quoteDetails.duration_weeks,
              start_date: quoteDetails.start_date,
              vendor_business_name: quoteDetails.vendor_business_name,
              project_title: "Project" // This should come from props
            }}
            onNegotiate={() => {
              onQuoteAction?.('review');
              setShowNegotiateModal(false);
            }}
          />
        )}

        <QuotesArchive
          isOpen={showArchive}
          onClose={() => setShowArchive(false)}
        />


        {/* Portfolio Warning Dialog */}
        <Dialog open={showPortfolioWarning} onOpenChange={setShowPortfolioWarning}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Portfolio Not Available
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The vendor hasn't uploaded portfolio images for this category yet. 
                You can request to see previous work examples through a direct message.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowPortfolioWarning(false)}>
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setShowPortfolioWarning(false);
                    // This should open chat modal
                    toast({
                      title: "Chat Feature",
                      description: "Chat functionality will be implemented here",
                    });
                  }}
                  className="bg-gradient-primary"
                >
                  Send Message
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteDetailsModal;