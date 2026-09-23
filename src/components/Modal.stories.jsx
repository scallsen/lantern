import { useState } from 'react'
import Modal from './Modal.jsx'
import Button from './Button.jsx'
import { TEXT_MUTED, FS_BASE } from '../data/theme.js'

export default {
  title: 'Overlays/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: { component: "Covers the page to focus on one task or decision — choosing a textbook, importing words, signing in.\n\n**Use when** the task needs full attention and should be finished or cancelled before going back.\n\n**Don't use** for a quick choice tied to a button (Popover), for \"are you sure?\" before deleting (Confirm Dialog, which is built on this), or to report that something happened (Toast).\n\n*Build note:* it becomes a bottom sheet only when you pass `isMobile` — it doesn't detect phones itself." },
      story: { inline: false, iframeHeight: 420 },
    },
  },
  argTypes: { size: { control: 'select', options: ['sm', 'md', 'lg'] } },
  args: { size: 'md', isMobile: false },
}

function ModalStory({ size, isMobile }) {
  const [open, setOpen] = useState(true)
  return (
    <>
      <Button variant="accent-outline" onClick={() => setOpen(true)}>Open modal</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Choose a deck"
        size={size}
        isMobile={isMobile}
        footer={<><Button variant="neutral" onClick={() => setOpen(false)}>Cancel</Button><Button variant="accent-outline" onClick={() => setOpen(false)}>Confirm</Button></>}
      >
        <div style={{ fontSize: FS_BASE, color: TEXT_MUTED, lineHeight: 1.6 }}>
          Any content mounts here. On mobile this same modal becomes a bottom sheet.
        </div>
      </Modal>
    </>
  )
}

export const Dialog = { render: args => <ModalStory {...args} /> }

export const BottomSheet = { render: args => <ModalStory {...args} />, args: { isMobile: true } }
