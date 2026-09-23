import Disclosure from './Disclosure.jsx'
import { TEXT_MUTED, FS_BASE } from '../data/theme.js'

export default {
  title: 'Layout/Disclosure',
  component: Disclosure,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "Hides secondary content behind a labelled toggle until someone asks for it — like an article's English summary, kept out of sight so it doesn't give the reading away.\n\n**Use when** content is optional, or would spoil the task if shown up front.\n\n**Don't use** for content most people need (just show it) or for switching between views (Chip Selector in single mode)." } },
  },
  args: { label: 'English summary', defaultOpen: false },
}

export const Playground = {
  render: args => (
    <div style={{ width: 420 }}>
      <Disclosure {...args}>
        <div style={{ fontSize: FS_BASE, color: TEXT_MUTED, lineHeight: 1.6 }}>
          Japan&apos;s cherry blossoms bloomed about a week earlier than usual this year, following an unusually warm March.
        </div>
      </Disclosure>
    </div>
  ),
}

export const DefaultOpen = { ...Playground, args: { defaultOpen: true } }
