import cardEllipse from './assets/icons/card-ellipse.svg'
import arrowLeftRight from './assets/icons/arrow-left-right.svg'
import arrowOutward from './assets/icons/arrow-outward.svg'
import arrowInward from './assets/icons/arrow-inward.svg'
import menuVertical from './assets/icons/menu-vertical.svg'

export function BalanceCard() {
  return (
    <section className="balance-card" aria-label="Account balance">
      <div className="stacked-cards">
        <div className="payment-card payment-card--back">
          <img className="icon" src={cardEllipse} alt="" width={24} height={24} />
          <span className="payment-card__number">**** 3765</span>
        </div>
        <div className="payment-card payment-card--front">
          <div className="payment-card__row">
            <span className="payment-card__brand">VISA</span>
            <img className="payment-card__toggle" src={arrowLeftRight} alt="" width={16} height={16} />
          </div>
          <div className="payment-card__bottom">
            <span className="payment-card__number">**** 4329</span>
            <span className="payment-card__expiry">09/26</span>
          </div>
        </div>
      </div>

      <div className="balance-details">
        <div className="balance-details__labels">
          <p className="balance-details__label">Total balance</p>
          <p className="balance-details__amount">$ 87,325.96</p>
          <p className="balance-details__available">
            Available to spend: <strong>$87,325.96</strong>
          </p>
        </div>
        <div className="balance-details__actions">
          <button className="button button--neutral" type="button">
            Transfer
            <img className="icon" src={arrowOutward} alt="" width={24} height={24} />
          </button>
          <button className="button button--neutral" type="button">
            Request
            <img className="icon" src={arrowInward} alt="" width={24} height={24} />
          </button>
          <button className="button button--icon" type="button" aria-label="More account actions">
            <img className="icon" src={menuVertical} alt="" width={24} height={24} />
          </button>
        </div>
      </div>
    </section>
  )
}
