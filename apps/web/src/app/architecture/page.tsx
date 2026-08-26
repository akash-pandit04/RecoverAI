export default function ArchitecturePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <h1 className="text-3xl font-semibold text-gray-900">Recovery Decision Pipeline</h1>
      
      <div className="prose max-w-none text-gray-700">
        <p className="text-lg">
          RecoverAI is designed with strict boundaries between statistical prediction, language model reasoning, and deterministic policy enforcement. This prevents AI hallucinations from taking unsafe actions on user accounts or real money.
        </p>
        
        <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">1. Pipeline Flow</h2>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
          <img src="/images/pipeline-flow.png" alt="Pipeline Flow Diagram" className="w-full h-auto rounded" />
        </div>

      </div>
      
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-6 text-gray-900">2. System Architecture Diagram</h2>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <img src="/images/architecture.png" alt="System Architecture Diagram" className="w-full h-auto rounded" />
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold mb-6 text-gray-900">3. Database Schema (ER Diagram)</h2>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <img src="/images/er-diagram.png" alt="Database Entity Relationship Diagram" className="w-full h-auto rounded" />
        </div>
      </div>
    </div>
  );
}
