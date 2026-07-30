-- SoundDeck Admin-Light: Storage Policies für Prototyp
-- Diese Policies erlauben Uploads aus der Admin-Oberfläche.
-- Für einen öffentlichen Test-Prototyp ok. Für eine echte Produktiv-Version später durch Login absichern.

create policy "sounddeck public read images"
on storage.objects for select
using (bucket_id = 'images');

create policy "sounddeck public insert images"
on storage.objects for insert
with check (bucket_id = 'images');

create policy "sounddeck public update images"
on storage.objects for update
using (bucket_id = 'images')
with check (bucket_id = 'images');

create policy "sounddeck public delete images"
on storage.objects for delete
using (bucket_id = 'images');

create policy "sounddeck public read sounds"
on storage.objects for select
using (bucket_id = 'sounds');

create policy "sounddeck public insert sounds"
on storage.objects for insert
with check (bucket_id = 'sounds');

create policy "sounddeck public update sounds"
on storage.objects for update
using (bucket_id = 'sounds')
with check (bucket_id = 'sounds');

create policy "sounddeck public delete sounds"
on storage.objects for delete
using (bucket_id = 'sounds');
