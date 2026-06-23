import { useEffect, useState } from 'react';

export default function IconPicker({ value, category, onChange }) {
  const [icons, setIcons] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/icons')
      .then((r) => r.json())
      .then(setIcons)
      .catch(() => setError(true));
  }, []);

  // Resolve current icon: explicit value → category default → first icon
  const explicitIcon = value ? icons.find((i) => i.key === value) : null;
  const current =
    explicitIcon ||
    (category && icons.find((i) => i.defaultFor?.includes(category))) ||
    icons[0];
  const isDefault = !explicitIcon && icons.length > 0;

  function select(key) {
    onChange(key);
    setOpen(false);
  }

  return (
    <div>
      <label className="text-xs text-gray-600">Ícono del negocio</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-1 flex items-center gap-2 w-full border rounded px-2 py-1.5 text-sm hover:bg-gray-50"
      >
        {current ? (
          <IconCircle icon={current} size={26} />
        ) : (
          <span className="w-6 h-6 rounded-full bg-gray-200 inline-block" />
        )}
        <span className="flex-1 text-left text-gray-700">
          {error ? <span className="text-red-500">Error al cargar íconos</span> : (current?.label ?? 'Cargando…')}
          {!error && isDefault && (
            <span className="ml-1 text-xs text-gray-400">(por defecto)</span>
          )}
        </span>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-1 border rounded-lg p-3 grid grid-cols-5 gap-2 max-h-52 overflow-y-auto bg-white shadow-lg z-10 relative">
          {icons.map((icon) => {
            const isSelected = value
              ? icon.key === value
              : icon.key === current?.key;
            return (
              <button
                key={icon.key}
                type="button"
                title={icon.label}
                onClick={() => select(icon.key)}
                className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-xs hover:bg-gray-50 transition-colors ${
                  isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
              >
                <IconCircle icon={icon} size={32} />
                <span className="text-gray-600 truncate w-full text-center leading-tight" style={{ fontSize: 10 }}>
                  {icon.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IconCircle({ icon, size }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        background: icon.color,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
      // The SVG comes from our own server-side registry — not user input
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: icon.svg.replace(
          '<svg ',
          `<svg style="width:${Math.round(size * 0.55)}px;height:${Math.round(size * 0.55)}px;fill:#fff;color:#fff" `,
        ),
      }}
    />
  );
}
