
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OilManagementProps {
  onBack: () => void;
}

export const OilManagement = ({ onBack }: OilManagementProps) => {
  const [newAirlineName, setNewAirlineName] = useState('');
  const [newAirlineCode, setNewAirlineCode] = useState('');
  const [newOilTypeName, setNewOilTypeName] = useState('');
  const [selectedOwnerForOil, setSelectedOwnerForOil] = useState('');
  const [airlines, setAirlines] = useState<any[]>([]);
  const [oilTypes, setOilTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAirlines();
    fetchOilTypes();
  }, []);

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
      .select(`
        *,
        airlines(name)
      `)
      .order('name');
    
    if (error) {
      console.error('Error fetching oil types:', error);
    } else {
      setOilTypes(data || []);
    }
  };

  const handleAddAirline = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('airlines')
        .insert([{
          name: newAirlineName,
          code: newAirlineCode.toUpperCase()
        }]);

      if (error) throw error;

      toast({
        title: "Airline Added Successfully",
        description: `Added ${newAirlineName}`,
      });

      setNewAirlineName('');
      setNewAirlineCode('');
      fetchAirlines();
    } catch (error: any) {
      toast({
        title: "Error Adding Airline",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddOilType = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('oil_types')
        .insert([{
          name: newOilTypeName,
          owner_id: selectedOwnerForOil || null
        }]);

      if (error) throw error;

      toast({
        title: "Oil Type Added Successfully",
        description: `Added ${newOilTypeName}`,
      });

      setNewOilTypeName('');
      setSelectedOwnerForOil('');
      fetchOilTypes();
    } catch (error: any) {
      toast({
        title: "Error Adding Oil Type",
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
          Oil Management
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add Airlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Add New Airline</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddAirline} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="airlineName">Airline Name</Label>
                <Input
                  id="airlineName"
                  value={newAirlineName}
                  onChange={(e) => setNewAirlineName(e.target.value)}
                  placeholder="Enter airline name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="airlineCode">Airline Code</Label>
                <Input
                  id="airlineCode"
                  value={newAirlineCode}
                  onChange={(e) => setNewAirlineCode(e.target.value)}
                  placeholder="Enter airline code"
                  maxLength={3}
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600"
              >
                Add Airline
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Add Oil Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Add New Oil Type</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddOilType} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="oilTypeName">Oil Type Name</Label>
                <Input
                  id="oilTypeName"
                  value={newOilTypeName}
                  onChange={(e) => setNewOilTypeName(e.target.value)}
                  placeholder="Enter oil type name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="oilOwner">Oil Owner (Optional)</Label>
                <Select value={selectedOwnerForOil} onValueChange={setSelectedOwnerForOil}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner (optional)" />
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

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                Add Oil Type
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Airlines Table */}
      <Card>
        <CardHeader>
          <CardTitle>Airlines</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {airlines.map((airline) => (
                <TableRow key={airline.id}>
                  <TableCell className="font-medium">{airline.name}</TableCell>
                  <TableCell>{airline.code}</TableCell>
                  <TableCell>{new Date(airline.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="ghost" size="sm">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Oil Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>Oil Types</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {oilTypes.map((oilType) => (
                <TableRow key={oilType.id}>
                  <TableCell className="font-medium">{oilType.name}</TableCell>
                  <TableCell>{oilType.airlines?.name || 'General'}</TableCell>
                  <TableCell>{new Date(oilType.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="ghost" size="sm">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
