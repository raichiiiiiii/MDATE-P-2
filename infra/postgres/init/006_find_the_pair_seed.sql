BEGIN;

-- Cari Pasangan is one sequential session containing two published QSets.
-- Each question is one pair and owns exactly one outline and one colour image.
-- The media files are supplied separately in storage/media/images/.

UPDATE submodules
SET name = '{"ms":"Cari Pasangan","en":"Find the Pair"}'::jsonb,
    instructions = '{"ms":"Padankan lukisan hitam putih dengan gambar sebenar yang sepadan.","en":"Match each black-and-white outline with its corresponding real-world photograph."}'::jsonb
WHERE id = '30000000-0000-4000-8000-000000000003'
  AND exercise_type = 'find_the_pair';

INSERT INTO q_sets (id, submodule_id, title, difficulty_index, position)
VALUES
    ('40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', '{"ms":"Set 1","en":"Set 1"}'::jsonb, 0, 0),
    ('40000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000003', '{"ms":"Set 2","en":"Set 2"}'::jsonb, 1, 1)
ON CONFLICT (id) DO UPDATE SET
    submodule_id = EXCLUDED.submodule_id,
    title = EXCLUDED.title,
    difficulty_index = EXCLUDED.difficulty_index,
    position = EXCLUDED.position;

-- Replace the incomplete one-question starter QSet without touching the two
-- speech-exercise QSets or their questions.
DELETE FROM questions
WHERE q_set_id IN (
    '40000000-0000-4000-8000-000000000003',
    '40000000-0000-4000-8000-000000000004'
);

INSERT INTO questions (id, q_set_id, position, content, is_active)
VALUES
    ('50000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000003', 0,
     '{"prompt":{"ms":"Padankan gambar hitam putih dengan gambar berwarna yang sama.","en":"Match the black-and-white picture with the matching colour picture."},"pairLabel":{"ms":"Burger","en":"Burger"},"hints":{"ms":["Makanan yang biasanya dihidangkan di antara dua bahagian roti bulat."],"en":["A food usually served between two halves of a round bun."]}}'::jsonb, TRUE),
    ('50000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000003', 1,
     '{"prompt":{"ms":"Padankan gambar hitam putih dengan gambar berwarna yang sama.","en":"Match the black-and-white picture with the matching colour picture."},"pairLabel":{"ms":"Boot","en":"Boot"},"hints":{"ms":["Alas kaki yang menutupi buku lali."],"en":["Footwear that covers the ankle."]}}'::jsonb, TRUE),
    ('50000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000003', 2,
     '{"prompt":{"ms":"Padankan gambar hitam putih dengan gambar berwarna yang sama.","en":"Match the black-and-white picture with the matching colour picture."},"pairLabel":{"ms":"Biskut","en":"Biscuit"},"hints":{"ms":["Snek rangup yang biasanya dibuat daripada tepung."],"en":["A crisp snack usually made from flour."]}}'::jsonb, TRUE),
    ('50000000-0000-4000-8000-000000000006', '40000000-0000-4000-8000-000000000003', 3,
     '{"prompt":{"ms":"Padankan gambar hitam putih dengan gambar berwarna yang sama.","en":"Match the black-and-white picture with the matching colour picture."},"pairLabel":{"ms":"Burung","en":"Bird"},"hints":{"ms":["Haiwan bersayap yang biasanya boleh terbang."],"en":["An animal with wings that can usually fly."]}}'::jsonb, TRUE),
    ('50000000-0000-4000-8000-000000000007', '40000000-0000-4000-8000-000000000003', 4,
     '{"prompt":{"ms":"Padankan gambar hitam putih dengan gambar berwarna yang sama.","en":"Match the black-and-white picture with the matching colour picture."},"pairLabel":{"ms":"Beret","en":"Beret"},"hints":{"ms":["Topi lembut yang rata dan bulat."],"en":["A soft, round, flat hat."]}}'::jsonb, TRUE),
    ('50000000-0000-4000-8000-000000000008', '40000000-0000-4000-8000-000000000004', 0,
     '{"prompt":{"ms":"Padankan gambar hitam putih dengan gambar berwarna yang sama.","en":"Match the black-and-white picture with the matching colour picture."},"pairLabel":{"ms":"Cengkerik","en":"Cricket"},"hints":{"ms":["Serangga yang mengeluarkan bunyi nyaring pada waktu malam."],"en":["An insect known for its chirping sound, often heard at night."]}}'::jsonb, TRUE),
    ('50000000-0000-4000-8000-000000000009', '40000000-0000-4000-8000-000000000004', 1,
     '{"prompt":{"ms":"Padankan gambar hitam putih dengan gambar berwarna yang sama.","en":"Match the black-and-white picture with the matching colour picture."},"pairLabel":{"ms":"Buku","en":"Book"},"hints":{"ms":["Bahan bacaan yang mempunyai halaman."],"en":["Something you read that contains pages."]}}'::jsonb, TRUE),
    ('50000000-0000-4000-8000-000000000010', '40000000-0000-4000-8000-000000000004', 2,
     '{"prompt":{"ms":"Padankan gambar hitam putih dengan gambar berwarna yang sama.","en":"Match the black-and-white picture with the matching colour picture."},"pairLabel":{"ms":"Beruang","en":"Bear"},"hints":{"ms":["Haiwan besar berbulu yang berjalan menggunakan empat kaki."],"en":["A large furry animal that walks on four legs."]}}'::jsonb, TRUE),
    ('50000000-0000-4000-8000-000000000011', '40000000-0000-4000-8000-000000000004', 3,
     '{"prompt":{"ms":"Padankan gambar hitam putih dengan gambar berwarna yang sama.","en":"Match the black-and-white picture with the matching colour picture."},"pairLabel":{"ms":"Beg","en":"Bag"},"hints":{"ms":["Bekas yang digunakan untuk membawa barang."],"en":["A container used for carrying things."]}}'::jsonb, TRUE),
    ('50000000-0000-4000-8000-000000000012', '40000000-0000-4000-8000-000000000004', 4,
     '{"prompt":{"ms":"Padankan gambar hitam putih dengan gambar berwarna yang sama.","en":"Match the black-and-white picture with the matching colour picture."},"pairLabel":{"ms":"Anjing","en":"Dog"},"hints":{"ms":["Haiwan peliharaan yang biasanya menyalak."],"en":["A common pet that barks."]}}'::jsonb, TRUE)
ON CONFLICT (id) DO UPDATE SET
    q_set_id = EXCLUDED.q_set_id,
    position = EXCLUDED.position,
    content = EXCLUDED.content,
    is_active = EXCLUDED.is_active;

INSERT INTO media_assets (id, storage_key, mime_type, alt_text, is_active)
VALUES
    ('60000000-0000-4000-8000-000000000005', 'images/burgerbw.png', 'image/png', '{"ms":"Lukisan garis hitam putih burger","en":"Black-and-white burger line drawing"}'::jsonb, TRUE),
    ('60000000-0000-4000-8000-000000000006', 'images/burgerclr.png', 'image/png', '{"ms":"Gambar burger berwarna","en":"Colour photograph of a burger"}'::jsonb, TRUE),
    ('60000000-0000-4000-8000-000000000007', 'images/bootsbw.png', 'image/png', '{"ms":"Lukisan garis hitam putih boot","en":"Black-and-white boot line drawing"}'::jsonb, TRUE),
    ('60000000-0000-4000-8000-000000000008', 'images/bootsclr.png', 'image/png', '{"ms":"Gambar boot berwarna","en":"Colour photograph of boots"}'::jsonb, TRUE),
    ('60000000-0000-4000-8000-000000000009', 'images/biscuitbw.png', 'image/png', '{"ms":"Lukisan garis hitam putih biskut","en":"Black-and-white biscuit line drawing"}'::jsonb, TRUE),
    ('60000000-0000-4000-8000-000000000010', 'images/biscuitclr.png', 'image/png', '{"ms":"Gambar biskut berwarna","en":"Colour photograph of a biscuit"}'::jsonb, TRUE),
    ('60000000-0000-4000-8000-000000000011', 'images/birdbw.png', 'image/png', '{"ms":"Lukisan garis hitam putih burung","en":"Black-and-white bird line drawing"}'::jsonb, TRUE),
    ('60000000-0000-4000-8000-000000000012', 'images/birdclr.png', 'image/png', '{"ms":"Gambar burung berwarna","en":"Colour photograph of a bird"}'::jsonb, TRUE),
    ('60000000-0000-4000-8000-000000000013', 'images/beretbw.png', 'image/png', '{"ms":"Lukisan garis hitam putih beret","en":"Black-and-white beret line drawing"}'::jsonb, TRUE),
    ('60000000-0000-4000-8000-000000000014', 'images/beretclr.png', 'image/png', '{"ms":"Gambar beret berwarna","en":"Colour photograph of a beret"}'::jsonb, TRUE),
    ('60000000-0000-4000-8000-000000000015', 'images/cricketsbw.png', 'image/png', '{"ms":"Lukisan garis hitam putih cengkerik","en":"Black-and-white cricket line drawing"}'::jsonb, TRUE),
    ('60000000-0000-4000-8000-000000000016', 'images/cricketsclr.png', 'image/png', '{"ms":"Gambar cengkerik berwarna","en":"Colour photograph of a cricket"}'::jsonb, TRUE),
    ('60000000-0000-4000-8000-000000000003', 'images/bookbw.png', 'image/png', '{"ms":"Lukisan garis hitam putih buku","en":"Black-and-white book line drawing"}'::jsonb, TRUE),
    ('60000000-0000-4000-8000-000000000004', 'images/bookclr.png', 'image/png', '{"ms":"Gambar buku berwarna","en":"Colour photograph of a book"}'::jsonb, TRUE),
    ('60000000-0000-4000-8000-000000000017', 'images/bearbw.png', 'image/png', '{"ms":"Lukisan garis hitam putih beruang","en":"Black-and-white bear line drawing"}'::jsonb, TRUE),
    ('60000000-0000-4000-8000-000000000018', 'images/bearclr.png', 'image/png', '{"ms":"Gambar beruang berwarna","en":"Colour photograph of a bear"}'::jsonb, TRUE),
    ('60000000-0000-4000-8000-000000000019', 'images/bagbw.png', 'image/png', '{"ms":"Lukisan garis hitam putih beg","en":"Black-and-white bag line drawing"}'::jsonb, TRUE),
    ('60000000-0000-4000-8000-000000000020', 'images/bagclr.png', 'image/png', '{"ms":"Gambar beg berwarna","en":"Colour photograph of a bag"}'::jsonb, TRUE),
    ('60000000-0000-4000-8000-000000000021', 'images/anjingbw.png', 'image/png', '{"ms":"Lukisan garis hitam putih anjing","en":"Black-and-white dog line drawing"}'::jsonb, TRUE),
    ('60000000-0000-4000-8000-000000000022', 'images/anjingclr.png', 'image/png', '{"ms":"Gambar anjing berwarna","en":"Colour photograph of a dog"}'::jsonb, TRUE)
ON CONFLICT (id) DO UPDATE SET
    storage_key = EXCLUDED.storage_key,
    mime_type = EXCLUDED.mime_type,
    alt_text = EXCLUDED.alt_text,
    is_active = EXCLUDED.is_active;

INSERT INTO question_media (question_id, asset_id, role, position)
VALUES
    ('50000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000005', 'outline_image', 0),
    ('50000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000006', 'color_image', 0),
    ('50000000-0000-4000-8000-000000000004', '60000000-0000-4000-8000-000000000007', 'outline_image', 0),
    ('50000000-0000-4000-8000-000000000004', '60000000-0000-4000-8000-000000000008', 'color_image', 0),
    ('50000000-0000-4000-8000-000000000005', '60000000-0000-4000-8000-000000000009', 'outline_image', 0),
    ('50000000-0000-4000-8000-000000000005', '60000000-0000-4000-8000-000000000010', 'color_image', 0),
    ('50000000-0000-4000-8000-000000000006', '60000000-0000-4000-8000-000000000011', 'outline_image', 0),
    ('50000000-0000-4000-8000-000000000006', '60000000-0000-4000-8000-000000000012', 'color_image', 0),
    ('50000000-0000-4000-8000-000000000007', '60000000-0000-4000-8000-000000000013', 'outline_image', 0),
    ('50000000-0000-4000-8000-000000000007', '60000000-0000-4000-8000-000000000014', 'color_image', 0),
    ('50000000-0000-4000-8000-000000000008', '60000000-0000-4000-8000-000000000015', 'outline_image', 0),
    ('50000000-0000-4000-8000-000000000008', '60000000-0000-4000-8000-000000000016', 'color_image', 0),
    ('50000000-0000-4000-8000-000000000009', '60000000-0000-4000-8000-000000000003', 'outline_image', 0),
    ('50000000-0000-4000-8000-000000000009', '60000000-0000-4000-8000-000000000004', 'color_image', 0),
    ('50000000-0000-4000-8000-000000000010', '60000000-0000-4000-8000-000000000017', 'outline_image', 0),
    ('50000000-0000-4000-8000-000000000010', '60000000-0000-4000-8000-000000000018', 'color_image', 0),
    ('50000000-0000-4000-8000-000000000011', '60000000-0000-4000-8000-000000000019', 'outline_image', 0),
    ('50000000-0000-4000-8000-000000000011', '60000000-0000-4000-8000-000000000020', 'color_image', 0),
    ('50000000-0000-4000-8000-000000000012', '60000000-0000-4000-8000-000000000021', 'outline_image', 0),
    ('50000000-0000-4000-8000-000000000012', '60000000-0000-4000-8000-000000000022', 'color_image', 0)
ON CONFLICT (question_id, role, position) DO UPDATE SET
    asset_id = EXCLUDED.asset_id;

COMMIT;
