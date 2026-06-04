UPDATE public.pcgroup_holding_facts
SET frais_total = 17603,
    frais_detail = '[
      {"label": "CFO + Compta Groupe", "amount": 3430},
      {"label": "AI Agent", "amount": 2000},
      {"label": "Salaire Fixe Sales", "amount": 2000},
      {"label": "Tools", "amount": 780},
      {"label": "Travel Expenses", "amount": 2486},
      {"label": "Oh My Desk (Office Rent)", "amount": 86},
      {"label": "Frais Bancaires", "amount": 56},
      {"label": "Reclass OpEx Structuring (Tools, Travel, Lunch, Event, Transport…)", "amount": 6765}
    ]'::jsonb
WHERE month_id = 'may-2026';