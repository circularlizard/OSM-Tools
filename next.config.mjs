 import path from 'path'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    swcPlugins: [],
  },
  webpack: (config) => {
    if (process.env.INSTRUMENT_CODE === '1') {
      config.module.rules.push({
        test: /\.[jt]sx?$/,
        include: [path.join(process.cwd(), 'src')],
        enforce: 'post',
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['next/babel'],
            plugins: ['istanbul'],
          },
        },
      })
    }

    return config
  },
}

export default nextConfig
