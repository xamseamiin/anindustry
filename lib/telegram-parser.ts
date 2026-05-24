/**
 * Telegram Message Parser
 * Parses natural language expense messages from Telegram
 */

interface ParsedExpense {
  projectName?: string;
  amount?: number;
  category?: string;
  description?: string;
  accountNumber?: string;
  employeeName?: string;
  confidence: number; // 0-1, how confident we are in the parsing
}

// Category mappings (Somali to system categories)
const CATEGORY_MAPPINGS: { [key: string]: string } = {
  'labor': 'Labor',
  'shaqaale': 'Labor',
  'shaqaale mashruuc': 'Labor',
  'shaqaale shirkad': 'Company Labor',
  'material': 'Material',
  'alaab': 'Material',
  'transport': 'Transport',
  'gaadiid': 'Transport',
  'taxi': 'Taxi/Xamaal',
  'xamaal': 'Taxi/Xamaal',
  'consultancy': 'Consultancy',
  'talo': 'Consultancy',
  'equipment': 'Equipment Rental',
  'qalab': 'Equipment Rental',
  'utilities': 'Utilities',
  'adeeg': 'Utilities',
};

// Common project name patterns
const PROJECT_PATTERNS = [
  /^([a-z]+(?:\s+[a-z]+)*)\s+site/i,
  /^([a-z]+(?:\s+[a-z]+)*)\s+project/i,
  /^([a-z]+(?:\s+[a-z]+)*)\s+mashruuc/i,
];

export class TelegramParser {
  /**
   * Parse natural language expense message
   */
  static parse(message: string): ParsedExpense {
    const trimmed = message.trim();
    const lines = trimmed.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Try different parsing strategies
    let result = this.parseMultiLine(lines);
    if (result.confidence < 0.7) {
      result = this.parseSingleLine(trimmed);
    }
    
    return result;
  }

  /**
   * Parse multi-line format:
   * project name
   * amount
   * category
   * description
   */
  private static parseMultiLine(lines: string[]): ParsedExpense {
    const result: ParsedExpense = { confidence: 0 };
    let confidence = 0.5;

    // Line 1: Project name
    if (lines.length > 0) {
      result.projectName = lines[0];
      confidence += 0.2;
    }

    // Line 2: Amount (should be a number)
    if (lines.length > 1) {
      const amountMatch = lines[1].match(/(\d+(?:\.\d+)?)/);
      if (amountMatch) {
        result.amount = parseFloat(amountMatch[1]);
        confidence += 0.3;
      }
    }

    // Line 3: Category
    if (lines.length > 2) {
      const category = this.mapCategory(lines[2].toLowerCase());
      if (category) {
        result.category = category;
        confidence += 0.2;
      }
    }

    // Line 4+: Description (everything else)
    if (lines.length > 3) {
      result.description = lines.slice(3).join(' ');
      confidence += 0.1;
    }

    result.confidence = Math.min(confidence, 1.0);
    return result;
  }

  /**
   * Parse single-line format:
   * "mohamed site 5000 labor wuxuu ka shaqeeyay albaabka birta"
   */
  private static parseSingleLine(text: string): ParsedExpense {
    const result: ParsedExpense = { confidence: 0 };
    let confidence = 0.3;

    // Extract amount (numbers)
    const amountMatch = text.match(/(\d+(?:\.\d+)?)/);
    if (amountMatch) {
      result.amount = parseFloat(amountMatch[1]);
      confidence += 0.3;
    }

    // Extract project name (usually at the start, before amount)
    if (amountMatch && amountMatch.index !== undefined) {
      const beforeAmount = text.substring(0, amountMatch.index).trim();
      if (beforeAmount) {
        // Check for project patterns
        for (const pattern of PROJECT_PATTERNS) {
          const match = beforeAmount.match(pattern);
          if (match) {
            result.projectName = match[1];
            confidence += 0.2;
            break;
          }
        }
        // If no pattern match, use first words as project name
        if (!result.projectName) {
          const words = beforeAmount.split(/\s+/);
          if (words.length <= 3) {
            result.projectName = beforeAmount;
            confidence += 0.1;
          }
        }
      }
    }

    // Extract category (look for keywords)
    const lowerText = text.toLowerCase();
    for (const [keyword, category] of Object.entries(CATEGORY_MAPPINGS)) {
      if (lowerText.includes(keyword)) {
        result.category = category;
        confidence += 0.2;
        break;
      }
    }

    // Extract description (everything after amount and category)
    if (amountMatch && amountMatch.index !== undefined) {
      const afterAmount = text.substring(amountMatch.index + amountMatch[0].length).trim();
      // Remove category keywords from description
      let description = afterAmount;
      for (const keyword of Object.keys(CATEGORY_MAPPINGS)) {
        description = description.replace(new RegExp(keyword, 'gi'), '').trim();
      }
      if (description) {
        result.description = description;
        confidence += 0.1;
      }
    }

    result.confidence = Math.min(confidence, 1.0);
    return result;
  }

  /**
   * Map Somali/English category terms to system categories
   */
  private static mapCategory(term: string): string | null {
    const normalized = term.toLowerCase().trim();
    return CATEGORY_MAPPINGS[normalized] || null;
  }

  /**
   * Validate parsed expense data
   */
  static validate(parsed: ParsedExpense): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!parsed.amount || parsed.amount <= 0) {
      errors.push('Amount is required and must be positive');
    }

    if (!parsed.category) {
      errors.push('Category could not be determined');
    }

    if (!parsed.projectName) {
      errors.push('Project name could not be determined');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

