
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Edit2, Trash2, Users, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ManagementProps {
  onBack: () => void;
}

export const Management = ({ onBack }: ManagementProps) => {
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    // Password must be at least 6 characters long
    return password.length >= 6;
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(staffEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (!validatePassword(staffPassword)) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create user in Supabase Auth with the provided password
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: staffEmail,
        password: staffPassword,
        email_confirm: true,
        user_metadata: {
          name: staffName
        }
      });

      if (authError) {
        console.error('Auth creation error:', authError);
        throw new Error('Failed to create user account: ' + authError.message);
      }

      // Then create staff record
      const { error } = await supabase
        .from('staff')
        .insert([{
          name: staffName,
          username: staffUsername,
          role: staffRole as 'admin' | 'manager' | 'staff',
          permissions: permissions,
          auth_user_id: authData.user.id
        }]);

      if (error) throw error;

      toast({
        title: "Staff Member Added Successfully",
        description: `Added ${staffName} with login credentials`,
      });

      // Reset form
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
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

  const handleEdit = (member: any) => {
    setEditingStaff(member);
    setStaffName(member.name);
    setStaffUsername(member.username || '');
    setStaffRole(member.role);
    setPermissions(member.permissions || {
      oil_stock_in: true,
      oil_stock_out: true,
      oil_management: false,
      staff_management: false
    });
    setEditDialogOpen(true);
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('staff')
        .update({
          name: staffName,
          username: staffUsername,
          role: staffRole as 'admin' | 'manager' | 'staff',
          permissions: permissions
        })
        .eq('id', editingStaff.id);

      if (error) throw error;

      toast({
        title: "Staff Member Updated",
        description: `Updated ${staffName}`,
      });

      setEditDialogOpen(false);
      setEditingStaff(null);
      // Reset form
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
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
      console.error('Error updating staff:', error);
      toast({
        title: "Error Updating Staff Member",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (member: any) => {
    if (!confirm(`Are you sure you want to delete ${member.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete from staff table first
      const { error: staffError } = await supabase
        .from('staff')
        .delete()
        .eq('id', member.id);

      if (staffError) throw staffError;

      // If they have an auth_user_id, also delete from auth
      if (member.auth_user_id) {
        const { error: authError } = await supabase.auth.admin.deleteUser(member.auth_user_id);
        if (authError) {
          console.error('Error deleting auth user:', authError);
          // Don't throw here, staff record is already deleted
        }
      }

      toast({
        title: "Staff Member Deleted",
        description: `Deleted ${member.name}`,
      });

      fetchStaff();
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      toast({
        title: "Error Deleting Staff Member",
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
                <Label htmlFor="staffEmail">Email Address</Label>
                <Input
                  id="staffEmail"
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staffPassword">Password</Label>
                <div className="relative">
                  <Input
                    id="staffPassword"
                    type={showPassword ? "text" : "password"}
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="Enter password (min 6 characters)"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
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
                    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(member)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Staff Member</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="editName">Full Name</Label>
                            <Input
                              id="editName"
                              value={staffName}
                              onChange={(e) => setStaffName(e.target.value)}
                              placeholder="Enter full name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="editUsername">Username</Label>
                            <Input
                              id="editUsername"
                              value={staffUsername}
                              onChange={(e) => setStaffUsername(e.target.value)}
                              placeholder="Enter username"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="editRole">Role</Label>
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
                          <div className="space-y-4">
                            <Label className="text-base font-semibold">Permissions</Label>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="edit_oil_stock_in"
                                  checked={permissions.oil_stock_in}
                                  onCheckedChange={(checked) => handlePermissionChange('oil_stock_in', checked as boolean)}
                                />
                                <Label htmlFor="edit_oil_stock_in" className="text-sm">Oil Stock In</Label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="edit_oil_stock_out"
                                  checked={permissions.oil_stock_out}
                                  onCheckedChange={(checked) => handlePermissionChange('oil_stock_out', checked as boolean)}
                                />
                                <Label htmlFor="edit_oil_stock_out" className="text-sm">Oil Stock Out</Label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="edit_oil_management"
                                  checked={permissions.oil_management}
                                  onCheckedChange={(checked) => handlePermissionChange('oil_management', checked as boolean)}
                                />
                                <Label htmlFor="edit_oil_management" className="text-sm">Oil Management</Label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="edit_staff_management"
                                  checked={permissions.staff_management}
                                  onCheckedChange={(checked) => handlePermissionChange('staff_management', checked as boolean)}
                                />
                                <Label htmlFor="edit_staff_management" className="text-sm">Staff Management</Label>
                              </div>
                            </div>
                          </div>
                          <Button onClick={handleUpdateStaff} disabled={loading}>
                            {loading ? 'Updating...' : 'Update Staff Member'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(member)} className="text-red-600 hover:text-red-700">
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
