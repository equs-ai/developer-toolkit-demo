import { useEffect, useId, useRef, useState } from 'react'
import avatarIcon from './assets/icons/avatar.svg'
import logoutIcon from './assets/icons/logout.svg'

type AccountMenuProps = {
  userEmail?: string
  onLogout: () => void
}

export function AccountMenu({ userEmail, onLogout }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const firstItemRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      firstItemRef.current?.focus()
    }
  }, [isOpen])

  const handleLogout = () => {
    setIsOpen(false)
    triggerRef.current?.focus()
    onLogout()
  }

  return (
    <div className="account" ref={wrapperRef}>
      <button
        className="account__trigger"
        type="button"
        ref={triggerRef}
        aria-label="Account"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setIsOpen((open) => !open)}
      >
        <img className="icon" src={avatarIcon} alt="" width={24} height={24} />
      </button>

      {isOpen && (
        <div className="account__menu" id={menuId} role="menu" aria-label="Account">
          {userEmail && <p className="account__user">{userEmail}</p>}
          <button className="account__item" type="button" role="menuitem" ref={firstItemRef} onClick={handleLogout}>
            <img className="icon" src={logoutIcon} alt="" width={24} height={24} />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
