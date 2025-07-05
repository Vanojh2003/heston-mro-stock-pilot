
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
  const [selectedAirlineForOil, setSelectedAirlineForOil] = useState('general');
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
          owner_id: selectedAirlineForOil === 'general' ? null : selectedAirlineForOil
        }]);

      if (error) throw error;

      const airlineName = selectedAirlineForOil === 'general' 
        ? 'General use' 
        : airlines.find(a => a.id === selectedAirlineForOil)?.name;

      toast({
        title: "Oil Type Added Successfully",
        description: `Added ${newOilTypeName} for ${airlineName}`,
      });

      setNewOilTypeName('');
      setSelectedAirlineForOil('general');
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

  const handleEditAirline = async (airline: any) => {
    // TODO: Implement edit functionality
    toast({
      title: "Edit Airline",
      description: "Edit functionality will be implemented soon.",
    });
  };

  const handleDeleteAirline = async (airline: any) => {
    if (!confirm(`Are you sure you want to delete ${airline.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('airlines')
        .delete()
        .eq('id', airline.id);

      if (error) throw error;

      toast({
        title: "Airline Deleted",
        description: `Deleted ${airline.name}`,
      });

      fetchAirlines();
      fetchOilTypes(); // Refresh oil types as well
    } catch (error: any) {
      toast({
        title: "Error Deleting Airline",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditOilType = async (oilType: any) => {
    // TODO: Implement edit functionality
    toast({
      title: "Edit Oil Type",
      description: "Edit functionality will be implemented soon.",
    });
  };

  const handleDeleteOilType = async (oilType: any) => {
    if (!confirm(`Are you sure you want to delete ${oilType.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('oil_types')
        .delete()
        .eq('id', oilType.id);

      if (error) throw error;

      toast({
        title: "Oil Type Deleted",
        description: `Deleted ${oilType.name}`,
      });

      fetchOilTypes();
    } catch (error: any) {
      toast({
        title: "Error Deleting Oil Type",
        description: error.message,
        variant: "destructive",
      });
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
              <span>Add Oil Type to Airline</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddOilType} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="airlineForOil">Select Airline First</Label>
                <Select value={selectedAirlineForOil} onValueChange={setSelectedAirlineForOil} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select airline for oil type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General (No specific airline)</SelectItem>
                    {airlines.map((airline) => (
                      <SelectItem key={airline.id} value={airline.id}>
                        {airline.name} ({airline.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
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
                <TableHead>Oil Types</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {airlines.map((airline) => (
                <TableRow key={airline.id}>
                  <TableCell className="font-medium">{airline.name}</TableCell>
                  <TableCell>{airline.code}</TableCell>
                  <TableCell>
                    <div className="text-xs">
                      {oilTypes
                        .filter(oil => oil.owner_id === airline.id)
                        .map(oil => oil.name)
                        .join(', ') || 'None'}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(airline.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditAirline(airline)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteAirline(airline)}>
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
          <CardTitle>Oil Types by Airline</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Oil Type</TableHead>
                <TableHead>Airline</TableHead>
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
                    <Button variant="ghost" size="sm" onClick={() => handleEditOilType(oilType)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteOilType(oilType)}>
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
