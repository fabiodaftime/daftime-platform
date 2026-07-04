import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UploadCloud, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

interface DocRow {
  id: string;
  cat: string;
  folder: string;
  file: string;
  kb: number;
  storage_path: string | null;
}

interface UploadStatus {
  name: string;
  status: 'pending' | 'matched' | 'uploaded' | 'unmatched' | 'error';
  message?: string;
  matchedId?: string;
}

const BUCKET = 'dataroom';

function norm(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export default function AdminDataroomUpload() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('dataroom_documents' as any)
      .select('id,cat,folder,file,kb,storage_path')
      .order('cat')
      .order('folder')
      .order('file');
    if (!error) setDocs((data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const byName = useMemo(() => {
    const m = new Map<string, DocRow>();
    docs.forEach(d => m.set(norm(d.file), d));
    return m;
  }, [docs]);

  const counts = useMemo(() => {
    const total = docs.length;
    const uploaded = docs.filter(d => !!d.storage_path).length;
    return { total, uploaded, missing: total - uploaded };
  }, [docs]);

  const handleFiles = async (files: FileList | File[]) => {
    setBusy(true);
    const list = Array.from(files);
    const initial: UploadStatus[] = list.map(f => ({ name: f.name, status: 'pending' }));
    setUploads(initial);

    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      const match = byName.get(norm(f.name));
      if (!match) {
        setUploads(prev => prev.map((u, j) => j === i ? { ...u, status: 'unmatched', message: 'Aucun document correspondant dans l\'inventaire' } : u));
        continue;
      }
      const path = `${match.cat}/${match.folder}/${match.file}`;
      setUploads(prev => prev.map((u, j) => j === i ? { ...u, status: 'matched', matchedId: match.id, message: path } : u));
      const up = await supabase.storage.from(BUCKET).upload(path, f, { upsert: true, contentType: f.type || undefined });
      if (up.error) {
        setUploads(prev => prev.map((u, j) => j === i ? { ...u, status: 'error', message: up.error!.message } : u));
        continue;
      }
      const updateRes = await supabase
        .from('dataroom_documents' as any)
        .update({ storage_path: path, uploaded_at: new Date().toISOString() } as any)
        .eq('id', match.id);
      if (updateRes.error) {
        setUploads(prev => prev.map((u, j) => j === i ? { ...u, status: 'error', message: updateRes.error!.message } : u));
        continue;
      }
      setUploads(prev => prev.map((u, j) => j === i ? { ...u, status: 'uploaded', message: path } : u));
    }
    setBusy(false);
    load();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', fontFamily: 'Poppins, system-ui, sans-serif', color: '#1A1D56' }}>
      <header style={{ background: '#1A1D56', color: '#fff', padding: '18px 32px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <Button variant="ghost" size="sm" onClick={() => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/'))} style={{ color: '#fff' }}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
        <div style={{ fontWeight: 600, fontSize: 16 }}>Data room Ampfora — Dépôt des documents</div>
        <span style={{ marginLeft: 'auto', background: '#D6D303', color: '#1A1D56', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 12, letterSpacing: 0.3 }}>SUPER ADMIN</span>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 32px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 22 }}>
          <Stat label="Inventaire total" value={counts.total} />
          <Stat label="Déposés" value={counts.uploaded} accent />
          <Stat label="À déposer" value={counts.missing} warn />
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          style={{
            border: `2px dashed ${dragOver ? '#D6D303' : '#1A1D56'}`,
            background: dragOver ? '#FDFDEF' : '#fff',
            borderRadius: 14,
            padding: '46px 24px',
            textAlign: 'center',
            transition: 'all .15s',
            cursor: 'pointer',
          }}
          onClick={() => document.getElementById('drFileInput')?.click()}
        >
          <UploadCloud size={42} color="#1A1D56" style={{ margin: '0 auto 10px' }} />
          <div style={{ fontWeight: 600, fontSize: 15 }}>Glissez-déposez vos fichiers ici</div>
          <div style={{ fontSize: 12.5, color: '#6B6B6B', marginTop: 4 }}>
            Les fichiers sont rattachés automatiquement à l'inventaire par correspondance de nom (insensible aux accents/casse).
          </div>
          <input
            id="drFileInput" type="file" multiple style={{ display: 'none' }}
            onChange={e => { if (e.target.files?.length) handleFiles(e.target.files); e.currentTarget.value = ''; }}
          />
        </div>

        {uploads.length > 0 && (
          <div style={{ marginTop: 22, background: '#fff', border: '1px solid #E8E0D3', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid #E8E0D3', fontWeight: 600, fontSize: 13 }}>
              {busy ? 'Traitement en cours…' : 'Résultats du dépôt'}
              <span style={{ float: 'right', fontWeight: 400, color: '#6B6B6B', fontSize: 12 }}>
                {uploads.filter(u => u.status === 'uploaded').length} déposé(s) · {uploads.filter(u => u.status === 'unmatched').length} non rattaché(s) · {uploads.filter(u => u.status === 'error').length} erreur(s)
              </span>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 380, overflowY: 'auto' }}>
              {uploads.map((u, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px', borderBottom: '1px solid #F2EFE8', fontSize: 12.5 }}>
                  <StatusIcon s={u.status} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
                  <span style={{ color: '#6B6B6B', fontSize: 11.5, maxWidth: '50%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!loading && counts.missing > 0 && (
          <div style={{ marginTop: 22, fontSize: 12, color: '#6B6B6B' }}>
            <strong>{counts.missing}</strong> document(s) encore à déposer dans la data room.
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value, accent, warn }: { label: string; value: number; accent?: boolean; warn?: boolean }) {
  return (
    <div style={{
      background: accent ? '#1A1D56' : '#fff',
      color: accent ? '#fff' : '#1A1D56',
      border: '1px solid ' + (accent ? '#1A1D56' : '#E8E0D3'),
      borderRadius: 12, padding: '16px 18px',
    }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, color: accent ? '#C9CADF' : '#6B6B6B', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4, color: warn ? '#9A6B00' : undefined }}>{value}</div>
    </div>
  );
}

function StatusIcon({ s }: { s: UploadStatus['status'] }) {
  if (s === 'uploaded') return <CheckCircle2 size={16} color="#1E7E4A" />;
  if (s === 'error') return <AlertCircle size={16} color="#B23A3A" />;
  if (s === 'unmatched') return <AlertCircle size={16} color="#9A6B00" />;
  return <FileText size={16} color="#6B6B6B" />;
}
