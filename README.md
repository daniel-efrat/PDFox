# PDFox - Modern SaaS PDF Editor

PDFox is a complete, production-ready SaaS web application for editing, annotating, and signing PDFs. It features a polished dark-mode UI, secure backend, and a robust in-browser PDF editing experience.

## Features

- **Full-Stack Next.js**: Built with the latest Next.js App Router and Server Components.
- **Robust Rendering**: High-performance PDF rendering using `pdf.js`.
- **Interactive Annotations**: Add text, highlights, and freehand drawings with `Fabric.js`.
- **Digital Signatures**: Create and place secure digital signatures.
- **SaaS Foundation**: Complete with Clerk Authentication, Prisma ORM, and Supabase Storage.
- **Billing Ready**: Scaffolded Stripe integration with predefined pricing tiers.
- **Premium Design 시스템**: Tailored with Tailwind CSS v4 and shadcn/ui.

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS v4, Lucide Icons.
- **State Management**: Zustand.
- **Backend**: Next.js Route Handlers & Server Actions.
- **Database**: PostgreSQL with Prisma ORM.
- **Auth**: Clerk.
- **Storage**: Supabase Storage.
- **PDF Engine**: pdf.js (rendering) & pdf-lib (manipulation/export).
- **Interactive Layer**: Fabric.js.

## Getting Started

### 1. Clone & Install
```bash
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env` and fill in your credentials:
- Clerk (Publishable & Secret keys)
- Supabase (URL & Keys)
- PostgreSQL (DATABASE_URL)
- Stripe (Secret & Webhook keys)

### 3. Database Migration
```bash
npx prisma db push
```

### 4. Development Server
```bash
npm run dev
```

## Architecture

- `src/app`: App Router structure (marketing, dashboard, editor).
- `src/components`: Reusable UI, marketing, and editor components.
- `src/lib`: Core service modules (supabase, prisma, stripe, pdf-export).
- `src/stores`: Zustand global state for the editor.
- `src/types`: Unified TypeScript definitions.

## Future Roadmap

- OCR (Optical Character Recognition)
- AI-powered PDF Chat & Summarization
- Real-time Collaboration
- Template Management
- Advanced Form Filling
- Team / Enterprise Workspaces
