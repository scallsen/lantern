import TopProgressBar from './TopProgressBar.jsx'
import { BRAND } from '../data/theme.js'

export default {
  title: 'Layout/Top Progress Bar',
  component: TopProgressBar,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: "A thin bar showing how far along something is — a drill session's completion, or a sweep while something loads.\n\n**Use when** tracking progress toward one finish line, or showing that a slow operation is underway.\n\n**Don't use** to show how a collection splits across several states (Distribution Bar).\n\n*Build note:* pass `progress` (0–1) for a filling bar, or `loading` for a sweep — delay `loading` with `useDelayedLoading` so it doesn't flash on fast operations. Usually placed inside the Page Header. Pass `color` explicitly; the default is a leftover teal." } },
  },
  argTypes: { progress: { control: { type: 'range', min: 0, max: 1, step: 0.05 } } },
  args: { progress: 0.4, color: BRAND },
  decorators: [Story => <div style={{ width: 420 }}><Story /></div>],
}

export const Progress = {}

export const Loading = { args: { progress: undefined, loading: true } }
