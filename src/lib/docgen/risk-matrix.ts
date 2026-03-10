import type { RiskMatrixEntry } from './types';

export interface RiskScore {
  score: number;
  rating: string;
  color: string;
}

export function calculateRiskScore5x5(
  likelihood: number,
  severity: number
): RiskScore {
  const score = likelihood * severity;

  let rating: string;
  let color: string;

  if (score >= 1 && score <= 4) {
    rating = 'Very Low';
    color = '27AE60';
  } else if (score >= 5 && score <= 8) {
    rating = 'Low';
    color = '7ED321';
  } else if (score >= 9 && score <= 12) {
    rating = 'Medium';
    color = 'F5A623';
  } else if (score >= 15 && score <= 19) {
    rating = 'High';
    color = 'E74C3C';
  } else {
    rating = 'Very High';
    color = 'C0392B';
  }

  return { score, rating, color };
}

export function calculateRiskScore3x3(
  likelihood: number,
  severity: number
): RiskScore {
  const score = likelihood * severity;

  let rating: string;
  let color: string;

  if (score >= 1 && score <= 3) {
    rating = 'Low';
    color = '7ED321';
  } else if (score >= 4 && score <= 6) {
    rating = 'Medium';
    color = 'F5A623';
  } else {
    rating = 'High';
    color = 'E74C3C';
  }

  return { score, rating, color };
}

export function calculateRiskScoreHML(level: string): Omit<RiskScore, 'score'> {
  const normalized = level.toLowerCase().trim();

  if (normalized === 'low' || normalized === 'l') {
    return {
      rating: 'Low',
      color: '7ED321',
    };
  } else if (normalized === 'medium' || normalized === 'm') {
    return {
      rating: 'Medium',
      color: 'F5A623',
    };
  } else if (normalized === 'high' || normalized === 'h') {
    return {
      rating: 'High',
      color: 'E74C3C',
    };
  }

  return {
    rating: 'Unknown',
    color: 'E0E0E0',
  };
}

export function getRiskMatrixTable5x5(): RiskMatrixEntry[] {
  const matrix: RiskMatrixEntry[] = [];
  const levels = [1, 2, 3, 4, 5];
  const riskColors: Record<string, string> = {
    'Very Low': '27AE60',
    Low: '7ED321',
    Medium: 'F5A623',
    High: 'E74C3C',
    'Very High': 'C0392B',
  };

  for (const likelihood of levels) {
    for (const severity of levels) {
      const score = likelihood * severity;
      let rating: string;

      if (score >= 1 && score <= 4) {
        rating = 'Very Low';
      } else if (score >= 5 && score <= 8) {
        rating = 'Low';
      } else if (score >= 9 && score <= 12) {
        rating = 'Medium';
      } else if (score >= 15 && score <= 19) {
        rating = 'High';
      } else {
        rating = 'Very High';
      }

      matrix.push({
        likelihood,
        severity,
        rating,
        color: riskColors[rating],
      });
    }
  }

  return matrix;
}

export function getRiskMatrixTable3x3(): RiskMatrixEntry[] {
  const matrix: RiskMatrixEntry[] = [];
  const levels = [1, 2, 3];
  const riskColors: Record<string, string> = {
    Low: '7ED321',
    Medium: 'F5A623',
    High: 'E74C3C',
  };

  for (const likelihood of levels) {
    for (const severity of levels) {
      const score = likelihood * severity;
      let rating: string;

      if (score >= 1 && score <= 3) {
        rating = 'Low';
      } else if (score >= 4 && score <= 6) {
        rating = 'Medium';
      } else {
        rating = 'High';
      }

      matrix.push({
        likelihood,
        severity,
        rating,
        color: riskColors[rating],
      });
    }
  }

  return matrix;
}

export function generateRiskMatrix5x5Visual(): Record<number, Record<number, { rating: string; color: string }>> {
  const matrix: Record<number, Record<number, { rating: string; color: string }>> = {};
  const severityLevels = [5, 4, 3, 2, 1];
  const likelihoodLevels = [1, 2, 3, 4, 5];

  const riskLookup: Record<number, string> = {
    1: 'Very Low',
    2: 'Very Low',
    3: 'Low',
    4: 'Low',
    5: 'Low',
    6: 'Low',
    8: 'Low',
    9: 'Medium',
    10: 'Medium',
    12: 'Medium',
    15: 'High',
    16: 'High',
    20: 'Very High',
    25: 'Very High',
  };

  const colorLookup: Record<string, string> = {
    'Very Low': '27AE60',
    Low: '7ED321',
    Medium: 'F5A623',
    High: 'E74C3C',
    'Very High': 'C0392B',
  };

  for (const severity of severityLevels) {
    matrix[severity] = {};
    for (const likelihood of likelihoodLevels) {
      const score = likelihood * severity;
      const ratingLookupScore = Math.min(score, 25);
      const rating = riskLookup[ratingLookupScore] || 'Unknown';
      matrix[severity][likelihood] = {
        rating,
        color: colorLookup[rating] || 'E0E0E0',
      };
    }
  }

  return matrix;
}

export function generateRiskMatrix3x3Visual(): Record<number, Record<number, { rating: string; color: string }>> {
  const matrix: Record<number, Record<number, { rating: string; color: string }>> = {};
  const severityLevels = [3, 2, 1];
  const likelihoodLevels = [1, 2, 3];

  const colorLookup: Record<string, string> = {
    Low: '7ED321',
    Medium: 'F5A623',
    High: 'E74C3C',
  };

  for (const severity of severityLevels) {
    matrix[severity] = {};
    for (const likelihood of likelihoodLevels) {
      const score = likelihood * severity;
      let rating: string;

      if (score <= 3) {
        rating = 'Low';
      } else if (score <= 6) {
        rating = 'Medium';
      } else {
        rating = 'High';
      }

      matrix[severity][likelihood] = {
        rating,
        color: colorLookup[rating],
      };
    }
  }

  return matrix;
}
