'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'ldsp-install-banner-dismissed-at'
const DISMISS_DAYS = 14

function isStandalone() {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    nav.standalone === true
  )
}

function isIos() {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { maxTouchPoints?: number }
  return (
    /iphone|ipad|ipod/i.test(nav.userAgent) ||
    (nav.platform === 'MacIntel' && (nav.maxTouchPoints ?? 0) > 1)
  )
}

function isDismissed() {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    const dismissedAt = Number(raw)
    if (!Number.isFinite(dismissedAt)) return false
    return Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

export default function InstallBanner() {
  const [visible, setVisible] = useState(false)
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [ios] = useState(() => isIos())

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') return

    navigator.serviceWorker
      .register('/sw.js')
      .catch((error) => console.error('Service worker registration failed:', error))
  }, [])

  useEffect(() => {
    if (isStandalone() || isDismissed()) return

    const handlePrompt = (event: Event) => {
      event.preventDefault()
      setPromptEvent(event as BeforeInstallPromptEvent)
      setVisible(true)
    }

    const handleInstalled = () => {
      setPromptEvent(null)
      setVisible(false)
    }

    window.addEventListener('beforeinstallprompt', handlePrompt)
    window.addEventListener('appinstalled', handleInstalled)

    // iOS never fires beforeinstallprompt, so show the guide after the page settles.
    const timer = isIos() ? window.setTimeout(() => setVisible(true), 1500) : undefined

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt)
      window.removeEventListener('appinstalled', handleInstalled)
      if (timer) window.clearTimeout(timer)
    }
  }, [])

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      // Storage can be unavailable (private mode); dismissing still works this session.
    }
    setVisible(false)
  }

  const install = async () => {
    if (!promptEvent) return

    await promptEvent.prompt()
    const choice = await promptEvent.userChoice
    setPromptEvent(null)

    if (choice.outcome === 'accepted') {
      setVisible(false)
    } else {
      dismiss()
    }
  }

  if (!visible) return null

  return (
    <div
      role="region"
      aria-label="Install app"
      className="fixed inset-x-4 bottom-4 z-50 sm:inset-x-auto sm:right-6 sm:w-96"
    >
      <div className="bg-white border rounded-xl shadow-lg p-4 flex gap-3 items-start">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0"
          style={{ backgroundColor: 'var(--primary-color)' }}
          aria-hidden="true"
        >
          LDSP
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Install the LDSP Alumni app</p>

          {ios ? (
            <p className="text-xs text-gray-600 mt-1">
              Tap the <span className="font-semibold">Share</span> button (square with an
              arrow), then <span className="font-semibold">Add to Home Screen</span>.
            </p>
          ) : (
            <p className="text-xs text-gray-600 mt-1">
              Put the icon on your home screen and open it like any app.
            </p>
          )}

          <div className="flex gap-2 mt-2">
            {!ios && (
              <button
                type="button"
                onClick={install}
                disabled={!promptEvent}
                className="text-xs font-semibold text-white rounded-lg px-3 py-1.5 disabled:opacity-50"
                style={{ backgroundColor: 'var(--primary-color)' }}
              >
                Install
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="text-xs font-semibold text-gray-600 rounded-lg px-3 py-1.5 border"
            >
              {ios ? 'Got it' : 'Not now'}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="text-gray-400 hover:text-gray-600 leading-none text-lg"
        >
          ×
        </button>
      </div>
    </div>
  )
}
