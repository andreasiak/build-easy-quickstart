import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import MultiSelectDropdown from '@/components/MultiSelectDropdown';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Building, Upload, Plus, Trash2, Save, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { validateInput, sanitizeInput, logSecurityEvent } from '@/utils/security';
import BusinessPortfolio from '@/components/BusinessPortfolio';
import StripeConnectButton from '@/components/invoice/StripeConnectButton';

interface VendorProfile {
  business_name: string;
  vat_id: string;
  business_address: string;
  location: string;
  website: string;
  phone: string;
  email: string;
  vendor_category: string;
  price_range_min: number;
  price_range_max: number;
  year_established: number;
  insurance_coverage: boolean;
  insurance_provider: string;
  service_radius: string;
  team_size: number;
  licenses_certifications: Array<{ name: string; issuer: string; year: number; etek_registered?: boolean }>;
  portfolio_images: Array<{ url: string; caption: string }>;
  about_business: string;
}

const VENDOR_CATEGORIES = [
  'General Contractor',
  'Architect',
  'Interior Designer',
  'Landscape Designer',
  'Electrician',
  'Plumber',
  'HVAC Specialist',
  'Roofing Contractor',
  'Flooring Specialist',
  'Painter',
  'Kitchen Designer',
  'Bathroom Designer',
  'Custom Carpenter',
  'Structural Engineer',
  'Project Manager'
];

const BusinessInformation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<VendorProfile>({
    business_name: '',
    vat_id: '',
    business_address: '',
    location: '',
    website: '',
    phone: '',
    email: '',
    vendor_category: '',
    price_range_min: 0,
    price_range_max: 0,
    year_established: new Date().getFullYear(),
    insurance_coverage: false,
    insurance_provider: '',
    service_radius: '',
    team_size: 1,
    licenses_certifications: [],
    portfolio_images: [],
    about_business: ''
  });
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [portfolioImages, setPortfolioImages] = useState<{ [category: string]: Array<{ url: string; caption: string; category: string }> }>({});

  useEffect(() => {
    fetchVendorProfile();
  }, [user]);

  const fetchVendorProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        const categories = data.vendor_category ? data.vendor_category.split(',') : [];
        setSelectedCategories(categories);
        
        setFormData({
          business_name: data.business_name || '',
          vat_id: data.vat_id || '',
          business_address: data.business_address || '',
          location: data.location || '',
          website: data.website || '',
          phone: data.phone || '',
          email: data.email || user.email || '',
          vendor_category: data.vendor_category || '',
          price_range_min: data.price_range_min || 0,
          price_range_max: data.price_range_max || 0,
          year_established: data.year_established || new Date().getFullYear(),
          insurance_coverage: data.insurance_coverage || false,
          insurance_provider: data.insurance_provider || '',
          service_radius: data.service_radius || '',
          team_size: data.team_size || 1,
          licenses_certifications: (data.licenses_certifications as Array<{ name: string; issuer: string; year: number }>) || [],
          portfolio_images: (data.portfolio_images as Array<{ url: string; caption: string }>) || [],
          about_business: data.about_business || ''
        });
        
        // Organize portfolio images by category
        const organizedImages: { [category: string]: Array<{ url: string; caption: string; category: string }> } = {};
        categories.forEach(cat => {
          organizedImages[cat] = [];
        });
        setPortfolioImages(organizedImages);
      } else {
        // Initialize with user email if no profile exists
        setFormData(prev => ({
          ...prev,
          email: user.email || ''
        }));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load business information",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isDraft) {
      // Validate required fields for final save
      const requiredFields = ['business_name', 'business_address', 'location', 'phone', 'email', 'vendor_category'];
      for (const field of requiredFields) {
        if (!formData[field as keyof VendorProfile]) {
          toast({
            title: 'Error',
            description: `${field.replace('_', ' ')} is required`,
            variant: 'destructive'
          });
          return;
        }
      }
    }

    // Validate inputs
    const fieldsToValidate = [
      { value: formData.business_name, maxLength: 200 },
      { value: formData.business_address, maxLength: 500 },
      { value: formData.location, maxLength: 100 },
      { value: formData.phone, maxLength: 20 },
      { value: formData.email, maxLength: 100 },
      { value: formData.website, maxLength: 200 },
      { value: formData.about_business, maxLength: 2000 }
    ];

    for (const field of fieldsToValidate) {
      if (field.value && !validateInput(field.value, field.maxLength)) {
        toast({
          title: 'Error',
          description: 'Please check all fields for valid input',
          variant: 'destructive'
        });
        return;
      }
    }

    setSaving(true);
    try {
      const updateData = {
        user_id: user?.id,
        business_name: sanitizeInput(formData.business_name),
        vat_id: sanitizeInput(formData.vat_id),
        business_address: sanitizeInput(formData.business_address),
        location: sanitizeInput(formData.location),
        website: sanitizeInput(formData.website),
        phone: sanitizeInput(formData.phone),
        email: sanitizeInput(formData.email),
        vendor_category: selectedCategories.join(','), // Store as comma-separated string
        price_range_min: formData.price_range_min || null,
        price_range_max: formData.price_range_max || null,
        year_established: formData.year_established,
        insurance_coverage: formData.insurance_coverage,
        insurance_provider: sanitizeInput(formData.insurance_provider),
        service_radius: sanitizeInput(formData.service_radius),
        team_size: formData.team_size || null,
        licenses_certifications: formData.licenses_certifications,
        portfolio_images: formData.portfolio_images,
        about_business: sanitizeInput(formData.about_business),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('vendor_profiles')
        .upsert(updateData, {
          onConflict: 'user_id'
        });

      if (error) {
        await logSecurityEvent('business_info_save_failed', 'vendor_profiles', null, {
          error: error.message
        });
        throw error;
      }

      await logSecurityEvent('business_info_saved', 'vendor_profiles', null, {
        is_draft: isDraft
      });

      toast({
        title: isDraft ? "Draft Saved" : "Business Information Updated",
        description: isDraft ? "Your changes have been saved as draft" : "Your business information has been updated successfully.",
      });

      if (!isDraft) {
        navigate('/tickets');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save business information",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addLicense = () => {
    setFormData(prev => ({
      ...prev,
      licenses_certifications: [...prev.licenses_certifications, { name: '', issuer: '', year: new Date().getFullYear(), etek_registered: false }]
    }));
  };

  const removeLicense = (index: number) => {
    setFormData(prev => ({
      ...prev,
      licenses_certifications: prev.licenses_certifications.filter((_, i) => i !== index)
    }));
  };

  const updateLicense = (index: number, field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      licenses_certifications: prev.licenses_certifications.map((license, i) => 
        i === index ? { ...license, [field]: value } : license
      )
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Loading business information...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Business Information</h1>
              <p className="text-muted-foreground">Manage your business profile and company details</p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link to="/tickets">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
          {/* Basic Business Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Essential business details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business_name">Business Name *</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                    placeholder="Your Company Ltd"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vat_id">VAT ID</Label>
                  <Input
                    id="vat_id"
                    value={formData.vat_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, vat_id: e.target.value }))}
                    placeholder="GB123456789"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="business_address">Business Address *</Label>
                <Textarea
                  id="business_address"
                  value={formData.business_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, business_address: e.target.value }))}
                  placeholder="123 Business Street, City, Postcode"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">City/Region *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="London, UK"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://yourcompany.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+44 20 1234 5678"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@yourcompany.com"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card>
            <CardHeader>
              <CardTitle>Business Details</CardTitle>
              <CardDescription>Professional information and specializations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vendor_category">Vendor Categories *</Label>
                  <MultiSelectDropdown
                    options={VENDOR_CATEGORIES}
                    selected={selectedCategories}
                    onSelectionChange={(newCategories) => {
                      setSelectedCategories(newCategories);
                      setFormData(prev => ({ ...prev, vendor_category: newCategories.join(',') }));
                    }}
                    placeholder="Select categories..."
                    maxDisplay={2}
                  />
                </div>
                <div>
                  <Label htmlFor="year_established">Year Established *</Label>
                  <Input
                    id="year_established"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={formData.year_established}
                    onChange={(e) => setFormData(prev => ({ ...prev, year_established: parseInt(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_range_min">Price Range Min (£)</Label>
                  <Input
                    id="price_range_min"
                    type="number"
                    min="0"
                    value={formData.price_range_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_range_min: parseFloat(e.target.value) || 0 }))}
                    placeholder="5000"
                  />
                </div>
                <div>
                  <Label htmlFor="price_range_max">Price Range Max (£)</Label>
                  <Input
                    id="price_range_max"
                    type="number"
                    min="0"
                    value={formData.price_range_max}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_range_max: parseFloat(e.target.value) || 0 }))}
                    placeholder="50000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service_radius">Service Radius</Label>
                  <Input
                    id="service_radius"
                    value={formData.service_radius}
                    onChange={(e) => setFormData(prev => ({ ...prev, service_radius: e.target.value }))}
                    placeholder="50km or Greater London"
                  />
                </div>
                <div>
                  <Label htmlFor="team_size">Team Size</Label>
                  <Input
                    id="team_size"
                    type="number"
                    min="1"
                    value={formData.team_size}
                    onChange={(e) => setFormData(prev => ({ ...prev, team_size: parseInt(e.target.value) || 1 }))}
                    placeholder="5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="about_business">About the Business</Label>
                <Textarea
                  id="about_business"
                  value={formData.about_business}
                  onChange={(e) => setFormData(prev => ({ ...prev, about_business: e.target.value }))}
                  placeholder="Tell clients about your business, expertise, and what sets you apart..."
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Insurance Information */}
          <Card>
            <CardHeader>
              <CardTitle>Insurance Coverage</CardTitle>
              <CardDescription>Professional insurance details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="insurance_coverage"
                  checked={formData.insurance_coverage}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, insurance_coverage: !!checked }))}
                />
                <Label htmlFor="insurance_coverage">We have professional insurance coverage</Label>
              </div>

              {formData.insurance_coverage && (
                <div>
                  <Label htmlFor="insurance_provider">Insurance Provider</Label>
                  <Input
                    id="insurance_provider"
                    value={formData.insurance_provider}
                    onChange={(e) => setFormData(prev => ({ ...prev, insurance_provider: e.target.value }))}
                    placeholder="Insurance Company Name"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Business Portfolio */}
          <Card>
            <CardHeader>
              <CardTitle>Business Portfolio</CardTitle>
              <CardDescription>Upload images to showcase your work by category</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedCategories.length > 0 ? (
                selectedCategories.map((category) => (
                  <div key={category} className="space-y-3 p-4 border rounded-lg">
                    <h4 className="font-semibold">{category}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {portfolioImages[category]?.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image.url}
                            alt={image.caption}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                            onClick={() => {
                              const newImages = { ...portfolioImages };
                              newImages[category] = newImages[category].filter((_, i) => i !== index);
                              setPortfolioImages(newImages);
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      )) || []}
                      <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 h-24 flex items-center justify-center">
                        <div>
                          <Upload className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                          <span className="text-xs text-gray-500">Add Image</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // For demo purposes, using a placeholder URL
                              // In real implementation, upload to Supabase storage
                              const newImages = { ...portfolioImages };
                              if (!newImages[category]) newImages[category] = [];
                              newImages[category].push({
                                url: URL.createObjectURL(file),
                                caption: file.name,
                                category: category
                              });
                              setPortfolioImages(newImages);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Please select vendor categories above to add portfolio images for each category.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Licenses & Certifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Licenses & Certifications
                <Button type="button" variant="outline" size="sm" onClick={addLicense}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add License
                </Button>
              </CardTitle>
              <CardDescription>Professional licenses and certifications. Check ETEK for members of the <a href="https://www.etek.org.cy" target="_blank" className="text-primary hover:underline">Cyprus Board of Engineers</a></CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.licenses_certifications.map((license, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label>License/Certification Name</Label>
                    <Input
                      value={license.name}
                      onChange={(e) => updateLicense(index, 'name', e.target.value)}
                      placeholder="e.g., Licensed Electrician"
                    />
                  </div>
                  <div>
                    <Label>Issuing Authority</Label>
                    <Input
                      value={license.issuer}
                      onChange={(e) => updateLicense(index, 'issuer', e.target.value)}
                      placeholder="e.g., City Council"
                    />
                  </div>
                  <div>
                    <Label>Year Obtained</Label>
                    <Input
                      type="number"
                      min="1980"
                      max={new Date().getFullYear()}
                      value={license.year}
                      onChange={(e) => updateLicense(index, 'year', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="flex flex-col justify-start gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`etek-${index}`}
                        checked={license.etek_registered || false}
                        onCheckedChange={(checked) => updateLicense(index, 'etek_registered', checked as boolean)}
                      />
                      <Label htmlFor={`etek-${index}`} className="text-sm">
                        ETEK Registered
                      </Label>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => removeLicense(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {formData.licenses_certifications.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No licenses or certifications added yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Business Portfolio */}
          <BusinessPortfolio 
            selectedCategories={selectedCategories}
            portfolioImages={portfolioImages}
            onPortfolioUpdate={setPortfolioImages}
          />

          {/* Stripe Connect Payment Setup */}
          <StripeConnectButton onComplete={fetchVendorProfile} />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={(e) => handleSubmit(e as any, true)} disabled={saving}>
              Save Draft
            </Button>
            <Button type="submit" disabled={saving} className="bg-gradient-primary">
              {saving ? 'Saving...' : 'Save Business Information'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BusinessInformation;