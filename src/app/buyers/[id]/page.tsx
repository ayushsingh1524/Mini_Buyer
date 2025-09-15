'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateBuyerSchema, UpdateBuyerInput } from '@/lib/validations/buyer';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, Save, History, Edit, Eye } from 'lucide-react';
import Link from 'next/link';

interface Buyer {
  id: string;
  fullName: string;
  email?: string;
  phone: string;
  city: string;
  propertyType: string;
  bhk?: string;
  purpose: string;
  budgetMin?: number;
  budgetMax?: number;
  timeline: string;
  source: string;
  status: string;
  notes?: string;
  tags?: string[];
  updatedAt: string;
}

interface HistoryEntry {
  id: string;
  changedBy: string;
  changedAt: string;
  diff: Record<string, { old: any; new: any }>;
}

export default function BuyerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UpdateBuyerInput>({
    resolver: zodResolver(updateBuyerSchema),
  });

  const propertyType = watch('propertyType');
  const budgetMin = watch('budgetMin');
  const budgetMax = watch('budgetMax');

  useEffect(() => {
    fetchBuyer();
  }, [params.id]);

  const fetchBuyer = async () => {
    try {
      const response = await fetch(`/api/buyers/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setBuyer(data.buyer);
        setHistory(data.history);
        reset({
          ...data.buyer,
          updatedAt: new Date(data.buyer.updatedAt),
        });
      } else {
        setError('Buyer not found');
      }
    } catch (err) {
      setError('Failed to fetch buyer');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: UpdateBuyerInput) => {
    setIsSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/buyers/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updatedBuyer = await response.json();
        setBuyer(updatedBuyer);
        setIsEditing(false);
        fetchBuyer(); // Refresh to get updated history
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update buyer');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this buyer?')) return;

    try {
      const response = await fetch(`/api/buyers/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/buyers');
      } else {
        setError('Failed to delete buyer');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!buyer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Buyer Not Found</h1>
          <Link href="/buyers">
            <Button>Back to Leads</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/buyers" className="mr-4">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Leads
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                {buyer.fullName}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <Eye className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                {isEditing ? 'View' : 'Edit'}
              </Button>
              {isEditing && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                    {error}
                  </div>
                )}

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      {...register('fullName')}
                      className="mt-1"
                      disabled={!isEditing}
                    />
                    {errors.fullName && (
                      <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      className="mt-1"
                      disabled={!isEditing}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="mt-1"
                    disabled={!isEditing}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                {/* Location and Property */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Select 
                      value={watch('city')} 
                      onValueChange={(value) => setValue('city', value as any)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Chandigarh">Chandigarh</SelectItem>
                        <SelectItem value="Mohali">Mohali</SelectItem>
                        <SelectItem value="Zirakpur">Zirakpur</SelectItem>
                        <SelectItem value="Panchkula">Panchkula</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="propertyType">Property Type *</Label>
                    <Select 
                      value={watch('propertyType')} 
                      onValueChange={(value) => setValue('propertyType', value as any)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Apartment">Apartment</SelectItem>
                        <SelectItem value="Villa">Villa</SelectItem>
                        <SelectItem value="Plot">Plot</SelectItem>
                        <SelectItem value="Office">Office</SelectItem>
                        <SelectItem value="Retail">Retail</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.propertyType && (
                      <p className="text-red-500 text-sm mt-1">{errors.propertyType.message}</p>
                    )}
                  </div>
                </div>

                {/* BHK - only for Apartment and Villa */}
                {(propertyType === 'Apartment' || propertyType === 'Villa') && (
                  <div>
                    <Label htmlFor="bhk">BHK *</Label>
                    <Select 
                      value={watch('bhk')} 
                      onValueChange={(value) => setValue('bhk', value as any)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select BHK" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 BHK</SelectItem>
                        <SelectItem value="2">2 BHK</SelectItem>
                        <SelectItem value="3">3 BHK</SelectItem>
                        <SelectItem value="4">4 BHK</SelectItem>
                        <SelectItem value="Studio">Studio</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.bhk && (
                      <p className="text-red-500 text-sm mt-1">{errors.bhk.message}</p>
                    )}
                  </div>
                )}

                {/* Purpose, Timeline, and Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="purpose">Purpose *</Label>
                    <Select 
                      value={watch('purpose')} 
                      onValueChange={(value) => setValue('purpose', value as any)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select purpose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Buy">Buy</SelectItem>
                        <SelectItem value="Rent">Rent</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.purpose && (
                      <p className="text-red-500 text-sm mt-1">{errors.purpose.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="timeline">Timeline *</Label>
                    <Select 
                      value={watch('timeline')} 
                      onValueChange={(value) => setValue('timeline', value as any)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select timeline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-3m">0-3 months</SelectItem>
                        <SelectItem value="3-6m">3-6 months</SelectItem>
                        <SelectItem value=">6m">>6 months</SelectItem>
                        <SelectItem value="Exploring">Exploring</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.timeline && (
                      <p className="text-red-500 text-sm mt-1">{errors.timeline.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select 
                      value={watch('status')} 
                      onValueChange={(value) => setValue('status', value as any)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Qualified">Qualified</SelectItem>
                        <SelectItem value="Contacted">Contacted</SelectItem>
                        <SelectItem value="Visited">Visited</SelectItem>
                        <SelectItem value="Negotiation">Negotiation</SelectItem>
                        <SelectItem value="Converted">Converted</SelectItem>
                        <SelectItem value="Dropped">Dropped</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status && (
                      <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
                    )}
                  </div>
                </div>

                {/* Budget */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="budgetMin">Minimum Budget (INR)</Label>
                    <Input
                      id="budgetMin"
                      type="number"
                      {...register('budgetMin', { valueAsNumber: true })}
                      className="mt-1"
                      disabled={!isEditing}
                    />
                    {errors.budgetMin && (
                      <p className="text-red-500 text-sm mt-1">{errors.budgetMin.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="budgetMax">Maximum Budget (INR)</Label>
                    <Input
                      id="budgetMax"
                      type="number"
                      {...register('budgetMax', { valueAsNumber: true })}
                      className="mt-1"
                      disabled={!isEditing}
                    />
                    {errors.budgetMax && (
                      <p className="text-red-500 text-sm mt-1">{errors.budgetMax.message}</p>
                    )}
                  </div>
                </div>

                {/* Source */}
                <div>
                  <Label htmlFor="source">Source *</Label>
                  <Select 
                    value={watch('source')} 
                    onValueChange={(value) => setValue('source', value as any)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Website">Website</SelectItem>
                      <SelectItem value="Referral">Referral</SelectItem>
                      <SelectItem value="Walk-in">Walk-in</SelectItem>
                      <SelectItem value="Call">Call</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.source && (
                    <p className="text-red-500 text-sm mt-1">{errors.source.message}</p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    {...register('notes')}
                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    rows={4}
                    disabled={!isEditing}
                  />
                  {errors.notes && (
                    <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    {...register('tags')}
                    className="mt-1"
                    disabled={!isEditing}
                    placeholder="Enter tags separated by commas"
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                      setValue('tags', tags);
                    }}
                  />
                  {errors.tags && (
                    <p className="text-red-500 text-sm mt-1">{errors.tags.message}</p>
                  )}
                </div>

                {/* Submit */}
                {isEditing && (
                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* History Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <History className="h-5 w-5 mr-2" />
                Recent Changes
              </h3>
              
              {history.length === 0 ? (
                <p className="text-gray-500 text-sm">No changes recorded</p>
              ) : (
                <div className="space-y-4">
                  {history.map((entry) => (
                    <div key={entry.id} className="border-l-2 border-gray-200 pl-4">
                      <div className="text-sm text-gray-500">
                        {formatDate(entry.changedAt)}
                      </div>
                      <div className="mt-1 space-y-1">
                        {Object.entries(entry.diff).map(([field, change]) => (
                          <div key={field} className="text-sm">
                            <span className="font-medium">{field}:</span>{' '}
                            <span className="text-red-600 line-through">
                              {change.old === null ? 'null' : String(change.old)}
                            </span>{' '}
                            →{' '}
                            <span className="text-green-600">
                              {change.new === null ? 'null' : String(change.new)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
