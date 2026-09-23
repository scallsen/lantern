import { useState, useEffect } from 'react'
import DevIndexPage from './pages/DevIndexPage.jsx'
import ToastLabPage from './pages/ToastLabPage.jsx'
import SettingsLabPage from './pages/SettingsLabPage.jsx'
import TextbookPickerLabPage from './pages/TextbookPickerLabPage.jsx'
import HomeFlowLabPage from './pages/HomeFlowLabPage.jsx'
import TextbookFlowLabPage from './pages/TextbookFlowLabPage.jsx'
import TrackedStatLabPage from './pages/TrackedStatLabPage.jsx'
import CoverRotationLabPage from './pages/CoverRotationLabPage.jsx'
import SecondaryButtonLabPage from './pages/SecondaryButtonLabPage.jsx'
import DrillFlipLabPage from './pages/DrillFlipLabPage.jsx'
import SegmentColorLabPage from './pages/SegmentColorLabPage.jsx'
import AccentPolishLabPage from './pages/AccentPolishLabPage.jsx'

// The archive of retired design explorations. The index is the home page;
// each lab keeps the #/dev/* path it had while it lived in the app.
const LABS = {
  '/dev/toast-lab': ToastLabPage,
  '/dev/settings-lab': SettingsLabPage,
  '/dev/textbook-picker': TextbookPickerLabPage,
  '/dev/home-flow': HomeFlowLabPage,
  '/dev/textbook-flow': TextbookFlowLabPage,
  '/dev/tracked-stat': TrackedStatLabPage,
  '/dev/cover-rotation': CoverRotationLabPage,
  '/dev/secondary-button-lab': SecondaryButtonLabPage,
  '/dev/drill-flip-lab': DrillFlipLabPage,
  '/dev/segment-colors': SegmentColorLabPage,
  '/dev/accent-polish': AccentPolishLabPage,
}

function getRoute() {
  return window.location.hash.slice(1).split('?')[0] || '/'
}

export default function App() {
  const [route, setRoute] = useState(getRoute)

  useEffect(() => {
    const root = document.getElementById('root')
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    root.style.overflow = 'hidden'
    root.style.height = '100%'
  }, [])

  useEffect(() => {
    const handler = () => setRoute(getRoute())
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  const Lab = LABS[route]
  return Lab ? <Lab /> : <DevIndexPage />
}
