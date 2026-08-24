// Barrière d'erreur : évite l'écran blanc si un composant enfant lève une exception au rendu.
// Affiche un message lisible (et le détail de l'erreur) au lieu de démonter tout l'arbre React.
import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode; label?: string };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error) { console.error('[ErrorBoundary]', this.props.label ?? '', error); }
  render() {
    if (this.state.error) {
      return (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5">
          <div className="font-semibold text-destructive">Cet écran n'a pas pu s'afficher</div>
          <p className="text-sm text-muted-foreground mt-1">Réessaie plus tard, ou signale-le à ton conseiller.</p>
          <pre className="mt-3 text-[11px] text-muted-foreground/80 whitespace-pre-wrap break-words max-h-40 overflow-auto">{String(this.state.error?.message ?? this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
