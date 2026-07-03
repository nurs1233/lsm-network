#!/usr/bin/env node
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import YAML from "yaml"
import { installPlugins, parsePluginSource } from "./gitLoader.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  const configPath = path.resolve(__dirname, "../../../quartz.config.yaml")
  const configFile = fs.readFileSync(configPath, "utf-8")
  const quartzConfig = YAML.parse(configFile)
  
  // Parse external plugins from raw plugins list (e.g. source: github:...)
  const rawPlugins = quartzConfig.plugins || []
  const externalPlugins = rawPlugins
    .filter((p: any) => p && p.source && p.source.startsWith("github:"))
    .map((p: any) => p.source)

  // Ensure .quartz/plugins directory and stub index.ts always exist
  const pluginsDir = path.resolve(__dirname, "../../../.quartz/plugins")
  if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir, { recursive: true })
  }
  const indexPath = path.join(pluginsDir, "index.ts")
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, "export const plugins = {}\n")
  }

  if (externalPlugins.length === 0) {
    console.log("No external plugins to install.")
    return
  }

  console.log(`Installing ${externalPlugins.length} plugin(s) from Git...`)

  const specs = externalPlugins.map((source: string) => parsePluginSource(source))
  const installed = await installPlugins(specs, { verbose: true })

  if (installed.size === externalPlugins.length) {
    console.log("✓ All plugins installed successfully")
  } else {
    console.error(`✗ Only ${installed.size}/${externalPlugins.length} plugins installed`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error("Failed to install plugins:", err)
  process.exit(1)
})
