import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const buildId = String(Date.now())

function buildIdPlugin() {
  return {
    name: 'inject-build-id',
    transformIndexHtml(html) {
      return html.replace('</head>', `    <meta name="build-id" content="${buildId}" />\n  </head>`)
    },
  }
}

export default defineConfig({
  plugins: [react(), buildIdPlugin()],
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
})
