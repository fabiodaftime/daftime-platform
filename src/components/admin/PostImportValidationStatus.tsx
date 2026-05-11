// Statut de validation post-import (admin)
// ----------------------------------------
// Affiche le résultat de la dernière exécution des validateurs (alignement +
// recalcul YTD), déclenchée automatiquement après chaque import CSV/Excel.
// Se met à jour en temps réel via l'événement 'post-import-validation'.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import {
  getLastPostImportValidation,
  type PersistedPostImportValidation,
} from '@/lib/postImportValidation';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function PostImportValidationStatus() {
  const [last, setLast] = useState<PersistedPostImportValidation | null>(null);

  useEffect(() => {
    setLast(getLastPostImportValidation());
    const onUpdate = () => setLast(getLastPostImportValidation());
    window.addEventListener('post-import-validation', onUpdate);
    return () => window.removeEventListener('post-import-validation', onUpdate);
  }, []);

  if (!last) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
        <Clock className="inline w-4 h-4 mr-2" />
        Aucun import n'a encore déclenché de contrôle de validation. Le statut s'affichera
        ici automatiquement après le prochain import CSV/Excel.
      </div>
    );
  }

  const isOk = last.status === 'ok';
  const Icon = isOk ? CheckCircle2 : AlertTriangle;
  const tone = isOk ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-800 bg-amber-50 border-amber-200';
  const dot = isOk ? 'bg-emerald-500' : 'bg-amber-500';

  return (
    <div className={`rounded-lg border p-4 ${tone}`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <span className={`mt-1 inline-block w-2.5 h-2.5 rounded-full ${dot} shadow`}></span>
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <Icon className="w-4 h-4" />
              {isOk
                ? 'Contrôle d\'alignement & recalcul YTD : OK'
                : 'Contrôle d\'alignement & recalcul YTD : écarts détectés'}
            </div>
            <div className="text-xs mt-1 opacity-90">
              Dernier import : <strong>{last.source}</strong> · {last.inserted} ligne(s) · {formatDate(last.timestamp)}
            </div>
          </div>
        </div>
        <Link
          to="/dashboard-prime-circle-agency"
          className="inline-flex items-center gap-1 text-xs font-semibold underline-offset-2 hover:underline"
        >
          Voir le journal de validation <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
        <div className="rounded border bg-white/60 p-3">
          <div className="font-semibold mb-1">Alignement (gross / net / expenses)</div>
          <div className="font-mono">
            {last.alignment.monthsOk}/{last.alignment.monthsTotal} mois OK
            {last.alignment.monthsWarning > 0 && (
              <> · {last.alignment.monthsWarning} en écart · {last.alignment.issuesCount} contrôle(s) hors tolérance</>
            )}
          </div>
        </div>
        <div className="rounded border bg-white/60 p-3">
          <div className="font-semibold mb-1">Recalcul YTD & champs dérivés</div>
          <div className="font-mono">
            {last.ytd.correctionsCount === 0
              ? 'Tous les YTD et champs dérivés alignés.'
              : `${last.ytd.correctionsCount} valeur(s) à corriger sur ${last.ytd.monthsAffected} mois`}
          </div>
        </div>
      </div>
    </div>
  );
}
