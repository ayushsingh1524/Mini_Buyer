'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createBuyerSchema, CreateBuyerInput } from '@/lib/validations/buyer';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewBuyerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateBuyerInput>({
    resolver: zodResolver(createBuyerSchema),
    defaultValues: {
      tags: [],
    },
  });

  const propertyType = watch('propertyType');
  const budgetMin = watch('budgetMin');
  const budgetMax = watch('budgetMax');

  const onSubmit = async (data: CreateBuyerInput) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/buyers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        router.push('/buyers');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create buyer');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/buyers" className="mr-4">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Leads
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">New Buyer Lead</h1>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  placeholder="Enter full name"
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
                  placeholder="Enter phone number"
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
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Location and Property */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="city">City *</Label>
                <Select onValueChange={(value) => setValue('city', value as any)}>
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
                <Select onValueChange={(value) => setValue('propertyType', value as any)}>
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
                <Select onValueChange={(value) => setValue('bhk', value as any)}>
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

            {/* Purpose and Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="purpose">Purpose *</Label>
                <Select onValueChange={(value) => setValue('purpose', value as any)}>
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
                <Select onValueChange={(value) => setValue('timeline', value as any)}>
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
                  placeholder="Enter minimum budget"
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
                  placeholder="Enter maximum budget"
                />
                {errors.budgetMax && (
                  <p className="text-red-500 text-sm mt-1">{errors.budgetMax.message}</p>
                )}
              </div>
            </div>

            {/* Source */}
            <div>
              <Label htmlFor="source">Source *</Label>
              <Select onValueChange={(value) => setValue('source', value as any)}>
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
                placeholder="Enter any additional notes"
              />
              {errors.notes && (
                <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>
              )}
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                {...register('tags')}
                className="mt-1"
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
            <div className="flex justify-end space-x-4">
              <Link href="/buyers">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Creating...' : 'Create Lead'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
