import Button from './Button.jsx'

export default {
  title: 'Atoms/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "Triggers an action — start a drill, save, delete, open a dialog.\n\n**Use when** clicking does something. `primary` is the one most important action on a screen; everything else is a quieter variant.\n\n**Don't use** for switching something on and off (Toggle Button), for choosing between options (Chip Selector), or for going to another page (a link).\n\n*Build note:* an icon-only button is `icon` + `label` with no children; use `ghost-muted` for dismiss and remove." } },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'accent-outline', 'neutral', 'quiet', 'danger-outline', 'warning-outline', 'ghost', 'ghost-muted'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
  },
  args: {
    variant: 'primary',
    size: 'md',
    disabled: false,
    children: 'Start Review',
  },
}

export const Playground = {}

export const AllVariants = {
  render: args => (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {['primary', 'accent-outline', 'neutral', 'quiet', 'danger-outline', 'warning-outline', 'ghost', 'ghost-muted'].map(v => (
        <Button key={v} variant={v} size={args.size}>{v}</Button>
      ))}
    </div>
  ),
}

export const WithIcon = {
  args: { icon: '♪', children: 'Play audio' },
}

export const IconOnly = {
  args: { variant: 'ghost-muted', icon: '×', label: 'Dismiss', children: undefined },
}

export const Disabled = {
  args: { disabled: true },
}
