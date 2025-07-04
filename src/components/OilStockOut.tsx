
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Minus, Edit2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface OilStockOutProps {
  onBack: () => void;
}

export const OilStockOut = ({ onBack }: OilStockOutProps) => {
  const [selectedAirline, setSelectedAirline] = useState('');
  const [selectedOwner, setSelectedOwner] = useState('');
  const [selectedOilType, setSelectedOilType] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [aircraftReg, setAircraftReg] = useState('');
  const [quantity, setQuantity] = useState('');
  const [airlines, setAirlines] = useState<any[]>([]);
  const [oilTypes, setOilTypes] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [availableStock, setAvailableStock] = useState<any[]>([]);
  const [usageRecords, setUsageRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showStockAlert, setShowStockAlert] = useState(false);
  const [stockAlertMessage, setStockAlertMessage] = useState('');
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
    const { data, error } = await supabase
      .from('oil_stock')
      .select(`
        *,
        oil_types(name),
        airlines(name)
      `)
      .eq('oil_type_id', selectedOilType)
      .eq('owner', selectedOwner)
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
      // Find the first available batch (FIFO)
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
              <Select value={selectedOwner} onValueChange={setSelectedOwner} required>
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
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-teal-600 hover:bg-teal-600">
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
                {usageRecords.map((record, index) => (
                  <TableRow key={record.id} className={index % 2 === 0 ? 'bg-blue-50 dark:bg-blue-950/20' : ''}>
                    <TableCell className="font-medium">{record.oil_stock?.batch_number}</TableCell>
                    <TableCell>{record.oil_stock?.oil_types?.name}</TableCell>
                    <TableCell className="capitalize">Customer</TableCell>
                    <TableCell>{record.airlines?.name}</TableCell>
                    <TableCell>{record.quantity_used}</TableCell>
                    <TableCell>{record.aircraft_registration}</TableCell>
                    <TableCell>{record.staff?.name}</TableCell>
                    <TableCell>{new Date(record.usage_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Edit2 className="w-4 h-4" />
                      </Button>
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
