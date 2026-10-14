// Textes de la landing « consultation e-commerce ». Tutoiement, phrases courtes,
// vocabulaire e-commerce, pas de jargon comptable. Aucun chiffre inventé,
// aucun témoignage, aucun compteur de clients.

export const CTA_LABEL = 'Réserver mes 20 min offertes';

export const HERO = {
  eyebrow: 'Consultation e-commerce',
  /** La fin du titre (« Offertes. ») est surlignée — voir LandingConsultation. */
  title: '20 minutes avec un expert pour remettre ta structure e-commerce d’aplomb.',
  titleHighlight: 'Offertes.',
  subtitle: 'Société, résidence, flux, encaissements : on fait le point, tu repars avec un plan clair.',
  reassurance: ['20 min en visio', 'Sans engagement', 'Avec Fabio, en direct'],
} as const;

export const PAINS = {
  title: 'Ça te parle ?',
  items: [
    'Tu as une LLC US avec une adresse bidon, et ton compte bancaire ou PSP saute.',
    'Tu vis à l’étranger, mais ta société est restée en France.',
    'Paiements bloqués, fonds retenus, ta banque te demande l’origine des fonds.',
    'Ton CA a explosé, ta structure n’a pas bougé.',
    'Tu ne sais pas où tu dois payer tes impôts perso.',
  ],
  outro: 'Si tu t’es reconnu dans une ligne, ces 20 minutes sont pour toi.',
} as const;

export const STEPS = {
  title: 'Comment ça se passe',
  items: [
    { title: 'Tu réserves', text: 'Tu choisis ton créneau et tu réponds à 3 questions rapides : où tu vis, où est ta société, ton CA mensuel.' },
    { title: '20 min en visio', text: 'On fait le point ensemble : ta société, ta résidence, tes flux, la façon dont tu encaisses.' },
    { title: 'Tu repars avec une reco claire', text: 'Tu sais quoi faire et dans quel ordre. Si on peut t’aider, on te dit comment et combien.' },
  ],
} as const;

/** `direct` : Daftime y intervient en direct ; sinon via un partenaire sur place. */
export const COUNTRIES = {
  title: 'Où on t’accompagne',
  intro: 'Création de société, compta, fiscalité : des partenaires dans chaque pays, un seul interlocuteur — nous.',
  items: [
    'États-Unis',
    'Royaume-Uni',
    'Dubaï',
    'Chypre',
    'Hong Kong',
    'Allemagne',
    'Portugal',
    'France',
  ],
} as const;

export const ABOUT = {
  title: 'Qui est derrière',
  firm: 'Daftime Advisory, cabinet basé à Dubaï. Comptabilité, fiscalité et conseil sur les Émirats, la France et le Portugal.',
  services: [
    'Création de ta structure (LLC US, LTD UK, Chypre, Dubaï, Hong Kong…)',
    'Comptabilité',
    'CFO externalisé',
  ],
  servicesLead: 'Après l’appel, si tu as besoin d’aller plus loin :',
} as const;

export const FAQ = [
  {
    q: 'C’est vraiment gratuit ?',
    a: 'Oui, les 20 premières minutes. Si on doit aller plus loin, on te propose une consultation payante ou un accompagnement, sans obligation.',
  },
  {
    q: 'C’est pour qui ?',
    a: 'Les e-commerçants (Shopify, marketplaces, dropshipping, marques) qui ont déjà du chiffre d’affaires.',
  },
  {
    q: 'Je dois préparer quelque chose ?',
    a: 'Juste savoir où tu vis, où est ta société et comment tu encaisses.',
  },
] as const;

export const BOOKING = {
  title: 'Réserve tes 20 minutes',
  text: 'Choisis ton créneau. 3 questions rapides avant de valider : où tu vis, où est ta société, ton CA mensuel.',
  confirmed: 'C’est réservé. Tu reçois l’invitation et le lien de visio par e-mail.',
} as const;

export const THANKS = {
  title: 'C’est réservé.',
  text: 'Tu reçois l’invitation et le lien de visio par e-mail. D’ici là, garde sous la main : où tu vis, où est ta société, comment tu encaisses.',
  back: 'Retour à la page',
} as const;
