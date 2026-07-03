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
  
  const externalPlugins = quartzConfig.externalPlugins || []

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
