import { useParams } from 'react-router-dom';
import { EntityScopedDashboard } from '@/components/dashboard/digit/EntityScopedDashboard';

export default function DashboardComment() {
  const { id = '' } = useParams();
  return <EntityScopedDashboard scope="comment" entityId={id} />;
}
