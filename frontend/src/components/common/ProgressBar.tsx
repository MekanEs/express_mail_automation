import React from 'react';

interface ProgressBarProps {
  value: number; // current value
  max: number;   // maximum value
  bgColor?: string; // background color of the bar container
  fillColor?: string; // color of the filled part
  height?: string; // height of the bar
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  bgColor = 'bg-gray-200',
  fillColor = 'bg-blue-500',
  height = 'h-2',
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className={`w-full ${bgColor} rounded-full ${height} overflow-hidden`}>
      <div
        className={`${fillColor} ${height} rounded-full`}
        style={{ width: `${percentage}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      ></div>
    </div>
  );
};
