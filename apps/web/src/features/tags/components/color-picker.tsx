import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#ec4899'
];

const isValidHexColor = (color: string) => /^#[\dA-Fa-f]{6}$/.test(color);

type ColorPickerProps = {
  onChange: (color: string) => void;
  value: string;
};

export function ColorPicker({ onChange, value }: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            className={cn(
              'relative size-8 rounded-full border-2 transition-all',
              'focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none'
            )}
            key={color}
            onClick={() => onChange(color)}
            style={{ backgroundColor: color }}
            type="button"
          >
            {value === color && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="text-white drop-shadow-md">
                  <svg
                    aria-hidden="true"
                    className="size-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      clipRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      fillRule="evenodd"
                    />
                  </svg>
                </span>
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">#</span>
        <input
          className="border-input bg-background flex-1 rounded-md border px-3 py-1 font-mono text-sm"
          maxLength={6}
          onChange={(e) => {
            if (/^[\dA-Fa-f]*$/.test(e.target.value)) {
              onChange(`#${e.target.value}`);
            }
          }}
          placeholder="3B82F6"
          value={value.replace('#', '')}
        />
        {isValidHexColor(value) && (
          <div className="size-8 rounded-full border" style={{ backgroundColor: value }} />
        )}
      </div>
    </div>
  );
}
