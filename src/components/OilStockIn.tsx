import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, Edit2, Trash2, Search, Filter, Trash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OilStockInProps {
  onBack: () => void;
}

export const OilStockIn = ({ onBack }: OilStockInProps) => {
  const [batchNumber, setBatchNumber] = useState('');
  const [selectedOwner, setSelectedOwner] = useState<'heston' | 'customer' | ''>('');
  const [selectedAirline, setSelectedAirline] = useState('');
  const [selectedOilType, setSelectedOilType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [airlines, setAirlines] = useState<any[]>([]);
  const [oilTypes, setOilTypes] = useState<any[]>([]);
  const [stockRecords, setStockRecords] = useState<any[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterOilType, setFilterOilType] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchAirlines();
    fetchOilTypes();
    fetchStockRecords();
  }, []);

  // Filter and search effect
  useEffect(() => {
    let filtered = stockRecords;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.oil_types?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.airlines?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply owner filter
    if (filterOwner) {
      filtered = filtered.filter(record => record.owner === filterOwner);
    }

    // Apply oil type filter
    if (filterOilType) {
      filtered = filtered.filter(record => record.oil_type_id === filterOilType);
    }

    setFilteredRecords(filtered);
  }, [stockRecords, searchTerm, filterOwner, filterOilType]);

  const fetchAirlines = async () => {
    const { data, error } = await supabase
      .from('airlines')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching airlines:', error);
    } else {
      setAirlines(data || []);
    }
  };

  const fetchOilTypes = async () => {
    const { data, error } = await supabase
      .from('oil_types')
      .select('*, airlines(name)')
      .order('name');
    
    if (error) {
      console.error('Error fetching oil types:', error);
    } else {
      setOilTypes(data || []);
    }
  };

  const fetchStockRecords = async () => {
    const { data, error } = await supabase
      .from('oil_stock')
      .select(`
        *,
        oil_types(name),
        airlines(name),
        staff(name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching stock records:', error);
    } else {
      setStockRecords(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Current user ID:', user.id);

      // Find staff record for current user with more detailed logging
      let { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, name, auth_user_id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      console.log('Staff query result:', { staffData, staffError });

      if (staffError) {
        console.error('Staff query error:', staffError);
        throw new Error(`Database error: ${staffError.message}`);
      }

      if (!staffData) {
        console.log('No staff record found, attempting to create one...');
        
        // Try to get user metadata for name
        const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown User';
        
        // Create staff record
        const { data: newStaffData, error: createError } = await supabase
          .from('staff')
          .insert([{
            name: userName,
            auth_user_id: user.id,
            role: 'staff',
            permissions: {
              oil_stock_in: true,
              oil_stock_out: true,
              oil_management: false,
              staff_management: false
            }
          }])
          .select('id, name, auth_user_id')
          .single();

        if (createError) {
          console.error('Error creating staff record:', createError);
          throw new Error('Could not create staff record. Please contact administrator.');
        }

        console.log('Created new staff record:', newStaffData);
        staffData = newStaffData;
      }
      
      const stockData = {
        batch_number: batchNumber,
        oil_type_id: selectedOilType,
        owner: selectedOwner as 'heston' | 'customer',
        owner_airline_id: selectedOwner === 'customer' ? selectedAirline : null,
        quantity_received: parseInt(quantity),
        quantity_remaining: parseInt(quantity),
        created_by: staffData.id
      };

      console.log('Inserting stock data:', stockData);

      const { error } = await supabase
        .from('oil_stock')
        .insert([stockData]);

      if (error) throw error;

      toast({
        title: "Stock Added Successfully",
        description: `Added ${quantity} units of batch ${batchNumber}`,
      });

      // Reset form
      setBatchNumber('');
      setSelectedOwner('');
      setSelectedAirline('');
      setSelectedOilType('');
      setQuantity('');
      
      // Refresh records
      fetchStockRecords();
    } catch (error: any) {
      console.error('Error adding stock:', error);
      toast({
        title: "Error Adding Stock",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setBatchNumber(record.batch_number);
    setSelectedOwner(record.owner);
    setSelectedAirline(record.owner_airline_id || '');
    setSelectedOilType(record.oil_type_id);
    setQuantity(record.quantity_received.toString());
    setEditDialogOpen(true);
  };

  const handleUpdateRecord = async () => {
    if (!editingRecord) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('oil_stock')
        .update({
          batch_number: batchNumber,
          owner: selectedOwner as 'heston' | 'customer',
          owner_airline_id: selectedOwner === 'customer' ? selectedAirline : null,
          oil_type_id: selectedOilType,
          quantity_received: parseInt(quantity),
          quantity_remaining: parseInt(quantity),
        })
        .eq('id', editingRecord.id);

      if (error) throw error;

      toast({
        title: "Stock Updated Successfully",
        description: `Updated batch ${batchNumber}`,
      });

      setEditDialogOpen(false);
      setEditingRecord(null);
      // Reset form
      setBatchNumber('');
      setSelectedOwner('');
      setSelectedAirline('');
      setSelectedOilType('');
      setQuantity('');
      
      fetchStockRecords();
    } catch (error: any) {
      console.error('Error updating stock:', error);
      toast({
        title: "Error Updating Stock",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (record: any) => {
    if (!confirm(`Are you sure you want to delete batch ${record.batch_number}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('oil_stock')
        .delete()
        .eq('id', record.id);

      if (error) throw error;

      toast({
        title: "Stock Deleted",
        description: `Deleted batch ${record.batch_number}`,
      });

      fetchStockRecords();
    } catch (error: any) {
      console.error('Error deleting stock:', error);
      toast({
        title: "Error Deleting Stock",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRecords.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedRecords.size} selected records?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('oil_stock')
        .delete()
        .in('id', Array.from(selectedRecords));

      if (error) throw error;

      toast({
        title: "Bulk Delete Successful",
        description: `Deleted ${selectedRecords.size} records`,
      });

      setSelectedRecords(new Set());
      fetchStockRecords();
    } catch (error: any) {
      console.error('Error bulk deleting records:', error);
      toast({
        title: "Error Bulk Deleting Records",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSelectRecord = (recordId: string, checked: boolean) => {
    const newSelected = new Set(selectedRecords);
    if (checked) {
      newSelected.add(recordId);
    } else {
      newSelected.delete(recordId);
    }
    setSelectedRecords(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecords(new Set(filteredRecords.map(record => record.id)));
    } else {
      setSelectedRecords(new Set());
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Oil Dashboard</span>
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Oil Stock In
        </h1>
      </div>

      {/* Add Stock Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Add New Oil Stock</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="batch">Batch Number</Label>
              <Input
                id="batch"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="Enter batch number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner">Stock Owner</Label>
              <Select value={selectedOwner} onValueChange={(value: 'heston' | 'customer') => setSelectedOwner(value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="heston">HESTON MRO</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedOwner === 'customer' && (
              <div className="space-y-2">
                <Label htmlFor="airline">Customer Airline</Label>
                <Select value={selectedAirline} onValueChange={setSelectedAirline} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select airline" />
                  </SelectTrigger>
                  <SelectContent>
                    {airlines.map((airline) => (
                      <SelectItem key={airline.id} value={airline.id}>
                        {airline.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="oilType">Oil Type</Label>
              <Select value={selectedOilType} onValueChange={setSelectedOilType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select oil type" />
                </SelectTrigger>
                <SelectContent>
                  {oilTypes.map((oilType) => (
                    <SelectItem key={oilType.id} value={oilType.id}>
                      {oilType.name} {oilType.airlines?.name && `(${oilType.airlines.name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                min="1"
                required
              />
            </div>

            <div className="flex items-end">
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                {loading ? 'Adding...' : 'Add Stock'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Stock Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Records</CardTitle>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="w-4 h-4" />
              <Input
                placeholder="Search by batch number, oil type, or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <Select value={filterOwner} onValueChange={setFilterOwner}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Owners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Owners</SelectItem>
                  <SelectItem value="heston">HESTON MRO</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterOilType} onValueChange={setFilterOilType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Oil Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Oil Types</SelectItem>
                  {oilTypes.map((oilType) => (
                    <SelectItem key={oilType.id} value={oilType.id}>
                      {oilType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRecords.size > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleBulkDelete}
                  className="flex items-center space-x-2"
                >
                  <Trash className="w-4 h-4" />
                  <span>Delete ({selectedRecords.size})</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-teal-600 hover:bg-teal-600">
                  <TableHead className="text-white w-12">
                    <Checkbox
                      checked={filteredRecords.length > 0 && selectedRecords.size === filteredRecords.length}
                      onCheckedChange={handleSelectAll}
                      className="border-white data-[state=checked]:bg-white data-[state=checked]:text-teal-600"
                    />
                  </TableHead>
                  <TableHead className="text-white">Batch #</TableHead>
                  <TableHead className="text-white">Oil Type</TableHead>
                  <TableHead className="text-white">Oil Owner</TableHead>
                  <TableHead className="text-white">Customer</TableHead>
                  <TableHead className="text-white">QTY Received</TableHead>
                  <TableHead className="text-white">QTY Remaining</TableHead>
                  <TableHead className="text-white">Date</TableHead>
                  <TableHead className="text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record, index) => (
                  <TableRow key={record.id} className={index % 2 === 0 ? 'bg-blue-50 dark:bg-blue-950/20' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRecords.has(record.id)}
                        onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{record.batch_number}</TableCell>
                    <TableCell>{record.oil_types?.name}</TableCell>
                    <TableCell className="capitalize">{record.owner}</TableCell>
                    <TableCell>{record.airlines?.name || 'HESTON MRO'}</TableCell>
                    <TableCell>{record.quantity_received}</TableCell>
                    <TableCell>{record.quantity_remaining}</TableCell>
                    <TableCell>{new Date(record.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(record)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Stock Record</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-1 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="editBatch">Batch Number</Label>
                                <Input
                                  id="editBatch"
                                  value={batchNumber}
                                  onChange={(e) => setBatchNumber(e.target.value)}
                                  placeholder="Enter batch number"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="editQuantity">Quantity</Label>
                                <Input
                                  id="editQuantity"
                                  type="number"
                                  value={quantity}
                                  onChange={(e) => setQuantity(e.target.value)}
                                  placeholder="Enter quantity"
                                  min="1"
                                />
                              </div>
                              <Button onClick={handleUpdateRecord} disabled={loading}>
                                {loading ? 'Updating...' : 'Update Record'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(record)} className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
