/** @type {import('next').NextConfig} */
const nextConfig = {
  // sql.js ships an Emscripten UMD bundle. Letting webpack process it breaks its
  // module.exports detection ("Cannot set properties of undefined"), so it must be
  // required by Node at runtime instead of being bundled.
  serverExternalPackages: ["sql.js"]
};

export default nextConfig;
