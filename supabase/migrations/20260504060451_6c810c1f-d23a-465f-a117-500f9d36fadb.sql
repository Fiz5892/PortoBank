REVOKE EXECUTE ON FUNCTION public.send_message(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.edit_message(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.delete_message_for_everyone(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.delete_message_for_me(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_thread(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_conversations() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_thread_read(uuid) FROM PUBLIC, anon;