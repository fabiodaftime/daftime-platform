interface ObjectiveItemProps {
  icon: string;
  title: string;
  description: string;
}

export function RichissimeObjectiveItem({ icon, title, description }: ObjectiveItemProps) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-11 h-11 bg-richissime-gold-pale rounded-[10px] flex items-center justify-center text-xl flex-shrink-0">
        {icon}
      </div>
      <div>
        <strong className="block mb-1.5 text-richissime-navy">{title}</strong>
        <p className="text-sm text-richissime-muted leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
