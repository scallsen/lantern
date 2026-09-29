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
import { AuthProvider } from './context/AuthContext.jsx'
import DrillContextLab from './labs/drill-context/DrillContextLab.jsx'
import ContextBandLab from './labs/drill-context/ContextBandLab.jsx'
import DetailsLab from './labs/drill-context/DetailsLab.jsx'
import DetailsV4Lab from './labs/drill-context/DetailsV4Lab.jsx'
import DetailsV5Lab from './labs/drill-context/DetailsV5Lab.jsx'
import DetailsV6Lab from './labs/drill-context/DetailsV6Lab.jsx'
import DetailsV7Lab from './labs/drill-context/DetailsV7Lab.jsx'
import DarkPanelLab from './labs/drill-context/DarkPanelLab.jsx'
import HeightLab from './labs/drill-context/HeightLab.jsx'

// The drill card context labs were Storybook stories on main, which gave
// each a full-screen scrolling canvas; here the page is pinned at
// overflow: hidden, so each gets its own scroller. The details panel's word
// lookup (WordPopup) reads useAuth(), which is null outside a provider — with
// no database on this branch the provider just reports signed out.
function storyPage(Lab) {
  return function StoryPage() {
    return (
      <AuthProvider>
        <div style={{ height: '100dvh', overflowY: 'auto', background: '#1E1E1E' }}><Lab /></div>
      </AuthProvider>
    )
  }
}

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
  '/dev/drill-context': storyPage(DrillContextLab),
  '/dev/drill-context/band-v2': storyPage(ContextBandLab),
  '/dev/drill-context/details-v3': storyPage(DetailsLab),
  '/dev/drill-context/details-v4': storyPage(DetailsV4Lab),
  '/dev/drill-context/details-v5': storyPage(DetailsV5Lab),
  '/dev/drill-context/details-v6': storyPage(DetailsV6Lab),
  '/dev/drill-context/details-v7': storyPage(DetailsV7Lab),
  '/dev/drill-context/dark-panel': storyPage(DarkPanelLab),
  '/dev/drill-context/height': storyPage(HeightLab),
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
