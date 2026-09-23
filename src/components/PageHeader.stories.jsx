import PageHeader from './PageHeader.jsx'
import TopProgressBar from './TopProgressBar.jsx'
import { BRAND } from '../data/theme.js'

export default {
  title: 'Layout/Page Header',
  component: PageHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: "The bar across the top of every page: breadcrumbs showing where you are, with the account control on the right.\n\n**Use when** building any page — every page has exactly one.\n\n**Don't use** to label groups within a page (Section Header).\n\n*Build note:* a crumb with `href` is a link, one with `onClick` is a clickable label (for leaving a drill that's already on the right URL), and one with neither is the current page. A Top Progress Bar goes in as its child." } },
  },
  args: {
    crumbs: [{ label: 'Lantern', href: '#/' }, { label: 'Reviews', href: '#/vocab-srs' }, { label: 'Review' }],
  },
}

export const Breadcrumbs = {}

export const HomeOnly = { args: { crumbs: [{ label: 'Lantern', href: '#/' }] } }

export const WithProgress = {
  render: args => (
    <PageHeader {...args}>
      <TopProgressBar progress={0.4} color={BRAND} />
    </PageHeader>
  ),
}
