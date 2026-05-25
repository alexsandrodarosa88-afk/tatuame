CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _is_artist boolean := COALESCE((NEW.raw_user_meta_data->>'is_artist_application')::boolean, false);
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

  IF _is_artist THEN
    INSERT INTO public.artist_applications (
      user_id, full_name, email, address, cpf, phone, instagram, status
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.email),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'address', ''),
      COALESCE(NEW.raw_user_meta_data->>'cpf', ''),
      NEW.raw_user_meta_data->>'telefone',
      regexp_replace(COALESCE(NEW.raw_user_meta_data->>'instagram',''), '^@', ''),
      'pending'
    );
  END IF;

  RETURN NEW;
END; $function$;