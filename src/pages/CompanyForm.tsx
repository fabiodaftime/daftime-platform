import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type DashboardLayout = Database['public']['Enums']['dashboard_layout'];

const LAYOUT_OPTIONS: { value: DashboardLayout; label: string }[] = [
  { value: 'cw_partners', label: 'CW Partners' },
  { value: 'cwp_pl_2025', label: 'CWP P&L 2025 (accès séparé)' },
  { value: 'bocuse', label: 'Bocuse' },
  { value: 'lle_education', label: 'LLE Education' },
  { value: 'default', label: 'Default' },
];

const CURRENCY_OPTIONS = [
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'CHF', label: 'Swiss Franc (CHF)' },
];

export default function CompanyForm() {
  const { id } = useParams();
  const isEditing = id && id !== 'new';
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    layout_type: 'default' as DashboardLayout,
    currency: 'EUR',
    fiscal_year_start: 1,
  });

  useEffect(() => {
    if (isEditing) {
      fetchCompany();
    }
  }, [id]);

  const fetchCompany = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          name: data.name,
          logo_url: data.logo_url || '',
          layout_type: data.layout_type,
          currency: data.currency,
          fiscal_year_start: data.fiscal_year_start,
        });
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données du client',
        variant: 'destructive',
      });
      navigate('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('companies')
          .update({
            name: formData.name,
            logo_url: formData.logo_url || null,
            layout_type: formData.layout_type,
            currency: formData.currency,
            fiscal_year_start: formData.fiscal_year_start,
          })
          .eq('id', id);

        if (error) throw error;
        toast({ title: 'Client mis à jour avec succès' });
      } else {
        const { error } = await supabase
          .from('companies')
          .insert({
            name: formData.name,
            logo_url: formData.logo_url || null,
            layout_type: formData.layout_type,
            currency: formData.currency,
            fiscal_year_start: formData.fiscal_year_start,
          });

        if (error) throw error;
        toast({ title: 'Client créé avec succès' });
      }

      navigate('/');
    } catch (error) {
      console.error('Error saving company:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le client',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Client supprimé' });
      navigate('/');
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le client',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-6">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? 'Modifier le client' : 'Nouveau client'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de l'entreprise *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: CW Partners"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo_url">URL du logo</Label>
                <Input
                  id="logo_url"
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="layout_type">Type de dashboard</Label>
                  <Select
                    value={formData.layout_type}
                    onValueChange={(value: DashboardLayout) => setFormData({ ...formData, layout_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LAYOUT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Devise</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fiscal_year_start">Début de l'année fiscale</Label>
                <Select
                  value={formData.fiscal_year_start.toString()}
                  onValueChange={(value) => setFormData({ ...formData, fiscal_year_start: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <SelectItem key={month} value={month.toString()}>
                        {new Date(2024, month - 1, 1).toLocaleString('fr-FR', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
                {isEditing && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
