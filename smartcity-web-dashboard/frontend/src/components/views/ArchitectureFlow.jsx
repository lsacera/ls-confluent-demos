export default function ArchitectureFlow() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Data Pipeline Architecture</h2>
      <p className="text-gray-600">Kafka topics → Flink processing → PostgreSQL</p>
      <div className="card p-6">
        <p className="text-gray-900">Architecture visualization coming soon...</p>
      </div>
    </div>
  );
}
