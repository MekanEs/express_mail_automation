import { FC } from 'react';

interface Preset {
  label: string;
  value: number;
}

interface ProcessFormInputProps {
  value: number;
  setValue: (value: number) => void;
  points: number[];
  min?: number;
  max?: number;
  error?: string;
  presets?: Preset[];
}

export const ProcessFormInput: FC<ProcessFormInputProps> = ({
  value,
  setValue,
  points,
  min = 0,
  max,
  error,
  presets
}) => {
  return (
    <div className='flex w-full gap-3 flex-col'>
      <div className='flex w-full gap-3 items-center'>
        <input
          className={`border-2 rounded-md p-2 w-1/4 ${error ? 'border-red-500' : 'border-gray-300'}`}
          type="number"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          min={min}
          max={max}
        />
        <div className="mt-2 w-3/4">
          <input
            type="range"
            min={min}
            max={max ?? 100}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500">
            {points.map(point => (
              <span key={point}>{point}</span>
            ))}
          </div>
        </div>
      </div>
      {presets && presets.length > 0 && (
        <div className="flex gap-2 mt-2 flex-wrap w-full justify-center">
          {presets.map(preset => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setValue(preset.value)}
              className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};
