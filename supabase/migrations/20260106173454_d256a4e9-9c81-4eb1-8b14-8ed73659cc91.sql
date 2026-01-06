-- Enum pour les rôles d'application
CREATE TYPE public.app_role AS ENUM ('super_admin', 'client_admin', 'client_viewer');

-- Enum pour les types de dashboard/layout
CREATE TYPE public.dashboard_layout AS ENUM ('cw_partners', 'bocuse', 'lle_education', 'default');

-- Table des entreprises/clients
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    layout_type public.dashboard_layout NOT NULL DEFAULT 'default',
    currency TEXT NOT NULL DEFAULT 'EUR',
    fiscal_year_start INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des profils utilisateurs
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des rôles utilisateurs (séparée pour sécurité)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role, company_id)
);

-- Table des catégories de dépenses (liste maître)
CREATE TABLE public.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des données financières mensuelles
CREATE TABLE public.monthly_financials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    
    -- Revenus
    revenue_actual NUMERIC(15,2) NOT NULL DEFAULT 0,
    revenue_budget NUMERIC(15,2) NOT NULL DEFAULT 0,
    revenue_prior_year NUMERIC(15,2) NOT NULL DEFAULT 0,
    
    -- Trésorerie
    cash_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
    
    -- Taux de change (si applicable)
    fx_rate NUMERIC(10,4),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    UNIQUE (company_id, year, month)
);

-- Table des dépenses détaillées par catégorie
CREATE TABLE public.monthly_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monthly_financial_id UUID NOT NULL REFERENCES public.monthly_financials(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
    
    amount_actual NUMERIC(15,2) NOT NULL DEFAULT 0,
    amount_budget NUMERIC(15,2) NOT NULL DEFAULT 0,
    amount_prior_year NUMERIC(15,2) NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    UNIQUE (monthly_financial_id, category_id)
);

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_expenses ENABLE ROW LEVEL SECURITY;

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(_user_id, 'super_admin')
$$;

-- Function to check if user has access to a company
CREATE OR REPLACE FUNCTION public.has_company_access(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND (role = 'super_admin' OR company_id = _company_id)
    )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Super admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- RLS Policies for companies
CREATE POLICY "Users can view companies they have access to"
ON public.companies FOR SELECT
TO authenticated
USING (public.has_company_access(auth.uid(), id));

CREATE POLICY "Super admins can manage companies"
ON public.companies FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- RLS Policies for expense_categories (visible to all authenticated)
CREATE POLICY "Authenticated users can view categories"
ON public.expense_categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Super admins can manage categories"
ON public.expense_categories FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- RLS Policies for monthly_financials
CREATE POLICY "Users can view financials for their companies"
ON public.monthly_financials FOR SELECT
TO authenticated
USING (public.has_company_access(auth.uid(), company_id));

CREATE POLICY "Super admins can manage all financials"
ON public.monthly_financials FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- RLS Policies for monthly_expenses
CREATE POLICY "Users can view expenses for their companies"
ON public.monthly_expenses FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.monthly_financials mf
        WHERE mf.id = monthly_financial_id
          AND public.has_company_access(auth.uid(), mf.company_id)
    )
);

CREATE POLICY "Super admins can manage all expenses"
ON public.monthly_expenses FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monthly_financials_updated_at
    BEFORE UPDATE ON public.monthly_financials
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default expense categories
INSERT INTO public.expense_categories (name, display_order) VALUES
    ('Admin', 1),
    ('Consulting', 2),
    ('Salaries', 3),
    ('Rent', 4),
    ('Marketing', 5),
    ('Travel', 6),
    ('IT & Software', 7),
    ('Professional Services', 8),
    ('Other', 9);