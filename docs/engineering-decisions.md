# Engineering Decisions

### Why Logistic Regression?
While deep learning (e.g., neural networks) or gradient boosting (e.g., XGBoost) could achieve higher accuracy, Logistic Regression was chosen for this prototype because it provides excellent probability calibration out-of-the-box and its weights are inherently interpretable. It acts as a perfect baseline model to demonstrate statistical inference.

### Why synthetic data?
Using a clean, procedurally generated synthetic dataset avoids the risk of data leakage, protects customer PII, and allows us to explicitly embed latent patterns (e.g., `insufficient_balance` having lower recovery rates than `network_error`) that the model can learn and demonstrate in a clean, reproducible way.

### Why a separate ML service?
Separating the ML inference (Python/FastAPI) from the business logic (Node.js/Express) mirrors production microservice architectures. Python boasts a superior ML ecosystem (scikit-learn, joblib), while Node.js excels at highly concurrent I/O orchestration.

### Why a Provider Abstraction for the LLM?
Defining an `LLMProvider` interface (currently fulfilled by `MockLLMProvider`) allows the system to remain highly testable and deterministic during automated CI/CD. It enables a seamless swap to a real `OpenAILLMProvider` in the future without refactoring the core orchestrator.

### Why a deterministic Policy Engine?
LLMs are prone to hallucination, sycophancy, and prompt-injection. A deterministic Policy Engine acts as an impenetrable safety wrapper. The AI is only allowed to recommend actions; the Policy Engine executes them. This is the only safe way to integrate generative AI into a financial pipeline.

### Why structured LLM output (Zod)?
Requesting raw text from an LLM forces the backend to rely on fragile Regex parsing. Enforcing a strict JSON schema via Zod ensures that the orchestrator receives exactly the `recommended_action`, `confidence`, and `reason` fields it expects, allowing it to gracefully fail over to deterministic logic if the LLM output is malformed.

### Why Prisma Decimal?
Floating-point arithmetic introduces microscopic precision errors (e.g., `0.1 + 0.2 = 0.30000000000000004`), which is unacceptable for financial software. Prisma's `Decimal` type maps to PostgreSQL's arbitrary precision numeric types, guaranteeing exact math.

### Why database uniqueness for Idempotency?
Application-layer checks (e.g., `if (case.status === 'OPEN') return;`) are vulnerable to race conditions if multiple concurrent webhooks arrive simultaneously. Enforcing a `@unique` constraint at the database schema layer offloads concurrency protection to PostgreSQL, completely preventing duplicate execution states.

### Why Audit Events?
In a regulated environment, "black box" AI decisions are unacceptable. By logging every step of the decision tree (`ML Prediction` -> `AI Rationale` -> `Policy Validation`), the system provides total transparency to human reviewers and compliance teams.
