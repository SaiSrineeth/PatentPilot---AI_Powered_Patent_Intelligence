# PatentPilot — AI-Assisted Patentability & Molecular Intelligence Platform

> **Comprehensive Prior Art Patentability Assessment, Relationship Mapping & Drug Screening for Novel Chemical Compounds**

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Complete Project Workflow](#complete-project-workflow)
- [Interactive Patent Relationship Graph](#interactive-patent-relationship-graph)
- [AI Analysis Categories](#ai-analysis-categories)
- [Integrated Drug Screening Dashboard](#integrated-drug-screening-dashboard)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Database Schema (Supabase)](#database-schema-supabase)
- [Environment Variables](#environment-variables)
- [Installation & Setup](#installation--setup)
- [Running the Project](#running-the-project)
- [License](#license)

---

## Overview

**PatentPilot** is an end-to-end patent intelligence and molecular screening platform designed for medicinal chemists, IP researchers, and biotech innovators. 

By taking a **SMILES chemical structure**, a **detailed molecule description**, and optional biological targets, PatentPilot automatically fetches molecular metadata from PubChem, searches public patent databases (SureChEMBL), runs multi-vector LLM semantic ranking using Groq, renders an interactive ReactFlow relationship graph, and generates structured IP patentability reports.

---

## Key Features

- **SMILES & Context Input**: Molecule SMILES string and mandatory description validation.
- **Supabase Authentication**: Domain-restricted institutional sign-in (`@vnrvjiet.in`) with persistent user sessions.
- **PubChem Metadata Integration**: Automatic retrieval of CID, IUPAC Name, Molecular Formula, Molecular Weight, 2D structures, and synonyms.
- **Hybrid SureChEMBL Patent Search**: Synonym-expanded multi-keyword API query fetching real patent documents.
- **AI Semantic Patent Ranking**: Groq LLM evaluates chemical similarity, target overlap, and prior art risk.
- **5 Core AI Patent Categories**: Detailed breakdown for *Composition of Matter*, *Process/Manufacturing*, *Formulation*, *Drug Delivery*, and *New Therapeutic Indication*.
- **Interactive Patent Relationship Graph**: ReactFlow node-edge mapping displaying innovation-to-patent and patent-to-patent citation/overlap connections.
- **Integrated Drug Screening Dashboard**: Calculates Lipinski Rule of Five compliance, molecular descriptors (TPSA, LogP, HBD, HBA, Rotatable Bonds), and ADME pharmacokinetic predictions.
- **Dark & Light Mode Support**: Modern glassmorphic dark and light user interface.
- **Analysis History & Re-visit**: Full Supabase database storage with instant search, sorting, and fallback graph rendering.

---

## System Architecture

```
                                  User Input
                   (SMILES, Context, Target, Disease)
                                       │
                                       ▼
                             Next.js Frontend (App Router)
                                       │
                                       ▼
                              POST /api/analyze Route
                                       │
                   ┌───────────────────┴───────────────────┐
                   ▼                                       ▼
            PubChem REST API                       SureChEMBL Patent API
         (CID, Formula, Synonyms)                 (Prior Art Search Query)
                   │                                       │
                   └───────────────────┬───────────────────┘
                                       ▼
                              Groq LLM Pipeline
                    (Semantic Ranking & Classification)
                                       │
                   ┌───────────────────┼───────────────────┐
                   ▼                   ▼                   ▼
           5 IP Categories      Patentability      Interactive Graph
           Classification          Report              (ReactFlow)
                   │                   │                   │
                   └───────────────────┼───────────────────┘
                                       ▼
                           Supabase Database (PostgreSQL)
                                       │
                                       ▼
                       Analysis Detail & Saved History
```

---

## Complete Project Workflow

### 1. Authentication & Input Validation
Users authenticate via Supabase Auth (with `@vnrvjiet.in` institutional domain validation). Upon signing in, users enter:
- **SMILES String** (*Mandatory*)
- **Molecule Description & Context** (*Mandatory*)
- **Biological Target** (*Optional*)
- **Disease Indication** (*Optional*)

### 2. Molecular Retrieval (PubChem API)
The system queries PubChem to fetch canonical SMILES, Molecular Formula, Molecular Weight, PubChem CID, and structural synonyms.

### 3. Patent Retrieval (SureChEMBL API)
PatentPilot expands the search query using synonyms derived from PubChem, executing a multi-keyword query on SureChEMBL to pull candidates.

### 4. AI Semantic Ranking & Patentability Evaluation
The Groq LLM processes retrieved patent abstracts against candidate molecule details to:
- Select the top **5 most relevant patents**.
- Calculate individual relevance scores (0-100%) and confidence ratings.
- Categorize prior-art risks.

### 5. Interactive Relationship Graph Generation
Generates a workflow graph mapping the user's innovation to the top 5 patent nodes, highlighting connections such as:
- **High Relevance Match** (`#10b981`)
- **AI Semantic Match** (`#06b6d4`)
- **Shared Assignee** (`#8b5cf6`)
- **Same Patent Type** (`#f59e0b`)
- **Overlapping Terms** (`#ec4899`)

### 6. Comprehensive Report & Storage
Generates a structured report with overall patentability score, risk classification (*Low Patent Risk*, *Requires Expert Review*, *High Patent Risk*), and saves the analysis into Supabase for future retrieval.

---

## Interactive Patent Relationship Graph

Positioned directly above the Patentability Report, the **Patent Workflow Graph** allows researchers to visually inspect patent relationships:

- **Central Innovation Node**: Displays your candidate compound name, formula, and SMILES.
- **Top Ranked Patent Nodes**: Displays patent numbers, publication dates, titles, and similarity percentages.
- **Edge Click Inspection**: Clicking any edge opens a detail panel with AI explanations for the relationship.
- **Direct Navigation**: Includes a **"View Relationships"** button in the patent section header to scroll to the graph.

---

## AI Analysis Categories

The AI patentability evaluation explicitly categorizes prior art overlap across five key pharmaceutical domain areas:

1. **Composition of Matter**: Evaluation of core molecular scaffolds, chemical structures, and active pharmaceutical ingredients (APIs).
2. **Process / Manufacturing**: Syntheses, reaction steps, reagents, purification procedures, and scalable production methods.
3. **Formulation**: Excipient combinations, salt forms, polymorphs, stability enhancers, and dosage form compositions.
4. **Drug Delivery**: Extended-release systems, nanoparticles, liposomal carriers, targeted delivery, and bioavailability enhancements.
5. **New Therapeutic Indication**: Novel disease applications, secondary mechanism of action uses, and repurposed clinical utility.

---

## Integrated Drug Screening Dashboard

Accessible via `/drug-screening`, this tool provides early-stage drug-likeness evaluation:

- **Molecular Descriptors**: Molecular Weight (g/mol), LogP (Lipophilicity), H-Bond Donors, H-Bond Acceptors, Rotatable Bonds, TPSA (Å²), Aromatic Rings.
- **Lipinski Rule of Five**: Evaluates MW ≤ 500, LogP ≤ 5, HBD ≤ 5, HBA ≤ 10, returning an overall **PASS / FAIL** verdict.
- **ADME Predictions**:
  - **Absorption**: Gastrointestinal permeability prediction.
  - **Distribution**: Plasma protein binding and tissue distribution.
  - **Metabolism**: CYP450 metabolic stability.
  - **Excretion**: Renal & hepatic clearance route.

---

## Technologies Used

### Frontend & UI
- **Next.js 15+ (App Router)**
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **ReactFlow** (Interactive graph rendering)
- **Lucide React** (Modern clean SVG icons)

### AI & Backend APIs
- **Groq SDK** (`llama-3.3-70b-versatile` / `llama-3.1-8b-instant`)
- **PubChem PUG REST API**
- **SureChEMBL REST API**

### Database & Auth
- **Supabase** (PostgreSQL database, Row Level Security, Supabase Auth)

---

## Project Structure

```
PatentPilot/
├── app/
│   ├── api/
│   │   ├── analyze/          # POST endpoint for full analysis pipeline
│   │   ├── history/          # GET endpoints for saved analyses
│   │   └── report/           # Export report endpoint
│   ├── auth/                 # Sign-in & signup page with domain validation
│   ├── drug-screening/       # Drug screening & ADME dashboard page
│   ├── history/              # History listing and detail pages
│   │   └── [id]/             # Saved analysis report & graph view
│   ├── PatentWorkflowGraph.tsx # ReactFlow relationship graph component
│   ├── page.tsx              # Main patentability assessment interface
│   ├── layout.tsx            # Global layout with font providers
│   └── globals.css           # Custom CSS utilities & glassmorphism styles
├── core/
│   └── analysisPipeline.ts   # Core pipeline orchestrator & graph builder
├── lib/
│   ├── chemistry.ts          # Pure JS Lipinski & ADME calculators
│   └── supabase.ts           # Supabase client instantiation
├── services/
│   ├── groq.ts               # Groq LLM client & ranking prompt handlers
│   ├── history.ts            # Supabase database persistence service
│   ├── pubchem.ts            # PubChem compound retrieval service
│   ├── report.ts             # Groq report generator service
│   └── surechembl.ts         # SureChEMBL patent search service
├── types/
│   └── analysis.ts           # TypeScript interfaces & data models
├── schema.sql                # Supabase PostgreSQL schema script
├── package.json
└── README.md
```

---

## Database Schema (Supabase)

Execute the following script in the Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_state(),
  smiles TEXT NOT NULL,
  target TEXT,
  disease TEXT,
  compound_name TEXT NOT NULL,
  pubchem_cid INTEGER,
  molecular_formula TEXT,
  report JSONB NOT NULL,
  user_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patents (
  id UUID PRIMARY KEY DEFAULT gen_random_state(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  patent_number TEXT NOT NULL,
  title TEXT,
  publication_date TEXT,
  assignee TEXT,
  abstract TEXT,
  relevance_score INTEGER,
  ai_explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analyses_smiles ON analyses(smiles);
CREATE INDEX IF NOT EXISTS idx_patents_analysis_id ON patents(analysis_id);
```

---

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# Groq API Credentials
GROQ_API_KEY=gsk_your_groq_api_key_here

# Supabase Database Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

---

## Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/sreenavyach15/PatentPilot.git
   cd PatentPilot
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Copy `.env.example` to `.env.local` and add your `GROQ_API_KEY` and Supabase keys.

4. **Initialize Database**:
   Run `schema.sql` in your Supabase SQL Editor.

---

## Running the Project

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm start
```

---

## License

Distributed under the MIT License. See `LICENSE` for details.
