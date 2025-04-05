-- สร้างตาราง
create table public.pdf_files (
  id uuid not null default gen_random_uuid (),
  file_path text not null,
  file_size bigint not null,
  created_at timestamp with time zone null default now(),
  user_id uuid not null,
  download_count bigint not null default '0'::bigint,
  year smallint not null,
  subject text not null,
  title text not null,
  constraint pdf_files_pkey primary key (id),
  constraint pdf_files_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;
CREATE TABLE years (
  id SERIAL PRIMARY KEY,
  year_name TEXT NOT NULL
);
CREATE TABLE subjects (
  id SERIAL PRIMARY KEY,
  subject_name TEXT NOT NULL,
  year_id INT NOT NULL REFERENCES years(id) ON DELETE CASCADE
);

-- นำเข้าข้อมูล
INSERT INTO years (year_name) VALUES
('Year 1'),
('Year 2'),
('Year 3'),
('Year 4');
INSERT INTO subjects (subject_name, year_id) VALUES
-- Year 1
('calculus 1', 1),
('calculus 2', 1),
('computer programming', 1),
('drawing', 1),
('engineering materials', 1),
('engineering mechanics', 1),
('general chemistry', 1),
('general chemistry laboratory 1', 1),
('general physics laboratory 2', 1),
('general physics 1', 1),
('general physics 2', 1),

-- Year 2
('computer-aided design for manufacturing', 2),
('computer and information technology for industrial engineering', 2),
('electrical engineering', 2),
('elementary differential equations and linear algebra', 2),
('engineering metallurgy', 2),
('industrial safety engineering', 2),
('manufacturing processes', 2),
('numerical methods for engineering', 2),
('probability and statistics 1', 2),
('thermodynamics', 2),

-- Year 3
('economics', 3),
('industrial work study', 3),
('maintenance', 3),
('operations research', 3),
('pollution control', 3),

-- Year 4
('advanced engineering management', 4),
('cost analysis', 4),
('logistics and supply chain management', 4),
('quality management', 4);

-- แล้วก็มี Buckets ชื่อ pdfs