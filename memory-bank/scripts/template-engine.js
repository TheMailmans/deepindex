/**
 * Template Engine for DevContext Memory Bank
 * Renders Mustache-style templates with variable substitution
 */

import { readFileSync } from 'fs';

export class TemplateEngine {
  /**
   * Render a template with variables
   * @param {string} templatePath - Path to .template file
   * @param {Object} variables - Key-value pairs to replace in template
   * @returns {string} Rendered content
   */
  static render(templatePath, variables) {
    const template = readFileSync(templatePath, 'utf-8');

    let rendered = template;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      rendered = rendered.replace(placeholder, value || '');
    }

    return rendered;
  }

  /**
   * Render template with array loops
   * Supports {{#items}}...{{/items}} syntax for repeating sections
   * @param {string} templatePath
   * @param {Object} variables - Global variables
   * @param {string} loopSection - Section name to repeat
   * @param {Array} items - Array of objects with variables for each iteration
   * @returns {string}
   */
  static renderLoop(templatePath, variables, loopSection, items) {
    const template = readFileSync(templatePath, 'utf-8');

    // Extract and process loop section
    const loopRegex = new RegExp(
      `{{#${loopSection}}}([\\s\\S]*?){{/${loopSection}}}`,
      'g'
    );

    let rendered = template.replace(loopRegex, (match, loopTemplate) => {
      return items.map(item => {
        let itemRendered = loopTemplate;
        for (const [key, value] of Object.entries(item)) {
          itemRendered = itemRendered.replace(
            new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
            value || ''
          );
        }
        return itemRendered;
      }).join('');
    });

    // Replace global variables
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
        value || ''
      );
    }

    return rendered;
  }
}
