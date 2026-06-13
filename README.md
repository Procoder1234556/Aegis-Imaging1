# AI Prescription Audit Platform

An end-to-end AI-powered prescription auditing platform that detects, analyzes, and explains potentially AI-generated or manipulated medical prescriptions through a multi-agent workflow architecture.

The system combines machine learning detection models, explainability heatmaps, forensic analysis, audit trails, and verdict generation into a structured review pipeline.

---

## Architecture Overview

The platform follows a **React + Python micro-module architecture** with an orchestrated multi-agent backend.

### High-Level Flow

```text
User Uploads Prescription
          │
          ▼
     React Frontend
          │
          ▼
      API Server
          │
          ▼
     Orchestrator
          │
 ┌────────┼────────┐
 ▼        ▼        ▼
Intake  Clinical  Forensics
Agent    Agent     Agent
 │         │         │
 └─────────┼─────────┘
           ▼
      Audit Agent
           ▼
      Verdict Agent
           ▼
   Review Dashboard
```

<img width="1960" height="2564" alt="diagram" src="https://github.com/user-attachments/assets/15703e4f-0ebd-46ab-8ac2-952a421301fb" />

