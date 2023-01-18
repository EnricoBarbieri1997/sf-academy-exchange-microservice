-- Adminer 4.8.1 PostgreSQL 15.1 (Debian 15.1-1.pgdg110+1) dump

\connect "Exchanger";

DROP TABLE IF EXISTS "Users";
CREATE TABLE "public"."Users" (
    "email" text NOT NULL,
    "password" text NOT NULL,
    "name" text NOT NULL,
    "iban" text NOT NULL,
    "salt" bit(128) NOT NULL,
    CONSTRAINT "Users_email" PRIMARY KEY ("email")
) WITH (oids = false);


-- 2023-01-18 18:13:47.730152+00
