/**
 * Brief Generator
 * Creates project brief from configuration and metadata
 */

import { readFileSync } from 'fs';
import path from 'path';

export class BriefGenerator {
  constructor(config) {
    this.config = config;
  }

  /**
   * Generate project brief data from config
   */
  async generate() {
    const projectName = this.config.projectName;
    const projectType = this.config.projectType;
    const rootDir = this.config.rootDir;

    // Detect project metadata
    const metadata = this.detectProjectMetadata();

    // Format domains for template
    const domains = this.config.domains.map(domain => ({
      name: domain.name,
      description: domain.description,
      patterns: domain.patterns.join(', ')
    }));

    return {
      projectName,
      projectType,
      rootDir,
      description: metadata.description || 'No description available',
      version: metadata.version || 'Unknown',
      mainLanguage: metadata.language || projectType,
      domains,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
  }

  detectProjectMetadata() {
    const rootDir = this.config.rootDir;
    let metadata = {};

    try {
      // Rust project
      if (this.config.projectType === 'rust') {
        const cargoPath = path.join(rootDir, 'Cargo.toml');
        if (readFileSync(cargoPath, 'utf-8')) {
          const cargoContent = readFileSync(cargoPath, 'utf-8');
          const nameMatch = cargoContent.match(/name\s*=\s*"([^"]+)"/);
          const versionMatch = cargoContent.match(/version\s*=\s*"([^"]+)"/);
          const descMatch = cargoContent.match(/description\s*=\s*"([^"]+)"/);

          metadata.name = nameMatch ? nameMatch[1] : null;
          metadata.version = versionMatch ? versionMatch[1] : null;
          metadata.description = descMatch ? descMatch[1] : null;
          metadata.language = 'Rust';
        }
      }

      // Node.js project
      if (this.config.projectType === 'typescript' || this.config.projectType === 'javascript') {
        const pkgPath = path.join(rootDir, 'package.json');
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        metadata.name = pkg.name;
        metadata.version = pkg.version;
        metadata.description = pkg.description;
        metadata.language = 'TypeScript/JavaScript';
      }

      // Python project
      if (this.config.projectType === 'python') {
        metadata.language = 'Python';
        // Could parse setup.py or pyproject.toml here
      }
    } catch (error) {
      // Fallback to config values
    }

    return metadata;
  }
}
