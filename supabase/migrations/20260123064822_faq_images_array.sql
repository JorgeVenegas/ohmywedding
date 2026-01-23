-- Change FAQ from single image_url to images array
alter table "public"."wedding_faqs" drop column "image_url";
alter table "public"."wedding_faqs" add column "images" text[];


