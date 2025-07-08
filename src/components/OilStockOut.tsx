import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Minus, Edit2, Trash2, AlertTriangle, Search, Filter, Trash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface OilStockOutProps {
  onBack: () => void;
}

export const OilStockOut = ({ onBack }: OilStockOutProps) => {
  const [selectedAirline, setSelectedAirline] = useState('');
  const [selectedOwner, setSelectedOwner] = useState<'heston' | 'customer' | ''>('');
  const [selectedOilType, setSelectedOilType] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [aircraftReg, setAircraftReg] = useState('');
  const [quantity, setQuantity] = useState('');
  const [airlines, setAirlines] = useState<any[]>([]);
  const [oilTypes, setOilTypes] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [availableStock, setAvailableStock] = useState<any[]>([]);
  const [usageRecords, setUsageRecords] = useState<any[]>([]);
  const [filteredUsageRecords, setFilteredUsageRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showStockAlert, setShowStockAlert] = useState(false);
  const [stockAlertMessage, setStockAlertMessage] = useState('');
  const [selectedUsageRecords, setSelectedUsageRecords] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAirline, setFilterAirline] = useState('');
  const [filterOilType, setFilterOilType] = useState('');
  
  // Edit dialog states
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editAirline, setEditAirline] = useState('');
  const [editAircraftReg, setEditAircraftReg] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editStaff, setEditStaff] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    fetchAirlines();
    fetchOilTypes();
    fetchStaff();
    fetchUsageRecords();
  }, []);

  useEffect(() => {
    if (selectedOwner && selectedOilType) {
      fetchAvailableStock();
    }
  }, [selectedOwner, selectedOilType]);

  // Filter and search effect
  useEffect(() => {
    let filtered = usageRecords;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.oil_stock?.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.oil_stock?.oil_types?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.airlines?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.aircraft_registration.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply airline filter
    if (filterAirline) {
      filtered = filtered.filter(record => record.airline_id === filterAirline);
    }

    // Apply oil type filter (based on the oil stock's oil type)
    if (filterOilType) {
      filtered = filtered.filter(record => 
        record.oil_stock?.oil_types?.name.toLowerCase().includes(filterOilType.toLowerCase())
      );
    }

    setFilteredUsageRecords(filtered);
  }, [usageRecords, searchTerm, filterAirline, filterOilType]);

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
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching oil types:', error);
    } else {
      setOilTypes(data || []);
    }
  };

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching staff:', error);
    } else {
      setStaff(data || []);
    }
  };

  const fetchAvailableStock = async () => {
    if (!selectedOwner || !selectedOilType) return;
    
    const { data, error } = await supabase
      .from('oil_stock')
      .select(`
        *,
        oil_types(name),
        airlines(name)
      `)
      .eq('oil_type_id', selectedOilType)
      .eq('owner', selectedOwner as 'heston' | 'customer')
      .gt('quantity_remaining', 0)
      .order('received_date', { ascending: true }); // FIFO
    
    if (error) {
      console.error('Error fetching available stock:', error);
    } else {
      setAvailableStock(data || []);
    }
  };

  const fetchUsageRecords = async () => {
    const { data, error } = await supabase
      .from('oil_usage')
      .select(`
        *,
        oil_stock(batch_number, oil_types(name)),
        airlines(name),
        staff(name)
      `)
      .order('usage_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching usage records:', error);
    } else {
      setUsageRecords(data || []);
    }
  };

  const checkStockAvailability = () => {
    const totalAvailable = availableStock.reduce((sum, stock) => sum + stock.quantity_remaining, 0);
    const requestedQty = parseInt(quantity);
    
    if (totalAvailable < requestedQty) {
      setStockAlertMessage(`Insufficient stock! Available: ${totalAvailable}, Requested: ${requestedQty}`);
      setShowStockAlert(true);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkStockAvailability()) {
      return;
    }

    setLoading(true);

    try {
      const firstAvailableBatch = availableStock.find(stock => stock.quantity_remaining > 0);
      
      if (!firstAvailableBatch) {
        throw new Error('No available stock found');
      }

      const usageData = {
        batch_id: firstAvailableBatch.id,
        airline_id: selectedAirline,
        aircraft_registration: aircraftReg,
        quantity_used: parseInt(quantity),
        staff_id: selectedStaff
      };

      const { error } = await supabase
        .from('oil_usage')
        .insert([usageData]);

      if (error) throw error;

      toast({
        title: "Stock Out Recorded Successfully",
        description: `Used ${quantity} units for aircraft ${aircraftReg}`,
      });

      // Reset form
      setSelectedAirline('');
      setSelectedOwner('');
      setSelectedOilType('');
      setSelectedStaff('');
      setAircraftReg('');
      setQuantity('');
      
      // Refresh records
      fetchUsageRecords();
      fetchAvailableStock();
    } catch (error: any) {
      toast({
        title: "Error Recording Stock Out",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setEditAirline(record.airline_id);
    setEditAircraftReg(record.aircraft_registration);
    setEditQuantity(record.quantity_used.toString());
    setEditStaff(record.staff_id);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingRecord) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('oil_usage')
        .update({
          airline_id: editAirline,
          aircraft_registration: editAircraftReg,
          quantity_used: parseInt(editQuantity),
          staff_id: editStaff,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingRecord.id);

      if (error) throw error;

      toast({
        title: "Usage Record Updated",
        description: "The usage record has been updated successfully.",
      });

      setEditDialogOpen(false);
      fetchUsageRecords();
    } catch (error: any) {
      toast({
        title: "Error Updating Record",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('oil_usage')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Usage Record Deleted",
        description: "The usage record has been deleted successfully.",
      });

      fetchUsageRecords();
      fetchAvailableStock(); // Refresh stock as quantities will be restored
    } catch (error: any) {
      toast({
        title: "Error Deleting Record",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsageRecords.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedUsageRecords.size} selected usage records?`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('oil_usage')
        .delete()
        .in('id', Array.from(selectedUsageRecords));

      if (error) throw error;

      toast({
        title: "Bulk Delete Successful",
        description: `Deleted ${selectedUsageRecords.size} usage records`,
      });

      setSelectedUsageRecords(new Set());
      fetchUsageRecords();
      fetchAvailableStock();
    } catch (error: any) {
      console.error('Error bulk deleting records:', error);
      toast({
        title: "Error Bulk Deleting Records",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUsageRecord = (recordId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsageRecords);
    if (checked) {
      newSelected.add(recordId);
    } else {
      newSelected.delete(recordId);
    }
    setSelectedUsageRecords(newSelected);
  };

  const handleSelectAllUsage = (checked: boolean) => {
    if (checked) {
      setSelectedUsageRecords(new Set(filteredUsageRecords.map(record => record.id)));
    } else {
      setSelectedUsageRecords(new Set());
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
          Oil Stock Out
        </h1>
      </div>

      {/* Stock Out Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Minus className="w-5 h-5" />
            <span>Record Oil Usage</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="owner">Stock Owner</Label>
              <Select value={selectedOwner} onValueChange={(value: 'heston' | 'customer') => setSelectedOwner(value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select stock owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="heston">HESTON MRO</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="oilType">Oil Type</Label>
              <Select value={selectedOilType} onValueChange={setSelectedOilType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select oil type" />
                </SelectTrigger>
                <SelectContent>
                  {oilTypes.map((oilType) => (
                    <SelectItem key={oilType.id} value={oilType.id}>
                      {oilType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff">Staff Member</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aircraft">Aircraft Registration</Label>
              <Input
                id="aircraft"
                value={aircraftReg}
                onChange={(e) => setAircraftReg(e.target.value.toUpperCase())}
                placeholder="e.g., V8DLD"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity Used</Label>
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

            <div className="md:col-span-3">
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-red-500 hover:bg-red-600"
              >
                {loading ? 'Recording...' : 'Record Stock Out'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Usage Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Records</CardTitle>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="w-4 h-4" />
              <Input
                placeholder="Search by batch, oil type, customer, or aircraft..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <Select value={filterAirline} onValueChange={setFilterAirline}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Airlines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Airlines</SelectItem>
                  {airlines.map((airline) => (
                    <SelectItem key={airline.id} value={airline.id}>
                      {airline.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Filter by oil type..."
                value={filterOilType}
                onChange={(e) => setFilterOilType(e.target.value)}
                className="w-[140px]"
              />
              {selectedUsageRecords.size > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleBulkDelete}
                  className="flex items-center space-x-2"
                  disabled={loading}
                >
                  <Trash className="w-4 h-4" />
                  <span>Delete ({selectedUsageRecords.size})</span>
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
                      checked={filteredUsageRecords.length > 0 && selectedUsageRecords.size === filteredUsageRecords.length}
                      onCheckedChange={handleSelectAllUsage}
                      className="border-white data-[state=checked]:bg-white data-[state=checked]:text-teal-600"
                    />
                  </TableHead>
                  <TableHead className="text-white">Batch #</TableHead>
                  <TableHead className="text-white">Oil Type</TableHead>
                  <TableHead className="text-white">Oil Owner</TableHead>
                  <TableHead className="text-white">Customer</TableHead>
                  <TableHead className="text-white">QTY</TableHead>
                  <TableHead className="text-white">A/C Rego</TableHead>
                  <TableHead className="text-white">Name</TableHead>
                  <TableHead className="text-white">Date</TableHead>
                  <TableHead className="text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsageRecords.map((record, index) => (
                  <TableRow key={record.id} className={index % 2 === 0 ? 'bg-blue-50 dark:bg-blue-950/20' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsageRecords.has(record.id)}
                        onCheckedChange={(checked) => handleSelectUsageRecord(record.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{record.oil_stock?.batch_number}</TableCell>
                    <TableCell>{record.oil_stock?.oil_types?.name}</TableCell>
                    <TableCell className="capitalize">Customer</TableCell>
                    <TableCell>{record.airlines?.name}</TableCell>
                    <TableCell>{record.quantity_used}</TableCell>
                    <TableCell>{record.aircraft_registration}</TableCell>
                    <TableCell>{record.staff?.name}</TableCell>
                    <TableCell>{new Date(record.usage_date).toLocaleDateString()}</TableCell>
                    <TableCell className="space-x-2">
                      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(record)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Usage Record</DialogTitle>
                            <DialogDescription>
                              Update the usage record details below.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="editAirline">Customer Airline</Label>
                              <Select value={editAirline} onValueChange={setEditAirline}>
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
                            <div className="space-y-2">
                              <Label htmlFor="editAircraftReg">Aircraft Registration</Label>
                              <Input
                                id="editAircraftReg"
                                value={editAircraftReg}
                                onChange={(e) => setEditAircraftReg(e.target.value.toUpperCase())}
                                placeholder="e.g., V8DLD"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="editQuantity">Quantity Used</Label>
                              <Input
                                id="editQuantity"
                                type="number"
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(e.target.value)}
                                placeholder="Enter quantity"
                                min="1"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="editStaff">Staff Member</Label>
                              <Select value={editStaff} onValueChange={setEditStaff}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select staff member" />
                                </SelectTrigger>
                                <SelectContent>
                                  {staff.map((member) => (
                                    <SelectItem key={member.id} value={member.id}>
                                      {member.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="button" onClick={handleEditSubmit} disabled={loading}>
                              {loading ? 'Updating...' : 'Update Record'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Usage Record</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this usage record? This action cannot be undone and will restore the oil quantity to stock.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(record.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Stock Alert Dialog */}
      <AlertDialog open={showStockAlert} onOpenChange={setShowStockAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>Insufficient Stock</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              {stockAlertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowStockAlert(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
