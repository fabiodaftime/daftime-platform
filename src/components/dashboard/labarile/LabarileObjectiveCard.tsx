interface LabarileObjectiveCardProps {
  title: string;
  description: string;
}

export function LabarileObjectiveCard({ title, description }: LabarileObjectiveCardProps) {
  return (
    <div className="bg-gradient-to-br from-labarile-white to-labarile-ice1 rounded-xl p-5 lg:p-6 border border-labarile-border">
      <div className="flex items-start gap-3">
        <span className="text-labarile-primary text-xl">✓</span>
        <div>
          <h4 className="font-semibold text-base lg:text-lg text-labarile-title mb-2">{title}</h4>
          <p className="text-sm text-labarile-text leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}
