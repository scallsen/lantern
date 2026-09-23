import { themes } from 'storybook/theming'
import '../src/global.css'
import { FONT, TRACKING, TEXT } from '../src/data/theme.js'

const BG = '#1E1E1E'

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  parameters: {
    // Docs pages match the app's dark UI instead of framing every dark
    // preview in a white page.
    docs: { theme: themes.dark },
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo"
    }
  },
  decorators: [
    // Fill the canvas on a story's own page, but hug the content on a Docs
    // page — there stories render inline, so 100vh would make every preview
    // a full window tall.
    // Fullscreen stories get no canvas padding, so the -1rem that cancels the
    // default padding would overflow them into scrollbars.
    (Story, { viewMode, parameters }) => (
      <div style={{
        ...(viewMode === 'docs'
          ? { padding: 24 }
          : parameters.layout === 'fullscreen'
            ? { minHeight: '100vh' }
            : { minHeight: '100vh', margin: '-1rem', padding: '1rem 24px' }),
        background: BG, fontFamily: FONT, letterSpacing: TRACKING, color: TEXT,
      }}>
        <Story />
      </div>
    ),
  ],
};

export default preview;