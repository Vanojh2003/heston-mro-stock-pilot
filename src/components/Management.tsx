
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, Edit2, Trash2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ManagementProps {
  onBack: () => void;
}

export const Management = ({ onBack }: ManagementProps) => {
  const [staffName, setStaffName] = useState('');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffRole, setStaffRole] = useState('staff');
  const [permissions, setPermissions] = useState({
    oil_stock_in: true,
    oil_stock_out: true,
    oil_management: false,
    staff_management: false
  });
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStaff();
  }, []);

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

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('staff')
        .insert([{
          name: staffName,
          username: staffUsername,
          role: staffRole as 'admin' | 'manager' | 'staff',
          permissions: permissions
        }]);

      if (error) throw error;

      toast({
        title: "Staff Member Added Successfully",
        description: `Added ${staffName}`,
      });

      // Reset form
      setStaffName('');
      setStaffUsername('');
      setStaffRole('staff');
      setPermissions({
        oil_stock_in: true,
        oil_stock_out: true,
        oil_management: false,
        staff_management: false
      });
      
      fetchStaff();
    } catch (error: any) {
      toast({
        title: "Error Adding Staff Member",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: checked
    }));
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
          <span>Back to Dashboard</span>
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          System Management
        </h1>
      </div>

      {/* Add Staff Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Add New Staff Member</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddStaff} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staffName">Full Name</Label>
                <Input
                  id="staffName"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="Enter full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="staffUsername">Username</Label>
                <Input
                  id="staffUsername"
                  value={staffUsername}
                  onChange={(e) => setStaffUsername(e.target.value)}
                  placeholder="Enter username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staffRole">Role</Label>
                <Select value={staffRole} onValueChange={setStaffRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Permissions</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="oil_stock_in"
                    checked={permissions.oil_stock_in}
                    onCheckedChange={(checked) => handlePermissionChange('oil_stock_in', checked as boolean)}
                  />
                  <Label htmlFor="oil_stock_in" className="text-sm">Oil Stock In</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="oil_stock_out"
                    checked={permissions.oil_stock_out}
                    onCheckedChange={(checked) => handlePermissionChange('oil_stock_out', checked as boolean)}
                  />
                  <Label htmlFor="oil_stock_out" className="text-sm">Oil Stock Out</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="oil_management"
                    checked={permissions.oil_management}
                    onCheckedChange={(checked) => handlePermissionChange('oil_management', checked as boolean)}
                  />
                  <Label htmlFor="oil_management" className="text-sm">Oil Management</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="staff_management"
                    checked={permissions.staff_management}
                    onCheckedChange={(checked) => handlePermissionChange('staff_management', checked as boolean)}
                  />
                  <Label htmlFor="staff_management" className="text-sm">Staff Management</Label>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-purple-500 hover:bg-purple-600"
            >
              {loading ? 'Adding...' : 'Add Staff Member'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Staff Members</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.username || 'Not set'}</TableCell>
                  <TableCell className="capitalize">{member.role}</TableCell>
                  <TableCell>
                    <div className="text-xs">
                      {Object.entries(member.permissions || {})
                        .filter(([_, value]) => value)
                        .map(([key]) => key.replace('_', ' '))
                        .join(', ')}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>
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
