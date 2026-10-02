import shoppingIcon from './assets/icons/tx-shopping.svg'
import mobileIcon from './assets/icons/tx-mobile.svg'
import shieldIcon from './assets/icons/tx-shield.svg'
import optionsIcon from './assets/icons/tx-options.svg'

const TRANSACTIONS = [
  { title: 'Online shopping', date: '07 Feb, 11:18 AM', amount: '- $50.24', icon: shoppingIcon },
  { title: 'Phone bill', date: '07 Feb, 11:18 AM', amount: '- $10.00', icon: mobileIcon },
  { title: 'Insurance', date: '07 Feb, 11:18 AM', amount: '- $280.00', icon: shieldIcon },
]

export function LastTransactions() {
  return (
    <section className="panel">
      <div className="transactions__header">
        <h2 className="panel__title">Last transactions</h2>
        <button className="button button--small" type="button">
          View all
        </button>
      </div>
      <div className="transactions__list">
        {TRANSACTIONS.map((transaction) => (
          <div className="transaction" key={transaction.title}>
            <div className="transaction__info">
              <span className="transaction__icon">
                <img className="icon" src={transaction.icon} alt="" width={24} height={24} />
              </span>
              <span className="transaction__text">
                <span className="transaction__title">{transaction.title}</span>
                <span className="transaction__date">{transaction.date}</span>
              </span>
            </div>
            <div className="transaction__amount-group">
              <span className="transaction__amount">{transaction.amount}</span>
              <button className="transaction__options" type="button" aria-label={`Options for ${transaction.title}`}>
                <img className="icon" src={optionsIcon} alt="" width={24} height={24} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
