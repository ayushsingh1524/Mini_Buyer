'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Search, Download, Upload, LogOut } from 'lucide-react';
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
  status: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function BuyersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    propertyType: searchParams.get('propertyType') || '',
    status: searchParams.get('status') || '',
    timeline: searchParams.get('timeline') || '',
  });

  const fetchBuyers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(filters.city && { city: filters.city }),
        ...(filters.propertyType && { propertyType: filters.propertyType }),
        ...(filters.status && { status: filters.status }),
        ...(filters.timeline && { timeline: filters.timeline }),
      });

      const response = await fetch(`/api/buyers?${params}`);
      if (response.ok) {
        const data = await response.json();
        setBuyers(data.buyers);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching buyers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, filters]);

  useEffect(() => {
    fetchBuyers();
  }, [fetchBuyers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchParams.get('search')) {
        const params = new URLSearchParams(searchParams);
        if (search) {
          params.set('search', search);
        } else {
          params.delete('search');
        }
        params.set('page', '1');
        router.push(`/buyers?${params.toString()}`);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, searchParams, router]);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/buyers?${params.toString()}`);
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(filters.city && { city: filters.city }),
        ...(filters.propertyType && { propertyType: filters.propertyType }),
        ...(filters.status && { status: filters.status }),
        ...(filters.timeline && { timeline: filters.timeline }),
      });

      const response = await fetch(`/api/buyers/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `buyers-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    fetch('/api/buyers/import', {
      method: 'POST',
      body: formData,
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert(`Successfully imported ${data.imported} buyers`);
          fetchBuyers();
        } else {
          alert(`Import failed: ${data.error}`);
          if (data.errors) {
            console.error('Validation errors:', data.errors);
          }
        }
      })
      .catch(error => {
        console.error('Import error:', error);
        alert('Import failed');
      });

    // Reset file input
    event.target.value = '';
  };

  const handleLogout = async () => {
    await fetch('/api/auth/login', { method: 'DELETE' });
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Buyer Leads</h1>
            <div className="flex items-center space-x-4">
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/buyers/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Lead
              </Button>
            </Link>
            
            <div className="flex gap-2">
              <Button onClick={handleExport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              
              <Label htmlFor="import-csv" className="cursor-pointer">
                <Button asChild variant="outline">
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV
                  </span>
                </Button>
              </Label>
              <input
                id="import-csv"
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, phone, or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>City</Label>
              <Select value={filters.city} onValueChange={(value) => handleFilterChange('city', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Cities</SelectItem>
                  <SelectItem value="Chandigarh">Chandigarh</SelectItem>
                  <SelectItem value="Mohali">Mohali</SelectItem>
                  <SelectItem value="Zirakpur">Zirakpur</SelectItem>
                  <SelectItem value="Panchkula">Panchkula</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Property Type</Label>
              <Select value={filters.propertyType} onValueChange={(value) => handleFilterChange('propertyType', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="Apartment">Apartment</SelectItem>
                  <SelectItem value="Villa">Villa</SelectItem>
                  <SelectItem value="Plot">Plot</SelectItem>
                  <SelectItem value="Office">Office</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Qualified">Qualified</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Visited">Visited</SelectItem>
                  <SelectItem value="Negotiation">Negotiation</SelectItem>
                  <SelectItem value="Converted">Converted</SelectItem>
                  <SelectItem value="Dropped">Dropped</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Timeline</Label>
              <Select value={filters.timeline} onValueChange={(value) => handleFilterChange('timeline', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Timelines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Timelines</SelectItem>
                  <SelectItem value="0-3m">0-3 months</SelectItem>
                  <SelectItem value="3-6m">3-6 months</SelectItem>
                  <SelectItem value=">6m">>6 months</SelectItem>
                  <SelectItem value="Exploring">Exploring</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading buyers...</p>
            </div>
          ) : buyers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No buyers found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        City
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Property Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Budget
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timeline
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Updated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {buyers.map((buyer) => (
                      <tr key={buyer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {buyer.fullName}
                          </div>
                          {buyer.email && (
                            <div className="text-sm text-gray-500">{buyer.email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {buyer.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {buyer.city}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {buyer.propertyType}
                          {buyer.bhk && ` (${buyer.bhk} BHK)`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {buyer.budgetMin && buyer.budgetMax
                            ? `${formatCurrency(buyer.budgetMin)} - ${formatCurrency(buyer.budgetMax)}`
                            : buyer.budgetMin
                            ? `From ${formatCurrency(buyer.budgetMin)}`
                            : buyer.budgetMax
                            ? `Up to ${formatCurrency(buyer.budgetMax)}`
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {buyer.timeline}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            buyer.status === 'New' ? 'bg-blue-100 text-blue-800' :
                            buyer.status === 'Qualified' ? 'bg-green-100 text-green-800' :
                            buyer.status === 'Contacted' ? 'bg-yellow-100 text-yellow-800' :
                            buyer.status === 'Visited' ? 'bg-purple-100 text-purple-800' :
                            buyer.status === 'Negotiation' ? 'bg-orange-100 text-orange-800' :
                            buyer.status === 'Converted' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {buyer.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(buyer.updatedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link href={`/buyers/${buyer.id}`}>
                            <Button variant="outline" size="sm">
                              View/Edit
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                      variant="outline"
                      disabled={pagination.page === 1}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams);
                        params.set('page', (pagination.page - 1).toString());
                        router.push(`/buyers?${params.toString()}`);
                      }}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams);
                        params.set('page', (pagination.page + 1).toString());
                        router.push(`/buyers?${params.toString()}`);
                      }}
                    >
                      Next
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">
                          {(pagination.page - 1) * pagination.limit + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium">
                          {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </span>{' '}
                        of{' '}
                        <span className="font-medium">{pagination.total}</span>{' '}
                        results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pagination.page === 1}
                          onClick={() => {
                            const params = new URLSearchParams(searchParams);
                            params.set('page', (pagination.page - 1).toString());
                            router.push(`/buyers?${params.toString()}`);
                          }}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pagination.page === pagination.totalPages}
                          onClick={() => {
                            const params = new URLSearchParams(searchParams);
                            params.set('page', (pagination.page + 1).toString());
                            router.push(`/buyers?${params.toString()}`);
                          }}
                        >
                          Next
                        </Button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
