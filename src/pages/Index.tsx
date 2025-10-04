import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import EnhancedQuestionnaireForm from '@/components/EnhancedQuestionnaireForm';
import ServiceGroups from '@/components/ServiceGroups';
import { AuthButton } from '@/components/AuthButton';
import { LoginModal } from '@/components/LoginModal';
import { SignupModal } from '@/components/SignupModal';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useQuoteForm } from '@/contexts/QuoteFormContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Sparkles, Home, Users, Zap, ChevronRight } from 'lucide-react';
import { getRandomExamples } from '@/data/projectExamples';
import { TypingAnimation } from '@/components/TypingAnimation';
import { formatBudgetRange, formatTimeline, formatLocation } from '@/utils/formatters';
import HowItWorks from '@/components/HowItWorks';
const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    currentStep, 
    setCurrentStep, 
    projectData, 
    setProjectData, 
    selectedTickets, 
    setSelectedTickets,
    setWasRedirectedFromAuth,
    setRedirectPath
  } = useQuoteForm();
  const [animatedText, setAnimatedText] = useState('Modern family house');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [currentExamples, setCurrentExamples] = useState(() => getRandomExamples(3));

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExamples(getRandomExamples(3));
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedText(getRandomExamples(1)[0]);
    }, 7000);

    return () => clearInterval(interval);
  }, []);
  const handleProjectSubmit = () => {
    if (projectData.description.trim()) {
      setCurrentStep('questionnaire');
    }
  };
  const handleQuestionnaireComplete = (data: any) => {
    setProjectData({
      ...projectData,
      formData: data,
      serviceGroups: data.serviceGroups
    });
    setCurrentStep('services');
  };
  const handleVendorSelect = async (groupName: string, vendor: any) => {
    // Check if user is authenticated before allowing vendor selection
    if (!user) {
      // Store current progress and show auth modal
      setWasRedirectedFromAuth(true);
      setRedirectPath('/');
      setShowLoginModal(true);
      return;
    }

    try {
      // First, create or get the project
      let projectId = projectData.id;
      
      if (!projectId) {
        // Format budget range from form data
        const budgetRange = formatBudgetRange(projectData.formData?.budget);
        const timeline = formatTimeline(projectData.formData?.deliveryTime);
        const location = formatLocation(projectData.formData?.buildLocation);

        const { data: project, error: projectError } = await supabase
          .from('projects')
          .insert({
            client_id: user.id,
            title: projectData.description.substring(0, 100),
            description: projectData.description,
            budget_range: budgetRange,
            timeline: timeline,
            location: location,
            service_groups: projectData.serviceGroups,
            form_data: projectData.formData,
            status: 'active'
          })
          .select()
          .single();

        if (projectError) throw projectError;
        
        projectId = project.id;
        setProjectData({
          ...projectData,
          id: projectId
        });
      }

      // Create the quote request
      const { data: quoteRequest, error: quoteError } = await supabase
        .from('quote_requests')
        .insert({
          project_id: projectId,
          client_id: user.id,
          vendor_id: vendor.id,
          status: 'pending'
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Create local ticket for immediate UI update
      const ticket = {
        id: quoteRequest.id,
        groupName,
        vendor,
        projectDescription: projectData.description,
        formData: projectData.formData,
        status: 'pending' as const,
        createdAt: new Date()
      };
      
      setSelectedTickets([...selectedTickets, ticket]);
      
      toast({
        title: "Quote Request Sent",
        description: `Your request has been sent to ${vendor.name}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send quote request",
        variant: "destructive",
      });
    }
  };
  const handleStartOver = () => {
    setCurrentStep('initial');
    setProjectData({
      description: ''
    });
    setSelectedTickets([]);
  };
  if (currentStep === 'questionnaire') {
    return <div className="min-h-screen bg-gradient-hero py-12 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Button variant="ghost" onClick={handleStartOver} className="mb-4">
              ← Back to Start
            </Button>
            <h1 className="text-3xl font-bold mb-4">Let's Get More Details</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our AI needs a few more details to match you with the perfect professionals for: 
              <span className="italic block mt-2 text-foreground">"{projectData.description}"</span>
            </p>
          </div>
          
          <EnhancedQuestionnaireForm projectDescription={projectData.description} onComplete={handleQuestionnaireComplete} />
        </div>
      </div>;
  }
  if (currentStep === 'services') {
    return <div className="min-h-screen bg-background py-12 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <Button variant="ghost" onClick={handleStartOver} className="mb-4">
              ← Start New Project
            </Button>
          </div>
          
          <ServiceGroups 
            serviceGroups={projectData.serviceGroups || []} 
            onVendorSelect={handleVendorSelect}
            projectDescription={projectData.description}
            formData={projectData.formData}
          />
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-8 pb-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Header with Auth Buttons */}
          <div className="flex items-center justify-between w-full mb-16">
            <div className="flex items-center space-x-2">
              <img 
                src="/buildeasy-logo.png" 
                alt="BuildEasy Logo"
                className="h-32 w-auto object-contain cursor-pointer hover:scale-105 transition-transform" 
                onClick={() => navigate('/')}
              />
            </div>
            
            {/* Split Login/Signup Buttons */}
            {!user ? (
              <div className="flex items-center gap-3">
                <Button onClick={() => setShowLoginModal(true)} variant="outline" size="default">
                  Login
                </Button>
                <Button onClick={() => setShowSignupModal(true)} variant="modern" size="default">
                  Sign Up
                </Button>
              </div>
            ) : (
              <AuthButton />
            )}
          </div>

          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                <TypingAnimation text="Build anything" duration={2000} />
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Write your idea, we'll connect you with the right builders fast.
            </p>
          </div>

          {/* Main Input Area */}
          <Card className="max-w-3xl mx-auto shadow-elegant bg-transparent backdrop-blur-sm border border-white/20">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Textarea 
                    placeholder={`I want a ${animatedText}...`}
                    value={projectData.description} 
                    onChange={e => setProjectData({
                      ...projectData,
                      description: e.target.value
                    })} 
                    className="min-h-[120px] text-lg resize-none border-2 focus:border-primary" 
                  />
                </div>
                
                {/* Example Projects - moved here */}
                  <div className="text-center">
                  <h2 className="text-lg font-semibold mb-3">Try these examples:</h2>
                  <div className="flex flex-wrap justify-center gap-2">
                    {currentExamples.map((example, index) => (
                      <Button 
                        key={`${example}-${index}`} 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setProjectData({
                          ...projectData,
                          description: example
                        })} 
                        className="text-xs hover:border-primary hover:text-primary"
                      >
                        {example}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button onClick={handleProjectSubmit} disabled={!projectData.description.trim()} variant="modern" size="xl" className="px-16 py-4 text-xl">
                    Build My Project
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How It Works Section */}
          <div className="mt-8">
            <HowItWorks />
          </div>

          {/* Feature Cards - Removed per requirements */}

        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Auth Modals */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setShowLoginModal(false);
          // Continue with the vendor selection process
        }}
        onSwitchToSignup={() => {
          setShowLoginModal(false);
          setShowSignupModal(true);
        }}
      />
      
      <SignupModal 
        isOpen={showSignupModal} 
        onClose={() => setShowSignupModal(false)}
        onSuccess={() => {
          setShowSignupModal(false);
        }}
        onSwitchToLogin={() => {
          setShowSignupModal(false);
          setShowLoginModal(true);
        }}
      />
    </div>;
};
export default Index;