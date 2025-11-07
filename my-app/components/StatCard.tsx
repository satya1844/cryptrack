interface StatCardProps {
  title: string;
  value: string;
}

export default function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="bg-card border text-secondary-foreground border-border rounded-md shadow p-4 flex flex-col">
      <h4 className="text-gray-500 text-sm">{title}</h4>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
