BEGIN;

-- MDATE training content. This migration is safe to apply to an existing
-- identity database; it does not recreate or replace the identity tables.

CREATE TABLE IF NOT EXISTS training_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMPTZ NULL,
    CHECK (length(trim(slug)) > 0)
);

CREATE TABLE IF NOT EXISTS module_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL CHECK (version_number >= 1),
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'published', 'archived')),
    title JSONB NOT NULL CHECK (jsonb_typeof(title) = 'object'),
    description JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(description) = 'object'),
    supported_languages TEXT[] NOT NULL DEFAULT ARRAY['ms', 'en']::TEXT[],
    reward_pool_points INTEGER NOT NULL DEFAULT 100 CHECK (reward_pool_points >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMPTZ NULL,
    UNIQUE (module_id, version_number),
    CHECK (cardinality(supported_languages) > 0),
    CHECK (status <> 'published' OR published_at IS NOT NULL)
);

-- A logical module may have drafts and historical versions, but only one
-- version may be the currently published version.
CREATE UNIQUE INDEX IF NOT EXISTS module_versions_one_published_uq
    ON module_versions(module_id) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS module_versions_status_idx
    ON module_versions(status, module_id);

CREATE TABLE IF NOT EXISTS submodules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_version_id UUID NOT NULL REFERENCES module_versions(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    exercise_type TEXT NOT NULL
        CHECK (exercise_type IN ('try_to_guess', 'tell_me_more', 'find_the_pair')),
    name JSONB NOT NULL CHECK (jsonb_typeof(name) = 'object'),
    instructions JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(instructions) = 'object'),
    icon_name TEXT NOT NULL,
    position INTEGER NOT NULL CHECK (position >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (module_version_id, slug),
    UNIQUE (module_version_id, position),
    CHECK (length(trim(slug)) > 0),
    CHECK (length(trim(icon_name)) > 0)
);

CREATE TABLE IF NOT EXISTS q_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submodule_id UUID NOT NULL REFERENCES submodules(id) ON DELETE CASCADE,
    title JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(title) = 'object'),
    difficulty_index INTEGER NOT NULL CHECK (difficulty_index >= 0),
    position INTEGER NOT NULL CHECK (position >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (submodule_id, difficulty_index),
    UNIQUE (submodule_id, position)
);

CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    q_set_id UUID NOT NULL REFERENCES q_sets(id) ON DELETE CASCADE,
    position INTEGER NOT NULL CHECK (position >= 0),
    content JSONB NOT NULL CHECK (jsonb_typeof(content) = 'object'),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (q_set_id, position)
);

CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_key TEXT NOT NULL UNIQUE,
    mime_type TEXT NOT NULL,
    alt_text JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(alt_text) = 'object'),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (length(trim(storage_key)) > 0),
    CHECK (storage_key NOT LIKE '/%'),
    CHECK (length(trim(mime_type)) > 0)
);

CREATE TABLE IF NOT EXISTS question_media (
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
    role TEXT NOT NULL CHECK (
        role IN ('prompt_image', 'outline_image', 'color_image', 'supporting_image', 'audio')
    ),
    position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
    PRIMARY KEY (question_id, role, position),
    UNIQUE (question_id, asset_id, role)
);

CREATE INDEX IF NOT EXISTS submodules_version_position_idx
    ON submodules(module_version_id, position);
CREATE INDEX IF NOT EXISTS q_sets_submodule_position_idx
    ON q_sets(submodule_id, position);
CREATE INDEX IF NOT EXISTS questions_q_set_position_idx
    ON questions(q_set_id, position) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS question_media_asset_idx ON question_media(asset_id);

-- Starter program: stable IDs keep this seed repeatable and make local testing
-- predictable. The media files are copied separately from the POC.
INSERT INTO training_modules (id, slug)
VALUES ('10000000-0000-4000-8000-000000000001', 'mdate-core-practice')
ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug;

INSERT INTO module_versions (
    id, module_id, version_number, status, title, description,
    supported_languages, reward_pool_points, published_at
) VALUES (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    1,
    'published',
    '{"ms":"Latihan Teras MDATE","en":"MDATE Core Practice"}'::jsonb,
    '{"ms":"Latihan pertuturan dalam Bahasa Melayu dan English.","en":"Speech practice in Malay and English."}'::jsonb,
    ARRAY['ms', 'en']::TEXT[],
    100,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    supported_languages = EXCLUDED.supported_languages,
    reward_pool_points = EXCLUDED.reward_pool_points,
    published_at = EXCLUDED.published_at;

INSERT INTO submodules (id, module_version_id, slug, exercise_type, name, instructions, icon_name, position)
VALUES
    ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'cuba-teka', 'try_to_guess',
     '{"ms":"Cuba Teka","en":"Try to Guess"}'::jsonb,
     '{"ms":"Lihat gambar dan sebut atau taip nama benda itu.","en":"Look at the picture and say or type the name of the object."}'::jsonb,
     'magnify', 0),
    ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'ceritalah-lagi', 'tell_me_more',
     '{"ms":"Ceritalah Lagi","en":"Tell Me More"}'::jsonb,
     '{"ms":"Lihat gambar dan ceritakan apa yang sedang berlaku.","en":"Look at the picture and describe what is happening."}'::jsonb,
     'book-open-variant', 1),
    ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 'cari-pasangan', 'find_the_pair',
     '{"ms":"Cari Pasangan","en":"Find the Pair"}'::jsonb,
     '{"ms":"Padankan gambar hitam putih dengan gambar berwarna yang sama.","en":"Match the black-and-white picture with the matching colour picture."}'::jsonb,
     'puzzle', 2)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    exercise_type = EXCLUDED.exercise_type,
    instructions = EXCLUDED.instructions,
    icon_name = EXCLUDED.icon_name,
    position = EXCLUDED.position;

INSERT INTO q_sets (id, submodule_id, title, difficulty_index, position)
VALUES
    ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '{"ms":"Set 1","en":"Set 1"}'::jsonb, 0, 0),
    ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', '{"ms":"Set 1","en":"Set 1"}'::jsonb, 0, 0),
    ('40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', '{"ms":"Set 1","en":"Set 1"}'::jsonb, 0, 0)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    difficulty_index = EXCLUDED.difficulty_index,
    position = EXCLUDED.position;

INSERT INTO questions (id, q_set_id, position, content, is_active)
VALUES
    ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 0,
     '{"prompt":{"ms":"Apakah benda ini?","en":"What is this?"},"answers":{"ms":["kereta"],"en":["car"]},"category":{"ms":"kenderaan","en":"vehicle"},"hints":{"ms":["Ia ialah sejenis kenderaan.","Kenderaan ini mempunyai empat roda."],"en":["It is a type of vehicle.","This vehicle has four wheels."]}}'::jsonb, TRUE),
    ('50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', 0,
     '{"prompt":{"ms":"Ceritakan tentang gambar ini.","en":"Tell me about this picture."},"targetKeywords":{"ms":["membaca","buku"],"en":["reading","book"]},"hints":{"ms":["Apakah yang sedang dilakukan?","Apakah yang sedang dibaca?"],"en":["What is the person doing?","What is being read?"]}}'::jsonb, TRUE),
    ('50000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000003', 0,
     '{"prompt":{"ms":"Padankan gambar hitam putih dengan gambar berwarna yang sama.","en":"Match the black-and-white picture with the matching colour picture."},"pairLabel":{"ms":"Buku","en":"Book"},"hints":{"ms":["Cari gambar buku yang sama."],"en":["Find the matching picture of a book."]}}'::jsonb, TRUE)
ON CONFLICT (id) DO UPDATE SET
    content = EXCLUDED.content,
    is_active = EXCLUDED.is_active,
    position = EXCLUDED.position;

INSERT INTO media_assets (id, storage_key, mime_type, alt_text, is_active)
VALUES
    ('60000000-0000-4000-8000-000000000001', 'images/kereta.jpg', 'image/jpeg',
     '{"ms":"Gambar kereta","en":"Picture of a car"}'::jsonb, TRUE),
    ('60000000-0000-4000-8000-000000000002', 'images/action-membaca.jpg', 'image/jpeg',
     '{"ms":"Seseorang sedang membaca","en":"A person reading"}'::jsonb, TRUE),
    ('60000000-0000-4000-8000-000000000003', 'images/bookbw.png', 'image/png',
     '{"ms":"Lukisan hitam putih buku","en":"Black-and-white drawing of a book"}'::jsonb, TRUE),
    ('60000000-0000-4000-8000-000000000004', 'images/bookclr.png', 'image/png',
     '{"ms":"Gambar berwarna buku","en":"Colour picture of a book"}'::jsonb, TRUE)
ON CONFLICT (id) DO UPDATE SET
    storage_key = EXCLUDED.storage_key,
    mime_type = EXCLUDED.mime_type,
    alt_text = EXCLUDED.alt_text,
    is_active = EXCLUDED.is_active;

INSERT INTO question_media (question_id, asset_id, role, position)
VALUES
    ('50000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', 'prompt_image', 0),
    ('50000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000002', 'prompt_image', 0),
    ('50000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000003', 'outline_image', 0),
    ('50000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000004', 'color_image', 0)
ON CONFLICT (question_id, role, position) DO UPDATE SET asset_id = EXCLUDED.asset_id;

COMMIT;
