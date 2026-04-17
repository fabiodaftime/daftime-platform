import type { RevisionCycleStatus, RevisionChecklistStatus, RevisionAnomalySeverity, RevisionStatus } from './types';

export const cycleStatusLabel = (s: RevisionCycleStatus) => ({
  not_started: 'Non commencé',
  in_progress: 'En cours',
  in_review: 'En revue',
  validated: 'Validé',
  anomaly: 'Anomalie',
}[s]);

export const cycleStatusColor = (s: RevisionCycleStatus) => ({
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  in_review: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  validated: 'bg-green-500/15 text-green-700 dark:text-green-400',
  anomaly: 'bg-red-500/15 text-red-700 dark:text-red-400',
}[s]);

export const cycleStatusDot = (s: RevisionCycleStatus) => ({
  not_started: '⚪',
  in_progress: '🟡',
  in_review: '🔵',
  validated: '🟢',
  anomaly: '🔴',
}[s]);

export const fileStatusLabel = (s: RevisionStatus) => ({
  todo: 'À faire',
  in_progress: 'En cours',
  in_review: 'En revue',
  validated: 'Validé',
  closed: 'Clôturé',
}[s]);

export const checklistStatusLabel = (s: RevisionChecklistStatus) => ({
  todo: 'À faire',
  done: 'Fait',
  na: 'N/A',
  anomaly: 'Anomalie',
}[s]);

export const severityLabel = (s: RevisionAnomalySeverity) => ({
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Élevée',
  blocking: 'Bloquante',
}[s]);

export const severityColor = (s: RevisionAnomalySeverity) => ({
  low: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  medium: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  high: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
  blocking: 'bg-red-500/15 text-red-700 dark:text-red-400',
}[s]);

export const formatCurrency = (v: number, currency = 'AED') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v);

export const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR') : '—';
