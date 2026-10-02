const CATEGORIES = [
  { label: 'Housing & Rent', color: 'var(--icons-neutral-default)', percent: '42%', amount: '$2,100' },
  { label: 'Food & Dining', color: 'var(--icons-positive-default)', percent: '24%', amount: '$1,200' },
  { label: 'Shopping', color: 'var(--icons-information-default)', percent: '18%', amount: '$900' },
  { label: 'Entertainment', color: 'var(--icons-warning-default)', percent: '10%', amount: '$500' },
  { label: 'Others', color: 'var(--icons-disabled-default)', percent: '6%', amount: '$300' },
]

export function SpendingAnalytics() {
  return (
    <section className="panel">
      <h2 className="panel__title">Spending Analytics</h2>
      <div className="spending">
        <div className="spending__bar" aria-hidden="true">
          {CATEGORIES.map((category) => (
            <span key={category.label} className="spending__bar-segment" style={{ background: category.color }} />
          ))}
        </div>
        <div className="spending__legend">
          {CATEGORIES.map((category) => (
            <div className="spending__row" key={category.label}>
              <span className="spending__category">
                <span className="spending__swatch" style={{ background: category.color }} />
                {category.label}
              </span>
              <span className="spending__values">
                <span className="spending__percent">{category.percent}</span>
                <span className="spending__amount">{category.amount}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
