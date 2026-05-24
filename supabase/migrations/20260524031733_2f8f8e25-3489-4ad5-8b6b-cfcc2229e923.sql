
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS data_nascimento DATE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, nome_completo, telefone, cpf, cidade, data_nascimento)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'nome_completo',
    NEW.raw_user_meta_data->>'telefone',
    NEW.raw_user_meta_data->>'cpf',
    NEW.raw_user_meta_data->>'cidade',
    NULLIF(NEW.raw_user_meta_data->>'data_nascimento','')::date
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client');
  RETURN NEW;
END; $function$;
