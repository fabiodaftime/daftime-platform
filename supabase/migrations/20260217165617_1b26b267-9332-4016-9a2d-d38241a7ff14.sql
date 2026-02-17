
-- Super admins can update any comment
CREATE POLICY "Super admins can update all comments"
ON public.dashboard_comments
FOR UPDATE
USING (is_super_admin(auth.uid()));

-- Super admins can delete any comment  
CREATE POLICY "Super admins can delete all comments"
ON public.dashboard_comments
FOR DELETE
USING (is_super_admin(auth.uid()));

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
ON public.dashboard_comments
FOR UPDATE
USING (auth.uid() = user_id);
