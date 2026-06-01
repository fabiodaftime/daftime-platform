import { useParams } from 'react-router-dom';
import { EntityScopedDashboard } from '@/components/dashboard/digit/EntityScopedDashboard';

export default function DashboardDigitCore() {
  const { id = '' } = useParams();
  return <EntityScopedDashboard scope="core" entityId={id} />;
}
