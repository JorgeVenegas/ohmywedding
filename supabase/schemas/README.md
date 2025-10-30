# Database Schema Organization

This directory contains the complete database schema for the OhMyWedding application, organized into separate files for maintainability.

## Schema Files

### Core Files
- `schema.sql` - **Master schema file** with all essential tables and policies
- `01_weddings.sql` - Core wedding and schedule tables
- `02_rsvps.sql` - RSVP and guest management
- `03_gallery.sql` - Photo gallery functionality
- `04_content.sql` - FAQ and content pages
- `05_registry.sql` - Gift registry features
- `06_indexes.sql` - Database performance indexes
- `07_policies.sql` - Row Level Security policies

## Usage

### For Development
Run the master schema file to set up the complete database:
```sql
-- In Supabase SQL Editor
\i schema.sql
```

### For Production
You can run individual files as needed:
```sql
\i 01_weddings.sql
\i 02_rsvps.sql
-- etc.
```

## Table Structure

### Primary Tables
- **weddings** - Core wedding information and settings
- **wedding_schedule** - Timeline events for wedding day
- **rsvps** - Guest responses and attendance
- **gallery_albums** - Photo album organization
- **gallery_photos** - Individual wedding photos
- **wedding_faqs** - Frequently asked questions

### Key Features
- Simple Supabase nomenclature (lowercase, quoted names)
- UUID primary keys with meaningful text IDs where appropriate
- Proper foreign key relationships
- Row Level Security enabled
- Performance indexes
- Public read access for wedding content
- Owner-only write access for wedding management

### Wedding ID Format
Wedding IDs follow the pattern: `MMDDYY/partner1&partner2`
Example: `032525/jorge&yuliana` for March 25, 2025

## Security Model
- **Public Read**: Anyone can view wedding content (for guests)
- **Owner Write**: Only wedding owners can modify their content
- **Open RSVP**: Anyone can submit RSVP responses
- **Guest Creation**: Anyone can create new weddings (no auth required initially)

This schema supports the full wedding website functionality while maintaining security and performance.