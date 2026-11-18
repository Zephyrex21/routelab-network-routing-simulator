export default function Tabs({ value, onChange, items, label = 'View options' }) {
  return (
    <div className="tabs" role="group" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          className={`tab ${value === item.value ? 'tab-active' : ''}`}
          aria-pressed={value === item.value}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
