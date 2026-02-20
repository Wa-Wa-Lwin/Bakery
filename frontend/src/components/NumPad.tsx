interface Props {
  value: string;
  onChange: (v: string) => void;
  maxLength?: number; // max digit count (not counting '.')
  decimal?: boolean;  // show decimal point key
}

export default function NumPad({ value, onChange, maxLength, decimal = false }: Props) {
  function press(key: string) {
    if (key === '⌫') {
      onChange(value.slice(0, -1));
      return;
    }

    if (key === '.') {
      if (!decimal || value.includes('.')) return;
      onChange((value === '' ? '0' : value) + '.');
      return;
    }

    // Count digits only (not the decimal point)
    const digitCount = value.replace('.', '').length;
    if (maxLength && digitCount >= maxLength) return;

    // Max 2 decimal places
    if (decimal && value.includes('.')) {
      const decimals = value.split('.')[1] ?? '';
      if (decimals.length >= 2) return;
    }

    onChange(value + key);
  }

  const rows: string[][] = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    [decimal ? '.' : '', '0', '⌫'],
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {rows.flat().map((key, i) =>
        key === '' ? (
          <div key={i} />
        ) : (
          <button
            key={i}
            type="button"
            onClick={() => press(key)}
            className={`h-14 rounded-xl text-xl font-semibold transition-all active:scale-95 select-none
              ${key === '⌫'
                ? 'bg-stone-200 hover:bg-stone-300 text-stone-600'
                : key === '.'
                  ? 'bg-stone-100 hover:bg-stone-200 text-stone-500 text-2xl'
                  : 'bg-stone-100 hover:bg-amber-100 text-stone-800'
              }`}
          >
            {key}
          </button>
        )
      )}
    </div>
  );
}
