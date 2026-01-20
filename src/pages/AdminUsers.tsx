import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Users, 
  Building2, 
  Shield, 
  Eye, 
  Settings,
  Trash2,
  UserPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  roles: {
    id: string;
    role: 'super_admin' | 'client_admin' | 'client_viewer';
    company_id: string | null;
    company_name?: string;
  }[];
}

interface Company {
  id: string;
  name: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'client_admin' | 'client_viewer'>('client_viewer');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { user, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isSuperAdmin) {
      fetchUsers();
      fetchCompanies();
    }
  }, [isSuperAdmin]);

  const fetchUsers = async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles with company names
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role, company_id');

      if (rolesError) throw rolesError;

      // Fetch companies for role mapping
      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, name');

      const companyMap = new Map(companiesData?.map(c => [c.id, c.name]) || []);

      // Combine data
      const usersWithRoles: UserWithRoles[] = (profiles || []).map(profile => {
        const userRoles = (rolesData || [])
          .filter(r => r.user_id === profile.id)
          .map(r => ({
            id: r.id,
            role: r.role as 'super_admin' | 'client_admin' | 'client_viewer',
            company_id: r.company_id,
            company_name: r.company_id ? companyMap.get(r.company_id) : undefined
          }));

        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          created_at: profile.created_at,
          roles: userRoles
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les utilisateurs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name')
      .order('name');
    
    if (!error && data) {
      setCompanies(data);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserName) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: newUserName,
          },
        },
      });

      if (authError) throw authError;

      toast({
        title: 'Utilisateur créé',
        description: `${newUserEmail} a été créé avec succès. Il recevra un email de confirmation.`,
      });

      setIsAddDialogOpen(false);
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPassword('');
      
      // Refresh user list after a short delay
      setTimeout(fetchUsers, 1000);
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer l\'utilisateur',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedCompanyId || !selectedRole) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une entreprise et un rôle',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Check if role already exists
      const existingRole = selectedUser.roles.find(
        r => r.company_id === selectedCompanyId
      );

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: selectedRole })
          .eq('id', existingRole.id);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: selectedUser.id,
            role: selectedRole,
            company_id: selectedCompanyId
          });

        if (error) throw error;
      }

      toast({
        title: 'Accès assigné',
        description: `L'accès a été configuré avec succès`,
      });

      setIsAssignDialogOpen(false);
      setSelectedCompanyId('');
      setSelectedRole('client_viewer');
      fetchUsers();
    } catch (error: any) {
      console.error('Error assigning role:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'assigner l\'accès',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAccess = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast({
        title: 'Accès retiré',
        description: 'L\'accès a été retiré avec succès',
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error removing access:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de retirer l\'accès',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-accent hover:bg-accent/90"><Shield className="w-3 h-3 mr-1" /> Super Admin</Badge>;
      case 'client_admin':
        return <Badge className="bg-primary hover:bg-primary/90"><Settings className="w-3 h-3 mr-1" /> Admin</Badge>;
      case 'client_viewer':
        return <Badge variant="secondary"><Eye className="w-3 h-3 mr-1" /> Viewer</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Accès refusé</h1>
          <p className="text-muted-foreground">Vous n'avez pas les droits d'accès à cette page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4 px-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Gestion des Utilisateurs</h1>
              <p className="text-sm text-primary-foreground/70">
                {users.length} utilisateur{users.length > 1 ? 's' : ''} inscrit{users.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-80"
            />
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Créer un utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                <DialogDescription>
                  L'utilisateur recevra un email pour confirmer son compte.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input
                    id="name"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Jean Dupont"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="jean@entreprise.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe temporaire</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Min. 6 caractères"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateUser} disabled={submitting}>
                  {submitting ? 'Création...' : 'Créer l\'utilisateur'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users table */}
        <div className="bg-card rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Accès aux dashboards</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Chargement...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{u.full_name || 'Sans nom'}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {u.roles.length === 0 ? (
                          <span className="text-sm text-muted-foreground italic">Aucun accès</span>
                        ) : (
                          u.roles.map((role) => (
                            <div key={role.id} className="flex items-center gap-1">
                              {getRoleBadge(role.role)}
                              {role.company_name && (
                                <Badge variant="outline" className="ml-1">
                                  <Building2 className="w-3 h-3 mr-1" />
                                  {role.company_name}
                                </Badge>
                              )}
                              {role.role !== 'super_admin' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive hover:text-destructive"
                                  onClick={() => handleRemoveAccess(role.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(u.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog open={isAssignDialogOpen && selectedUser?.id === u.id} onOpenChange={(open) => {
                        setIsAssignDialogOpen(open);
                        if (!open) setSelectedUser(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedUser(u)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Assigner accès
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Assigner un accès</DialogTitle>
                            <DialogDescription>
                              Donnez accès à un dashboard pour {u.email}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Entreprise / Dashboard</Label>
                              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner une entreprise" />
                                </SelectTrigger>
                                <SelectContent>
                                  {companies.map((company) => (
                                    <SelectItem key={company.id} value={company.id}>
                                      {company.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Type d'accès</Label>
                              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as 'client_admin' | 'client_viewer')}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="client_viewer">
                                    <div className="flex items-center gap-2">
                                      <Eye className="w-4 h-4" />
                                      Viewer - Lecture seule
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="client_admin">
                                    <div className="flex items-center gap-2">
                                      <Settings className="w-4 h-4" />
                                      Admin - Lecture & écriture
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                              Annuler
                            </Button>
                            <Button onClick={handleAssignRole} disabled={submitting}>
                              {submitting ? 'Assignation...' : 'Assigner l\'accès'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
