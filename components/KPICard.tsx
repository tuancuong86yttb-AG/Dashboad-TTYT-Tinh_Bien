import React from 'react';
import clsx from 'clsx';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'red' | 'purple' | 'orange';
  subtext?: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon: Icon, color = 'blue', subtext }) => {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
  };

  const iconStyles = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className={clsx("rounded-xl border p-4 shadow-sm transition-all hover:shadow-md", colorStyles[color])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-80 uppercase tracking-wide">{title}</p>
          <h3 className="mt-1 text-2xl font-bold">{value}</h3>
          {subtext && <p className="mt-1 text-xs opacity-75">{subtext}</p>}
        </div>
        <div className={clsx("rounded-lg p-2", iconStyles[color])}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

export default KPICard;
