// Fixtures SYNTHÉTIQUES aux en-têtes EXACTS des vrais exports (Shopify Analytics, Bigblue, Pennylane).
// Aucune donnée client : chiffres ronds inventés, pour vérifier les calculs au centime.
// Chaque cas reprend un piège rencontré en production (voir les tests).

export const ctx = (period: string, extra: Record<string, unknown> = {}) =>
  ({ reporting: "EUR", factor: { EUR: 1 }, period, activity: "ecommerce", ...extra });

// Shopify « Total sales over time » : 1 ligne par mois + colonnes « (previous_year) » à NE PAS lire.
export const TOTAL_SALES = [
  `"Month","Orders","Gross sales","Discounts","Sales reversals","Net sales","Shipping charges","Duties","Additional fees","Taxes","Total sales","Month (previous_year)","Orders (previous_year)","Net sales (previous_year)","Net sales (previous_year) "`,
  `"2026-07-01",100,1000,-100,-50,850,30,0,0,170,1050,"2025-07-01",90,999999,-12.5`,
  `"2026-08-01",120,1200,-120,-60,1020,36,0,0,204,1260,"2025-08-01",95,888888,14.8`,
].join("\n");

// Shopify « Average order value over time » : brut légèrement différent (définition Shopify) → contrôle.
export const AOV = [
  `"Month","Gross sales","Discounts","Orders","Average order value","Month (previous_year)","Gross sales (previous_year)"`,
  `"2026-07-01",995,-100,100,8.95,"2025-07-01",500`,
  `"2026-08-01",1190,-120,120,8.92,"2025-08-01",600`,
].join("\n");

export const NEW_VS_RETURNING = [
  `"New or returning customer","Month","Customers","Orders","Total sales","Month (previous_year)","Customers (previous_year)"`,
  `"Returning","2026-07-01",20,25,300,"2025-07-01",5`,
  `"New","2026-07-01",70,70,700,"2025-07-01",40`,
  `"New","2026-08-01",80,80,800,"2025-08-01",50`,
  `"Returning","2026-08-01",30,40,400,"2025-08-01",8`,
].join("\n");

export const COGS_BY_ORDER = [
  `"Month","Sale ID","Order name","Product title at time of sale","Product variant title at time of sale","Cost of goods sold","Month (previous_year)","Cost of goods sold (previous_year)","Cost of goods sold (previous_year) "`,
  `"2026-07-01",1,"#1","ROBE A","S",9,"2025-07-01",0,`,
  `"2026-08-01",2,"#2","ROBE A","S",10,"2025-08-01",0,`,
  `"2026-08-01",3,"#3","BODY B","M",0,"2025-08-01",0,`,
  `"2026-08-01",4,"#4","ROBE A","M",12.5,"2025-08-01",0,`,
].join("\n");

export const GROSS_PROFIT_BY_PRODUCT_NAME = "Gross profit by product - 2026-01-01 - 2026-08-31.csv";
export const GROSS_PROFIT_BY_PRODUCT = [
  `"Product title","Product vendor","Product type","Net items sold","Net sales","Cost of goods sold","Gross margin","Gross profit","Net sales (previous_year)"`,
  `"ROBE A","X","robe",100,5000,1500,0.7,3500,0`,
  `"BODY B","X","body",50,1000,400,0.6,600,0`,
].join("\n");

export const INVENTORY_NAME = "Month-end inventory value - 2026-01-01 - 2026-08-31.csv";
export const INVENTORY = [
  `"Product title","Product variant title","Product variant SKU","Inventory item cost","Ending inventory units","Ending inventory value"`,
  `"ROBE A","S","SKU-1",10,5,50`,
  `"BODY B","M","SKU-2",7,3,21`,
].join("\n");

// Détail de facture Bigblue : dates JJ/MM/AAAA ET J/M/AAAA (ré-export), lignes d'avoir non datées.
const BB_HEADER = "Date,ID,Service,Description,Quantity,UnitPrice,Price,Currency,Fulfillment,Destination country,Weight,Shipping method,Billing country";
export const BIGBLUE_INVOICE_1 = [
  BB_HEADER,
  "08/08/2026,ORD1,Fulfillment,Fulfillment,1,5.00,5.00,EUR,,FR,,,FR",
  "9/8/2026,ORD2,Shipping - Return,Return label,1,2.50,2.50,EUR,,FR,,,FR",
  "31/07/2026,ORD3,Fulfillment,Fulfillment,1,4.00,4.00,EUR,,FR,,,FR",
  ",ORD4,Refund,100% Refund - Shipment X,1,-1.50,-1.50,EUR,,,,,FR",
].join("\n");
// Même facture re-téléchargée (« (1) ») : une ligne de plus → c'est elle qu'on garde, jamais les deux.
export const BIGBLUE_INVOICE_1_BIS = BIGBLUE_INVOICE_1 + "\n10/8/2026,ORD5,Storage,Storage,1,1.00,1.00,EUR,,FR,,,FR";
export const BIGBLUE_INVOICE_2 = [BB_HEADER, "20/08/2026,ORD6,Fulfillment,Fulfillment,1,3.00,3.00,EUR,,FR,,,FR"].join("\n");

// Export commandes Bigblue : très large (on n'en lit que quelques colonnes), annulées exclues.
export const BIGBLUE_ORDERS = [
  "Order ID,External Order ID,Order Type,Date,Order Status,Store,Total Price,Number Items Ordered,Customer First Name,Customer Last Name,Customer Email,Address Line 1,City,Postal,Country,Fulfillment_0 ID",
  "O1,#1,Standard,2026-08-02T10:00:00Z,DELIVERED,s1,€100.00,2,Jean,Test,jean@example.com,1 rue X,Paris,75001,FR,F1",
  "O2,#2,Standard,2026-08-03T10:00:00Z,CANCELLED,s1,€40.00,1,Anne,Test,anne@example.com,2 rue Y,Lyon,69001,FR,F2",
  "O3,#3,Standard,2026-08-04T10:00:00Z,RETURNED,s1,€50.00,1,Paul,Test,paul@example.com,3 rue Z,Bruxelles,1000,BE,F3",
  "O4,#4,Standard,2026-07-30T10:00:00Z,DELIVERED,s1,€70.00,3,Lea,Test,lea@example.com,4 rue W,Nice,06000,FR,F4",
].join("\n");

// Relevé Pennylane : pas de colonne de solde, 2 comptes qui ne diffèrent QUE par la casse,
// catégories Pennylane fausses (Snap en « Logiciels »), date J/M/AAAA non complétée.
const PL_HEADER = "Date,Month,Bank account,Wording,Amount,Third,Justified,Comments,State,Type,Suivi de trésorerie";
export const PENNYLANE = [
  PL_HEADER,
  "2026-07-31,7,Error Company,VIR RECU apport,1000,,No,,Booked transaction,,",
  "2026-08-02,8,Error Company,Pre-approved payment (BillUser API) to Snap Group Limited,-100,,No,,Booked transaction,,Logiciels",
  "2026-08-03,8,Error Company,PRELEVEMENT EUROPEEN 123 DE: Google Ireland Limited ID: IE1 MOTIF: ADWORDS:1,-200,,No,,Booked transaction,,",
  "2026-08-04,8,ERROR COMPANY,Charge: gid://shopify/PaymentSession/abc,500,,No,,Booked transaction,,Logiciels",
  "2026-08-05,8,ERROR COMPANY,Refund:  - gid://shopify/PaymentSession/x,-50,,No,,Booked transaction,,Logiciels",
  "2026-08-06,8,Error Company,COTISATION MENSUELLE JAZZ PRO MONTANT HT TVA A 20%,-30,,No,,Booked transaction,,Frais bancaires",
  "2026-08-07,8,Error Company,PRLV EUROPEEN B2B POUR CPTE DE:DGFIP IMPOT MOTIF: TVA-082026,-400,,No,,Booked transaction,,",
  "2026-08-08,8,Error Company,ECHEANCE PRET N°123 CAP 90,-90,,No,,Booked transaction,,",
  "2026-08-09,8,Error Company,Pre-approved payment (BillUser API) to Shopify International Limited,-20,,No,,Booked transaction,,Logiciels",
  "2026-08-10,8,Error Company,PRELEVEMENT EUROPEEN 9 DE: PayPal Europe S.a.r.l. et Cie S.C.A ID: LU96 MOTIF: 1/PAYPAL,-300,,No,,Booked transaction,,",
  "2026-08-11,8,Error Company,000001 VIR INSTANTANE EMIS NET POUR: SARL HANAYAKA 11 08 BQ BNPA CPT 1,-1000,,No,,Booked transaction,,Frais bancaires",
  "27/8/2026,8,Error Company,Pre-approved payment (BillUser API) to Snap Group Limited,-10,,No,,Booked transaction,,Logiciels",
].join("\n");
