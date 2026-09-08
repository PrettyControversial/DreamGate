# Dream State Design Guidelines

## Design Approach

**Reference-Based Approach**: Drawing inspiration from Notion (organization/logging), Spotify Wrapped (annual experience), Headspace (wellness aesthetic), and Calm (mood/atmosphere).

**Core Principles**:
- Dreamlike yet functional: Balance ethereal aesthetics with practical usability
- Personal sanctuary: Create intimate, safe space for reflection
- Delightful discovery: Make dream patterns and insights feel magical
- Seamless tracking: Frictionless capture when users wake up

## Typography

**Font Families** (Google Fonts):
- Primary: 'Inter' (400, 500, 600) - clean, modern for UI and logging
- Display: 'Playfair Display' (600, 700) - elegant serif for headers and dream titles
- Accent: 'Space Grotesk' (500) - unique character for decoded insights

**Hierarchy**:
- H1: Playfair Display, 3.5rem/4rem, tracking-tight, for section headers
- H2: Playfair Display, 2.25rem/2.5rem, for dream titles
- H3: Inter, 1.5rem/2rem, semibold, for subsections
- Body: Inter, 1rem/1.5rem, for logs and content
- Caption: Inter, 0.875rem/1.25rem, for metadata (dates, moon phases)

## Layout System

**Spacing Units**: Primarily use 4, 6, 8, 12, 16, 24 (p-4, m-6, gap-8, py-12, etc.)

**Grid Structure**:
- Main app: Sidebar navigation (w-64) + content area (flex-1, max-w-4xl centered)
- Dream cards: Grid layout (grid-cols-1 md:grid-cols-2 gap-6)
- Archive view: Masonry-style with varying card heights

**Responsive Breakpoints**:
- Mobile: Single column, bottom navigation
- Tablet: Collapsible sidebar, 2-column grids
- Desktop: Full sidebar, 2-3 column layouts

## Component Library

**Navigation**:
- Sidebar: Fixed left panel with icons + labels, sections for Dream Log, Decoder, Archive, Prompts, Wrapped, Tracker
- Top bar: Date selector, search, profile/settings
- Mobile: Bottom tab bar with 5 core functions

**Dream Log Cards**:
- Rounded-lg cards with soft shadows
- Header: Date, time, moon phase icon
- Content: Dream title (Playfair), preview text (3 lines), tags
- Footer: Emotions/themes badges, action buttons (edit, decode, archive)

**Dream Decoder Interface**:
- Two-column split: Dream text (left) + Decoded insights (right)
- Insights presented as expandable cards with symbols/icons
- Visual connections with subtle lines between related themes

**Writing Prompts**:
- Large card format with prompt text centered
- "Start Writing" CTA with timer option
- Randomize button, save prompt feature

**Dream Archive**:
- Timeline view with monthly/yearly filters
- Search with filters (emotions, themes, symbols)
- Stats dashboard: Total dreams, most common themes, frequency chart

**Annual Wrapped**:
- Full-screen story format (vertical scroll)
- Animated reveals for statistics
- Downloadable summary cards
- Sections: Year overview, dream count, top themes, emotional journey, memorable dreams, sleep patterns

**Moon/Sun Tracker**:
- Circular phase visualization
- Daily info cards with astrological insights
- Calendar view with phase markers
- Standalone screen with minimal navigation

**Form Elements**:
- Large text areas for dream entry with auto-save indicators
- Tag input with suggestions dropdown
- Emotion selector with icon grid
- Date/time pickers styled to match aesthetic

**Buttons**:
- Primary: Rounded-lg, px-6 py-3, semibold text
- Secondary: Outlined variant, same sizing
- Icon buttons: Rounded-full, p-2
- On images: Backdrop-blur-md with semi-transparent background

## Images & Visual Assets

**Hero Image**: 
- Landing: Dreamy gradient sky/cosmic scene (starry night transitioning to dawn)
- App dashboard: Subtle abstract background texture, low opacity

**Icons**: 
- Heroicons for UI elements
- Custom moon phase icons (8 phases) - use unicode or simple SVGs
- Dream symbol icons (eyes, clouds, stars, keys) for categorization

**Illustrations**:
- Dream cards: Abstract patterns or minimal line art
- Empty states: Gentle illustrations (sleeping figure, peaceful scenes)
- Wrapped: Animated cosmic/celestial graphics

**Imagery Placement**:
- Landing hero: Full-width, 70vh minimum
- Dream cards: Optional mood thumbnails (user-selected)
- Tracker: Moon phase visuals prominent
- Wrapped: Full-screen background treatments

## Key Screen Specifications

**Dashboard**:
- Recent dreams (3-4 cards) + Quick log CTA
- Today's moon phase widget
- Writing prompt of the day
- Stats summary (dreams this week/month)

**Dream Entry**:
- Clean, distraction-free interface
- Auto-expanding textarea
- Floating toolbar: formatting, tags, emotions
- Save drafts automatically

**Archive**:
- Filterable timeline with infinite scroll
- Compact card view with expand-on-click
- Export functionality (PDF/JSON)

**Wrapped Experience**:
- Immersive full-screen slides
- Progress indicator (dots/bar)
- Share buttons after each insight
- "Relive moments" section with dream highlights

**Spacing Rhythm**: Consistent py-16 for section padding, py-8 for card interiors, gap-6 between elements