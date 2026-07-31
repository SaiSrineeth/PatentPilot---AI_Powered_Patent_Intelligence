# PatentPilot — AI-Assisted Patentability & Molecular Intelligence Platform

> **A comprehensive platform for evaluating novel chemical compounds by analyzing prior art, assessing patentability, and identifying potential patent conflicts.It helps researchers understand how a new compound is connected to existing patents, diseases, and biological targets, while evaluating its potential as a drug.**

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

---

## Overview

**PatentPilot** is an end-to-end patent intelligence and molecular screening platform designed for medicinal chemists, IP researchers, and biotech innovators. 

By taking a **SMILES chemical structure**, a **detailed molecule description**, and optional biological targets, PatentPilot automatically fetches molecular metadata from PubChem, searches public patent databases (SureChEMBL), runs multi-vector LLM semantic ranking using Featherless AI, renders an interactive ReactFlow relationship graph, and generates structured IP patentability reports.

---

## Key Features

- **SMILES & Context Input**: Molecule SMILES string and mandatory description validation.
- **Supabase Authentication**: Domain-restricted institutional sign-in (`@vnrvjiet.in`) with persistent user sessions.
- **PubChem Metadata Integration**: Automatic retrieval of CID, IUPAC Name, Molecular Formula, Molecular Weight, 2D structures, and synonyms.
- **Hybrid SureChEMBL Patent Search**: Synonym-expanded multi-keyword API query fetching real patent documents.
- **AI Semantic Patent Ranking**: Featherless AI LLM evaluates chemical similarity, target overlap, and prior art risk.
- **5 Core AI Patent Categories**: Detailed breakdown for *Composition of Matter*, *Process/Manufacturing*, *Formulation*, *Drug Delivery*, and *New Therapeutic Indication*.
- **Interactive Patent Relationship Graph**: ReactFlow node-edge mapping displaying innovation-to-patent and patent-to-patent citation/overlap connections.
- **Integrated Drug Screening Dashboard**: Calculates Lipinski Rule of Five compliance, molecular descriptors (TPSA, LogP, HBD, HBA, Rotatable Bonds), and ADME pharmacokinetic predictions.
- **Dark & Light Mode Support**: Modern glassmorphic dark and light user interface.
- **Analysis History & Re-visit**: Full Supabase database storage with instant search, sorting, and fallback graph rendering.
- **Download as PDF Reports**: Export comprehensive patent analysis reports, including AI insights and patent search results for documentation and sharing.

---

## Performance optimizations

The implementation includes a few practical optimizations:

- Patent family deduplication reduces duplicate records from public patent feeds.
- The AI candidate set is capped to a manageable number of patents before deeper analysis.
- The graph generation uses only the top-ranked patents for display.
- History reads are straightforward and page-based in the UI flow.

---

## System Architecture

<img width="622" height="610" alt="image" src="https://github.com/user-attachments/assets/9103fe0b-7533-417f-9ca8-306dc5b2a213" />


---

## Complete Project Workflow

### 1. Authentication & Input Validation
Users authenticate via Supabase Auth (with `@vnrvjiet.in` institutional domain validation). Upon signing in, users enter:
- **SMILES String** (*Mandatory*)
- **Molecule Description & Context** (*Mandatory*)
- **Biological Target** (*Optional*)
- **Disease** (*Optional*)

### 2. Molecular Retrieval (PubChem API)
The system queries PubChem to fetch canonical SMILES, Molecular Formula, Molecular Weight, PubChem CID, and structural synonyms.

### 3. Patent Retrieval (SureChEMBL API)
PatentPilot expands the input query using PubChem-derived synonyms and executes a multi-keyword search on SureChEMBL, leveraging the Apache Solr search engine with the BM25 ranking algorithm to retrieve the most relevant patent candidates.

### 4. AI Semantic Ranking & Patentability Evaluation
The Featherless AI LLM processes retrieved patent abstracts against candidate molecule details to:
- Select the top **5 most relevant patents**.
- Calculate individual relevance scores (0-100%) and confidence ratings.
- Categorize prior-art risks.

### 5. Interactive Relationship Graph Generation
Generates a workflow graph mapping the user's innovation to the top 5 patent nodes, highlighting connections such as:
- **High Relevance Match**
- **AI Semantic Match** 
- **Shared Assignee** 
- **Same Patent Type** 
- **Overlapping Terms** 

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
- **ADME Predictions**: Used ADMETlab3.0 API for the following predictions:
  - **Absorption**: Gastrointestinal permeability prediction.
  - **Distribution**: Plasma protein binding and tissue distribution.
  - **Metabolism**: CYP450 metabolic stability.
  - **Excretion**: Renal & hepatic clearance route.
    
---

## Application Preview

<img width="1600" height="888" alt="image" src="https://github.com/user-attachments/assets/552cce28-8080-4e2a-93e8-ecf3d956d354" />
<img width="2560" height="1436" alt="image" src="https://github.com/user-attachments/assets/8dd30ce8-32c4-4bdd-9f76-a99a42016ddf" />
<img width="1600" height="791" alt="image" src="https://github.com/user-attachments/assets/f348aade-655c-451a-9dd1-d9def5786b44" />
<img width="1600" height="844" alt="image" src="https://github.com/user-attachments/assets/fd79a913-b478-488d-aaf6-0a9caaf6851d" />
<img width="1600" height="1234" alt="image" src="https://github.com/user-attachments/assets/5c35688f-376a-458b-ab9d-eb845bb685d0" />
<img width="1070" height="1338" alt="image" src="https://github.com/user-attachments/assets/d85ad3f8-0f3e-4bdc-90da-c2add4ae1c09" />
<img width="1600" height="795" alt="image" src="https://github.com/user-attachments/assets/0607fc4e-921a-4fdf-96fe-1c0febe90a15" />
<img width="1281" height="928" alt="image" src="https://github.com/user-attachments/assets/9f8900f6-c0be-4096-906c-f67ebabf9fad" />
<img width="1600" height="816" alt="image" src="https://github.com/user-attachments/assets/63139efe-2904-44a6-b28f-cf416306190b" />


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
- **Featherless AI SDK** (`Qwen/Qwen2.5-7B-Instruct`)
- **PubChem PUG REST API**
- **SureChEMBL REST API** (`Apache Solr Searching Algorithm` / `BM 25 Ranking ALgorithm`)
- **ADMETlab3.0 API**

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
│   ├── groq.ts               # Featherless LLM client & ranking prompt handlers
│   ├── history.ts            # Supabase database persistence service
│   ├── pubchem.ts            # PubChem compound retrieval service
│   ├── report.ts             # Featherless report generator service
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
# Featherless AI API Credentials
FEATHERLESS_API_KEY=gsk_your_featherless_api_key_here

# Supabase Database Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

---

## Installation & Setup

1. **Clone the Repository**:
   ```bash
   https://github.com/SaiSrineeth/PatentPilot---AI_Powered_Patent_Intelligence
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Copy `.env.example` to `.env.local` and add your `FEATHERLESS_API_KEY` and Supabase keys.

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
