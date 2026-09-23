import { useState } from 'react'
import SettingsSidebar, { SidebarHeaderToggle } from './SettingsSidebar.jsx'
import SectionHeader from './SectionHeader.jsx'
import Switch from './Switch.jsx'
import { TEXT_MUTED, FS_BASE } from '../data/theme.js'

const ROWS = ['Furigana', 'Audio', 'Meaning', 'Kanji breakdown', 'Sentence']

export default {
  title: 'Layout/Settings Sidebar',
  component: SettingsSidebar,
  subcomponents: { SidebarHeaderToggle },
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: { component: "The panel holding a drill's settings — a side rail on desktop, an overlay on phones.\n\n**Use when** a screen has settings people change while using it, like what the card shows or which voice speaks.\n\n**Don't use** for choices made once before starting (a Filter Card on the screen) or for account settings (the Account page).\n\n*Build note:* `children` is a function that receives the padding to use. On phones, put `SidebarHeaderToggle` in the Page Header's right slot to open it." },
      story: { inline: false, iframeHeight: 520 },
    },
  },
  argTypes: { isMobile: { control: 'boolean' } },
  args: { isMobile: false },
}

function SidebarDemo({ isMobile }) {
  const [open, setOpen] = useState(true)
  const [on, setOn] = useState(() => new Set(['Meaning', 'Sentence']))
  const toggle = row => setOn(prev => {
    const next = new Set(prev)
    if (next.has(row)) next.delete(row); else next.add(row)
    return next
  })
  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      <div style={{ flex: 1, padding: 24, color: TEXT_MUTED, fontSize: FS_BASE }}>
        Drill content
        {isMobile && !open && <div style={{ marginTop: 16 }}><SidebarHeaderToggle onClick={() => setOpen(true)} /></div>}
      </div>
      <SettingsSidebar open={open} onToggle={() => setOpen(v => !v)} onClose={() => setOpen(false)} isMobile={isMobile}>
        {paddingH => (
          <div style={{ padding: `16px ${paddingH}px` }}>
            <SectionHeader title="Card" />
            {ROWS.map(row => (
              <div key={row} className="settings-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <span style={{ fontSize: FS_BASE }}>{row}</span>
                <Switch checked={on.has(row)} onChange={() => toggle(row)} label={row} />
              </div>
            ))}
          </div>
        )}
      </SettingsSidebar>
    </div>
  )
}

export const Desktop = { render: args => <SidebarDemo {...args} /> }

export const Mobile = { render: args => <SidebarDemo {...args} />, args: { isMobile: true } }
