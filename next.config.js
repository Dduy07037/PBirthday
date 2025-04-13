/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Tăng kích thước tệp tối đa
  experimental: {
    largePageDataBytes: 128 * 1000 * 1000, // 128MB
  },
  // Cấu hình webpack để xử lý file model
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/files',
          outputPath: 'static/files',
        },
      },
    });
    
    // Tăng kích thước gói cho các file lớn
    config.performance = {
      ...config.performance,
      maxAssetSize: 30 * 1024 * 1024, // 30MB
      maxEntrypointSize: 30 * 1024 * 1024, // 30MB
    };

    return config;
  },
};

module.exports = nextConfig; 