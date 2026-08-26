# Architecture Documentation

RecoverAI is a technical prototype demonstrating how AI (both statistical ML and generative LLMs) can assist in revenue recovery while being strictly bound by deterministic policies to ensure safety and predictability in fintech.

## System Components

### 1. Synthetic Payment Data
Instead of relying on real production data or simple hardcoded arrays, the project uses a procedurally generated dataset of 25,000 synthetic payment attempts. This data contains noisy, latent relationships (e.g., specific failure reasons combined with customer history and payment amount mapping to recovery probabilities). This proves the ML model is actually learning patterns.

### 2. ML Prediction Service (Python/FastAPI)
- **Role:** Generates a real-time recovery probability (`0.0` to `1.0`) given the features of a failed payment.
- **Why:** Separates statistical inference from deterministic backend logic. Machine Learning is best suited for probabilistic classification, not taking executing actions.
- **Tech:** scikit-learn (Logistic Regression), FastAPI.

### 3. Recovery Engine (Node.js/Express)
- **Role:** The core orchestrator. It listens for failed payments (or handles simulated batches), builds feature payloads for the ML service, calls the AI agent, consults the Policy Engine, and simulates execution.
- **Why:** Centralizes the business workflow and ensures that all downstream services are queried in the exact required sequence.

### 4. AI Agent (LLMProvider Abstraction)
- **Role:** Ingests the `AgentContext` (payment facts, ML prediction, available actions) and returns a strictly typed `AgentRecommendation` via a Zod schema. It generates human-readable customer messages and text-based rationales.
- **Why:** Generative AI is uniquely suited for context-aware recommendations and dynamic message generation, providing personalized customer engagement that static rules cannot achieve.

### 5. Policy Engine
- **Role:** The ultimate deterministic authority. It receives the AI's recommendation and evaluates it against hardcoded bounds (e.g., "Cannot Retry if Probability < 0.7"). If the AI violates these bounds, the Policy Engine rejects the AI's action and enforces a safe fallback (e.g., Escalation).
- **Why:** In a real fintech environment, a hallucinating LLM cannot be allowed to execute infinite retries or drain a customer's bank account. Bounded AI is safe AI.

### 6. Database (PostgreSQL) & Idempotency
- **Role:** Stores state, audit events, and ensures system integrity.
- **Why:** 
  - `Decimal(10, 2)` precision guarantees exact monetary arithmetic, a core requirement for fintech software.
  - A `@unique` constraint on `RecoveryCase.paymentId` forces a 1-to-1 relationship, ensuring idempotency at the database layer (preventing race conditions if duplicate webhooks arrive concurrently).

### 7. Audit System
- **Role:** Generates an immutable, chronological JSON log of all decisions (`ML_PREDICTION_CREATED`, `AI_RECOMMENDATION_GENERATED`, `POLICY_EVALUATED`).
- **Why:** Provides traceability. A reviewer can explicitly see when an AI recommendation was generated, why it was chosen, and whether the deterministic Policy Engine approved or rejected it.

### 8. Frontend Dashboard (Next.js)
- **Role:** Visualizes the metrics and internal decision logic. Connects directly to the backend API (`/api/recovery/simulate`) to trigger end-to-end tests and visualizes the results.
