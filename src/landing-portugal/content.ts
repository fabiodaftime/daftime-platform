// Textes de la landing Portugal. Séparés des composants pour être relus et
// édités sans toucher au code.
//
// DÉONTOLOGIE OCC : aucune formulation ne porte d'appréciation sur un autre
// cabinet. Tout est écrit du point de vue du vécu de l'entrepreneur.

import { ACCOUNTANT, PRICING } from './config';

/** Titre du hero selon `?a=1..4` — un angle par publicité Meta. */
export const HERO_VARIANTS = {
  // Pub 1 — comprendre sa compta (valeur par défaut)
  1: {
    eyebrow: 'Comptabilité au Portugal',
    title: 'Tu as une société au Portugal. Est-ce que tu comprends ta comptabilité ?',
  },
  // Pub 2 — échéance facturation électronique
  2: {
    eyebrow: 'Facturation électronique',
    title: 'Au 1er janvier 2027, le PDF simple ne suffira plus pour facturer au Portugal.',
  },
  // Pub 3 — prix et transparence
  3: {
    eyebrow: 'Tarifs',
    title: `Ta comptabilité portugaise à partir de ${PRICING.from} ${PRICING.currency} par mois, déclarations annuelles comprises.`,
  },
  // Pub 4 — fin du RNH
  4: {
    eyebrow: 'Fin du régime RNH',
    title: 'Ton RNH se termine. Sais-tu ce que tu paieras l’année suivante ?',
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
  { label: 'Contabilista Certificada', detail: `Inscrite à l’OCC — ${ACCOUNTANT.licence.toLowerCase()}` },
  { label: 'Tout se passe en français', detail: 'Échanges, documents commentés, point mensuel' },
  { label: 'Déclarations annuelles comprises', detail: 'Modelo 22 et IES dans le forfait' },
  { label: 'Cabinet à Lisbonne', detail: 'Présence locale, pas une plateforme à distance' },
] as const;

/** Ligne de réassurance affichée juste sous le bouton du hero. */
export const HERO_REASSURANCE =
  '20 minutes en visio, en français. Sans engagement, et sans rien avoir à changer avant.';

/** Libellé unique du CTA — identique partout sur la page. */
export const CTA_LABEL = 'Réserver 20 minutes';

// ──────────────────────────────────────────────────────────────── Problème ──
export const PROBLEMS = [
  {
    title: 'L’impôt, découvert trop tard',
    body:
      'Le Modelo 22 se dépose au printemps qui suit la clôture, l’IRC se règle derrière. ' +
      'Quand le montant arrive, l’exercice est fermé depuis des mois : il n’y a plus rien à arbitrer.',
  },
  {
    title: 'Des documents signés sans être lus',
    body:
      'Balancete, Modelo 22, IES : des documents en portugais, dans un plan comptable (SNC) ' +
      'qui n’est pas celui que tu connais. Tu signes parce qu’il faut signer.',
  },
  {
    title: 'Un budget annuel impossible à anticiper',
    body:
      'Des honoraires mensuels d’un côté, des prestations facturées au moment des déclarations ' +
      'annuelles de l’autre. Le coût réel de l’année ne se lit qu’à la fin.',
  },
] as const;

// ─────────────────────────────────────────────────────────── Ce qu’on fait ──
export const SERVICES = [
  {
    title: 'Comptabilité courante',
    body:
      'Tenue des livres au référentiel portugais (SNC), rapprochements bancaires, classement ' +
      'des pièces, balancete mensuel.',
  },
  {
    title: 'IVA',
    body:
      'Déclarations périodiques d’IVA, mensuelles ou trimestrielles selon ton régime, ' +
      'récapitulatifs intracommunautaires et suivi des échéances.',
  },
  {
    title: 'IRC et Modelo 22',
    body:
      'Détermination du résultat fiscal, calcul de l’IRC, préparation et dépôt du Modelo 22. ' +
      'Le montant t’est annoncé avant l’échéance, pas après.',
  },
  {
    title: 'IES et dépôt des comptes',
    body:
      'Informação Empresarial Simplificada : comptes annuels, annexes et dépôt légal. ' +
      'Compris dans le forfait, jamais facturé en supplément.',
  },
  {
    title: 'Obligations sociales et déclaratives',
    body:
      'Salaires et déclarations associées, retenues à la source, échéancier annuel tenu à jour ' +
      'et communiqué à l’avance.',
  },
  {
    title: 'Le point mensuel, en français',
    body:
      'Ce que disent tes chiffres, ce qui arrive au calendrier, ce qu’il faut décider. ' +
      'Dit simplement, sans jargon fiscal portugais.',
  },
] as const;

/** Le binôme — mis en avant sous les services. */
export const DUO = {
  title: 'Deux personnes sur ton dossier, pas une',
  members: [
    {
      label: `${ACCOUNTANT.name}, ${ACCOUNTANT.title}`,
      body:
        `Notre partenaire locale, inscrite à l’Ordem dos Contabilistas Certificados ` +
        `(${ACCOUNTANT.licence.toLowerCase()}). C’est elle qui engage sa responsabilité sur tes ` +
        'comptes et signe tes déclarations : au Portugal, c’est une obligation légale, pas une ' +
        'option de confort.',
    },
    {
      label: 'Interlocuteur francophone',
      body:
        'Ton point de contact au quotidien. Il te traduit les documents, t’explique les ' +
        `décisions et fait le lien avec ${ACCOUNTANT.name}. Tu n’as jamais à écrire en portugais.`,
    },
  ],
} as const;

// ───────────────────────────────────────────────────────────────────── RNH ──
export const RNH = {
  title: 'Ton RNH arrive à son terme',
  body:
    'Le statut de résident non habituel dure dix ans à compter de l’année d’inscription. ' +
    'Il n’est pas renouvelable et il n’existe pas de prolongation. À l’issue de ces dix ans, ' +
    'tu bascules dans le régime de droit commun : barème progressif de l’IRS, jusqu’à 48 % sur ' +
    'la tranche la plus haute. Le régime qui lui a succédé (IFICI) n’est pas ouvert aux anciens ' +
    'bénéficiaires du RNH.',
  kicker:
    'La marche se prépare dans les douze à vingt-quatre mois qui précèdent, pas le mois où elle ' +
    'arrive : structure de rémunération, arbitrage entre salaire et dividendes, forme de la société.',
} as const;

// ──────────────────────────────────────────────── Facturation électronique ──
export const EINVOICING = {
  title: 'Facturation électronique : ce qui change',
  body:
    'À cette date, une facture émise sous forme électronique devra porter une signature ou un ' +
    'sceau électronique qualifié garantissant son authenticité et son intégrité. Un PDF simple, ' +
    'envoyé par e-mail sans dispositif qualifié, ne suffira plus.',
  bullets: [
    'Ton outil de facturation doit être certifié par l’Autoridade Tributária et gérer la signature ou le sceau qualifié.',
    'L’émission comme la conservation des factures sont concernées.',
    'Changer d’outil le 2 janvier n’est pas une option : le passage se prépare en amont.',
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
      'responsabilité professionnelle. C’est exactement le rôle que tient notre contabilista.',
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
      'tranche supérieure. Le régime n’est pas renouvelable, et l’IFICI qui lui a succédé n’est pas ' +
      'accessible aux anciens bénéficiaires du RNH. Ce qui se prépare, c’est la structure : comment ' +
      'tu te rémunères, quel arbitrage entre salaire et dividendes, quelle forme de société. Un ' +
      'sujet à ouvrir un à deux ans avant l’échéance.',
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
      'Tu reçois une proposition dans les 48 heures qui suivent l’appel. Une fois signée, la reprise ' +
      'du dossier prend en général deux à trois semaines, le temps de récupérer l’historique et ' +
      'd’effectuer le changement de contabilista. Si une échéance déclarative tombe entre-temps, on ' +
      's’organise pour qu’elle soit tenue.',
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
