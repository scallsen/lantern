import { useState } from 'react'
import Toast from './Toast.jsx'
import Button from './Button.jsx'

export default {
  title: 'Overlays/Toast',
  component: Toast,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: { component: "A brief message confirming something just happened, optionally with Undo.\n\n**Use when** an action succeeded and people should know without being interrupted — \"Added 3 words to Immersion Words.\"\n\n**Don't use** for errors that need action (show them in place) or for anything someone might need to read later — it disappears." },
      story: { inline: false, iframeHeight: 320 },
    },
  },
  argTypes: { variant: { control: 'select', options: ['bottom-card', 'bottom-bar', 'top-card', 'top-bar'] } },
  args: { variant: 'bottom-card', withAction: true },
}

function ToastStory({ variant, withAction }) {
  const [open, setOpen] = useState(true)
  return (
    <div>
      <Button variant="accent-outline" onClick={() => setOpen(true)}>Trigger toast</Button>
      <Toast
        open={open}
        variant={variant}
        message="Added 3 words to Imported Words."
        actionLabel={withAction ? 'Undo' : undefined}
        onAction={() => {}}
        onDismiss={() => setOpen(false)}
      />
    </div>
  )
}

export const BottomCard = { render: args => <ToastStory {...args} /> }
export const BottomBar = { ...BottomCard, args: { variant: 'bottom-bar' } }
export const TopCard = { ...BottomCard, args: { variant: 'top-card' } }
export const TopBar = { ...BottomCard, args: { variant: 'top-bar' } }
export const WithoutAction = { ...BottomCard, args: { withAction: false } }
