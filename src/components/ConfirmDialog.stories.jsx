import { useState } from 'react'
import ConfirmDialog from './ConfirmDialog.jsx'
import Button from './Button.jsx'

export default {
  title: 'Overlays/Confirm Dialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: { component: "Asks \"are you sure?\" before an action that can't be undone — deleting a deck, deleting an account.\n\n**Use when** an action destroys something the person can't get back.\n\n**Don't use** for actions that can be undone — do them and offer Undo in a Toast instead — or for anything that needs more than a yes/no (Modal).\n\n*Build note:* built on Modal, so it follows the same `isMobile` rule." },
      story: { inline: false, iframeHeight: 360 },
    },
  },
}

function ConfirmStory() {
  const [open, setOpen] = useState(true)
  return (
    <>
      <Button variant="danger-outline" onClick={() => setOpen(true)}>Delete deck</Button>
      <ConfirmDialog
        open={open}
        title="Delete deck?"
        message={'This will permanently delete "Imported Words" and all 18 cards in it. This cannot be undone.'}
        confirmLabel="Delete"
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}

export const DeleteDeck = { render: () => <ConfirmStory /> }
