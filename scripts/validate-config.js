#!/usr/bin/env node

/**
 * DevContext Configuration Validator
 * Validates devcontext.json against schema
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configPath = process.argv[2] || join(process.cwd(), 'devcontext.json');

try {
  // Load schema
  const schemaPath = join(__dirname, '../config/devcontext.schema.json');
  const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

  // Load config
  const config = JSON.parse(readFileSync(configPath, 'utf-8'));

  // Basic validation
  const required = schema.required || [];
  const missing = required.filter(field => !(field in config));

  if (missing.length > 0) {
    console.error('❌ Validation failed: Missing required fields:', missing.join(', '));
    process.exit(1);
  }

  // Validate project type
  const validTypes = schema.properties.projectType.enum;
  if (!validTypes.includes(config.projectType)) {
    console.error(`❌ Invalid projectType: ${config.projectType}`);
    console.error(`   Valid options: ${validTypes.join(', ')}`);
    process.exit(1);
  }

  // Validate domains
  if (!Array.isArray(config.domains) || config.domains.length === 0) {
    console.error('❌ Validation failed: domains must be a non-empty array');
    process.exit(1);
  }

  for (const domain of config.domains) {
    if (!domain.name || !domain.patterns || !domain.description) {
      console.error('❌ Invalid domain:', domain);
      console.error('   Each domain must have: name, patterns, description');
      process.exit(1);
    }
  }

  console.log('✅ Configuration is valid!');
  console.log(`\nProject: ${config.projectName} (${config.projectType})`);
  console.log(`Domains: ${config.domains.length}`);
  config.domains.forEach(d => console.log(`  - ${d.name}: ${d.description}`));

} catch (error) {
  if (error.code === 'ENOENT') {
    console.error(`❌ Configuration file not found: ${configPath}`);
  } else if (error instanceof SyntaxError) {
    console.error(`❌ Invalid JSON in configuration file: ${error.message}`);
  } else {
    console.error(`❌ Validation error: ${error.message}`);
  }
  process.exit(1);
}
