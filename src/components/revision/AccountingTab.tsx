import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRevisionEntities } from './useRevisionData';
import { RevisionEntityView } from './RevisionEntityView';
import { Card } from '@/components/ui/card';

interface Props {
  companyId: string;
  currency?: string;
}

export function AccountingTab({ companyId, currency }: Props) {
  const { entities, loading } = useRevisionEntities(companyId);

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground text-sm">Chargement…</div>;
  }

  if (!entities.length) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-muted-foreground">Aucune sous-entité configurée pour ce dossier.</p>
      </Card>
    );
  }

  return (
    <Tabs defaultValue={entities[0].id} className="w-full">
      <TabsList className="bg-dashboard-card border border-dashboard-border mb-4">
        {entities.map((e) => (
          <TabsTrigger
            key={e.id}
            value={e.id}
            className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          >
            {e.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {entities.map((e) => (
        <TabsContent key={e.id} value={e.id} className="animate-fade-in">
          <RevisionEntityView companyId={companyId} entity={e} currency={currency} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
