// Textes de la landing Portugal. Séparés des composants pour être relus et
// édités sans toucher au code.
//
// DÉONTOLOGIE OCC : aucune formulation ne porte d'appréciation sur un autre
// cabinet. Tout est écrit du point de vue du vécu de l'entrepreneur.

import { ACCOUNTANT, OFFICES, PARTNER, PRICING } from './config';

/**
 * Titre du hero selon `?a=` — un angle par publicité Meta.
 *
 * Numérotation volontairement non contiguë. Deux angles ont été abandonnés
 * avec leur section : le 2 (facturation électronique 2027) et le 4 (fin du
 * RNH, dont la campagne est arrêtée). Le 3 garde son numéro d'origine plutôt
 * que d'être renuméroté, pour que « pub 3 » reste `?a=3` partout — brief,
 * campagnes Meta et code. Toute autre valeur retombe sur la variante 1, donc
 * une ancienne URL en circulation reste fonctionnelle.
 *
 * Le sujet RNH reste traité dans la FAQ : la question est légitime pour
 * l'audience, c'est seulement l'angle publicitaire qui disparaît.
 */
export const HERO_VARIANTS = {
  // Pub 1 — comprendre sa compta (valeur par défaut)
  1: {
    eyebrow: 'Comptabilité au Portugal',
    title: 'Tu as une société au Portugal. Est-ce que tu comprends ta comptabilité ?',
  },
  // Pub 3 — prix et transparence
  3: {
    eyebrow: 'Tarifs',
    title: `Ta comptabilité portugaise à partir de ${PRICING.from} ${PRICING.currency} par mois, déclarations annuelles comprises.`,
  },
} as const;

export type HeroVariantKey = keyof typeof HERO_VARIANTS;

export const HERO_SUBTITLE =
  'Cabinet franco-portugais. Ta compta portugaise, expliquée en français.';

/**
 * Bandeau de crédibilité, juste sous le hero.
 *
 * Le pattern « Trust & Authority » place la preuve en position 2, avant même
 * l'exposé du problème, et cite « credentials cachés » comme anti-pattern.
 * Aucun élément inventé ici : la cédula est vérifiable auprès de l'OCC, le
 * reste décrit le service tel qu'il est vendu. Pas de logo client, pas de
 * chiffre d'accompagnement tant qu'il n'y en a pas de réel.
 */
export const PROOF = [
  {
    label: `${ACCOUNTANT.name}, associée`,
    detail: `${ACCOUNTANT.title} inscrite à l’OCC — ${ACCOUNTANT.licence.toLowerCase()}`,
  },
  { label: 'Tout se passe en français', detail: 'Échanges, documents commentés, point mensuel' },
  { label: 'Déclarations annuelles comprises', detail: 'Modelo 22 et IES dans le forfait' },
  {
    label: OFFICES.count,
    detail: `${OFFICES.where}, pas une plateforme à distance`,
  },
] as const;

/** Ligne de réassurance affichée juste sous le bouton du hero. */
export const HERO_REASSURANCE =
  '20 minutes en visio, en français. Sans engagement, et sans rien avoir à changer avant.';

/** Libellé unique du CTA — identique partout sur la page. */
export const CTA_LABEL = 'Réserver 20 minutes';

/**
 * Micro-réassurance placée sous les CTA de milieu et de fin de page.
 * Plus courte que celle du hero : à ce stade le visiteur a déjà lu l'offre,
 * il lui manque juste la permission de cliquer.
 */
export const CTA_REASSURANCE = 'Sans engagement. Tu repars avec une réponse claire, même si tu ne travailles pas avec nous.';

// ───────────────────────────────────────────── Friction → réponse (fusionné) ──
/**
 * Les cinq points de friction réellement entendus au téléphone, chacun suivi
 * IMMÉDIATEMENT de sa réponse.
 *
 * Ils vivaient dans deux sections séparées : le lecteur lisait cinq plaintes,
 * puis devait retenir l'ordre pour retrouver cinq réponses un écran plus bas.
 * 29 % de la hauteur de la page pour un argument qui ne se refermait jamais.
 * Ici la promesse répond à la douleur sur la même ligne.
 *
 * REGISTRE : `quote` à la première personne, comme les PAINS des LP
 * e-commerce. Le lecteur doit se reconnaître, pas lire l'analyse de son cas.
 *
 * DÉONTOLOGIE OCC : chaque citation décrit le vécu de l'entrepreneur, jamais
 * la performance d'un autre cabinet. « J'attends une réponse depuis dix jours »
 * est recevable ; « les cabinets portugais ne répondent pas » ne le serait pas.
 * Ne jamais généraliser en réécrivant ces lignes.
 */
export const ARGUMENTS = [
  {
    quote: '« J’ai monté ma société vite. Je ne sais pas si c’est la bonne forme. »',
    answer: 'On revoit la structure',
    detail:
      'Unipessoal, Lda, indépendant : on compare ce que tu paies aujourd’hui et ce que ça ' +
      'donnerait autrement. Si le changement ne vaut pas le coup, on te le dit aussi.',
  },
  {
    quote: '« Mon comptable saisit mes factures. Pour le reste, je me débrouille. »',
    answer: 'Du conseil, pas seulement de la saisie',
    detail:
      'Rémunération, arbitrage entre salaire et dividendes, seuils d’IVA : les décisions qui ' +
      'coûtent se prennent avant la clôture, pas après.',
  },
  {
    quote: '« On ne se comprend pas, alors j’ai arrêté de poser des questions. »',
    answer: 'Tout se passe en français',
    detail:
      'Tes documents te sont expliqués, pas seulement transmis. Jamais besoin de déchiffrer un ' +
      'balancete ni d’écrire en portugais.',
  },
  {
    quote: '« Je ne sais pas exactement ce que je paie, ni pourquoi. »',
    answer: 'Un forfait annoncé d’avance',
    detail:
      'Un montant mensuel qui couvre l’année entière, déclarations annuelles comprises. Rien ne ' +
      's’ajoute au moment du Modelo 22.',
  },
  {
    // ⚠️ ENGAGEMENT PUBLIC — à confirmer avant diffusion, et à tenir.
    quote: '« J’attends une réponse depuis dix jours. »',
    answer: 'Une réponse sous 24 heures ouvrées',
    detail: 'En français, par une personne qui connaît déjà ton dossier.',
  },
] as const;

/** Rappel compact des obligations couvertes — le détail est dans le bloc tarifaire. */
export const COVERED =
  'Comptabilité courante, IVA, IRC et Modelo 22, IES, obligations sociales : tout est compris ' +
  'dans le forfait.';

/**
 * Le duo — mis en avant sous les services.
 *
 * Les deux blocs décrivent la MÊME maison à deux échelles : l'équipe qui tient
 * le dossier à Lisbonne, et le groupe derrière elle. Ne jamais les écrire comme
 * deux parties qui collaborent — Patrícia n'est pas un prestataire externe,
 * elle est associée du cabinet.
 */
export const DUO = {
  title: 'Une équipe sur place, un groupe derrière',
  members: [
    {
      label: `${ACCOUNTANT.name} et ${PARTNER.name}`,
      body:
        `Patrícia est ${ACCOUNTANT.role.toLowerCase()}, ${ACCOUNTANT.title} : c’est elle qui ` +
        'engage sa responsabilité sur tes comptes et signe tes déclarations. Fabio est ' +
        `${PARTNER.role}, c’est lui que tu as au téléphone. Leur équipe tient ta comptabilité ` +
        `depuis ${OFFICES.where}.`,
    },
    {
      label: 'Le groupe Daftime',
      body:
        'Le groupe accompagne des dirigeants dont l’activité ne tient pas dans un seul pays. ' +
        'Français, portugais, anglais. Et parce que nous connaissons le référentiel portugais ' +
        'comme la logique fiscale française, nous voyons quand une décision prise d’un côté a ' +
        'des conséquences de l’autre.',
    },
  ],
} as const;

// ───────────────────────────────────────────────────────────────────── FAQ ──
export const FAQ = [
  {
    q: 'Suis-je obligé d’avoir un contabilista certificado ?',
    a:
      'Oui, dès lors que ta société relève de la comptabilité organisée, ce qui est le cas de la ' +
      'quasi-totalité des sociétés commerciales portugaises. Les déclarations fiscales doivent être ' +
      'établies et signées par un contabilista certificado inscrit à l’OCC, qui engage sa ' +
      `responsabilité professionnelle. C’est exactement le rôle que tient ${ACCOUNTANT.name}, ` +
      'associée du cabinet.',
  },
  {
    q: 'Comment se passe le changement de cabinet ?',
    a:
      'On récupère l’historique comptable et les accès nécessaires, on procède au changement de ' +
      'contabilista certificado auprès de l’Autoridade Tributária, puis on reprend le dossier à la ' +
      'date convenue. C’est une démarche courante et encadrée, et nous nous en occupons. De ton ' +
      'côté : une signature et la transmission de tes documents.',
  },
  {
    q: 'En quelle langue je communique ?',
    a:
      'En français, toujours. E-mails, appels, documents commentés, point mensuel : tout se fait en ' +
      'français avec ton interlocuteur. Les déclarations officielles sont bien sûr déposées en ' +
      'portugais auprès de l’administration, mais tu n’as ni à les rédiger ni à les traduire.',
  },
  {
    q: 'Que se passe-t-il à la fin de mon RNH ?',
    a:
      'Tu passes au barème progressif de l’IRS de droit commun, qui monte jusqu’à 48 % sur la ' +
      'tranche supérieure, et le régime n’est pas renouvelable. Ce qui se prépare, c’est la ' +
      'structure : comment tu te rémunères, quel arbitrage entre salaire et dividendes, quelle ' +
      'forme de société. Un sujet à ouvrir un à deux ans avant l’échéance — on regarde ta ' +
      'situation pendant l’appel.',
  },
  {
    q: 'Combien ça coûte ?',
    a:
      `À partir de ${PRICING.from} ${PRICING.currency} par mois, hors IVA. Le forfait exact dépend ` +
      'du volume d’activité de ta société ; il t’est annoncé dans la proposition qui suit l’appel, ' +
      'et il ne bouge pas en cours d’année. Les déclarations annuelles, Modelo 22 et IES, sont ' +
      'comprises : elles ne font pas l’objet d’une facturation séparée en fin d’exercice.',
  },
  {
    q: 'Sous quel délai on démarre ?',
    a:
      'Le devis part dans les 24 heures qui suivent l’appel. Ensuite, la date de bascule dépend ' +
      'surtout de ton engagement avec ton comptable actuel : l’usage est d’attendre la fin de la ' +
      'déclaration d’IVA en cours pour changer, ce qui évite de couper un exercice déclaratif en ' +
      'deux. Si tu signes entre-temps, on prend la transition en main directement — récupération ' +
      'de l’historique, changement de contabilista, coordination avec le cabinet sortant.',
  },
  {
    q: 'Je n’ai pas encore de société au Portugal, c’est trop tôt ?',
    a:
      'Non, c’est même le bon moment. La forme juridique, le régime d’IVA, la domiciliation et la ' +
      'façon dont tu te rémunères se décident avant la constitution. Les reprendre après coûte plus ' +
      'cher que de les poser correctement au départ.',
  },
  {
    q: 'Est-ce que vous reprenez un exercice en retard ?',
    a:
      'Oui. Un retard déclaratif se rattrape, avec des régularisations et parfois des pénalités qu’il ' +
      'vaut mieux chiffrer tôt. Dis-le pendant l’appel : on mesure l’ampleur du retard et on te dit ' +
      'franchement ce que la remise à niveau représente.',
  },
] as const;
