// Thematic clustering service for story content

export interface StoryCluster {
  id: string;
  theme: string;
  keywords: string[];
  storyIds: string[];
  createdAt: Date;
  updatedAt: Date;
  confidence: number;
}

export interface ClusteredStory {
  id: string;
  text: string;
  clusterId?: string;
  district?: string;
  role?: string;
  createdAt: Date;
}

// Alberta education-specific themes and keywords
const ALBERTA_EDUCATION_THEMES = {
  workload: {
    keywords: ['workload', 'hours', 'overtime', 'burnout', 'exhaustion', 'tired', 'stress', 'overwhelmed', 'too much', 'paperwork', 'administrative'],
    weight: 1.2,
  },
  classSize: {
    keywords: ['class size', 'large class', 'too many students', 'overcrowded', 'crowded', 'student ratio', 'pupil teacher ratio'],
    weight: 1.3,
  },
  resources: {
    keywords: ['resources', 'supplies', 'materials', 'equipment', 'technology', 'books', 'funding', 'budget', 'lack of'],
    weight: 1.1,
  },
  support: {
    keywords: ['support', 'help', 'assistance', 'administration', 'leadership', 'colleagues', 'team', 'isolated', 'alone'],
    weight: 1.0,
  },
  compensation: {
    keywords: ['pay', 'salary', 'wage', 'compensation', 'money', 'income', 'raise', 'bonus', 'benefits'],
    weight: 1.2,
  },
  studentBehavior: {
    keywords: ['behavior', 'discipline', 'challenging', 'difficult', 'violence', 'safety', 'threat', 'aggressive'],
    weight: 1.4,
  },
  workLifeBalance: {
    keywords: ['balance', 'family', 'home', 'personal time', 'vacation', 'break', 'rest', 'weekend', 'evenings'],
    weight: 1.0,
  },
  professionalDevelopment: {
    keywords: ['training', 'professional development', 'pd', 'learning', 'growth', 'skills', 'certification', 'workshop'],
    weight: 0.9,
  },
  morale: {
    keywords: ['morale', 'motivation', 'spirit', 'enthusiasm', 'passion', 'burned out', 'disheartened', 'disappointed'],
    weight: 1.1,
  },
  covid: {
    keywords: ['covid', 'pandemic', 'remote', 'online', 'virtual', 'hybrid', 'distance learning', 'health', 'safety'],
    weight: 1.0,
  },
};

// Common Alberta-specific terms
const ALBERTA_SPECIFIC_TERMS = [
  'alberta', 'calgary', 'edmonton', 'red deer', 'lethbridge', 'medicine hat',
  'fort mcmurray', 'grand prairie', 'banff', 'jasper', 'uofa', 'ualberta',
  'calgary board', 'edmonton public', 'cbe', 'epsb', 'rocky view', 'sturgeon',
  'parkland', 'black gold', 'wetaskiwin', 'ponoka', 'innisfail', 'airdrie',
  'spruce grove', 'leduc', 'camrose', 'sylvan lake', 'cochrane', 'okotoks',
];

export class StoryClusteringService {
  private themes: typeof ALBERTA_EDUCATION_THEMES;

  constructor() {
    this.themes = ALBERTA_EDUCATION_THEMES;
  }

  // Calculate similarity between text and theme
  private calculateThemeSimilarity(text: string, theme: typeof ALBERTA_EDUCATION_THEMES[keyof typeof ALBERTA_EDUCATION_THEMES]): number {
    const lowerText = text.toLowerCase();
    let matches = 0;
    let totalWeight = 0;

    for (const keyword of theme.keywords) {
      const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (keywordRegex.test(lowerText)) {
        matches++;
        totalWeight += theme.weight;
      }
    }

    // Also check for partial matches (e.g., 'workloads' matches 'workload')
    for (const keyword of theme.keywords) {
      if (lowerText.includes(keyword)) {
        matches += 0.5; // Partial match gets half credit
        totalWeight += theme.weight * 0.5;
      }
    }

    // Normalize by the number of keywords in the theme
    const maxPossibleScore = theme.keywords.length * theme.weight;
    return maxPossibleScore > 0 ? totalWeight / maxPossibleScore : 0;
  }

  // Extract key phrases from text
  private extractKeyPhrases(text: string): string[] {
    const phrases: string[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length > 10 && trimmed.length < 200) {
        phrases.push(trimmed);
      }
    }
    
    return phrases;
  }

  // Check for Alberta-specific context
  private isAlbertaSpecific(text: string): boolean {
    const lowerText = text.toLowerCase();
    return ALBERTA_SPECIFIC_TERMS.some(term => lowerText.includes(term));
  }

  // Cluster a single story
  public clusterStory(story: { id: string; text: string; district?: string; role?: string }): {
    primaryTheme: string;
    similarity: number;
    keyPhrases: string[];
    isAlbertaSpecific: boolean;
  } {
    let bestTheme = 'general';
    let bestSimilarity = 0;
    const themeScores: Record<string, number> = {};

    // Calculate similarity for each theme
    for (const [themeName, theme] of Object.entries(this.themes)) {
      const similarity = this.calculateThemeSimilarity(story.text, theme);
      themeScores[themeName] = similarity;
      
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestTheme = themeName;
      }
    }

    // If no strong theme match, check if it's Alberta-specific
    const albertaSpecific = this.isAlbertaSpecific(story.text);
    if (bestSimilarity < 0.3 && albertaSpecific) {
      bestTheme = 'alberta_context';
      bestSimilarity = 0.4;
    }

    return {
      primaryTheme: bestTheme,
      similarity: bestSimilarity,
      keyPhrases: this.extractKeyPhrases(story.text),
      isAlbertaSpecific: albertaSpecific,
    };
  }

  // Batch cluster multiple stories
  public clusterStories(stories: Array<{ id: string; text: string; district?: string; role?: string }>): Map<string, StoryCluster> {
    const clusters = new Map<string, StoryCluster>();
    const storyAssignments = new Map<string, string>();

    // First pass: cluster each story
    for (const story of stories) {
      const result = this.clusterStory(story);
      
      if (!clusters.has(result.primaryTheme)) {
        clusters.set(result.primaryTheme, {
          id: result.primaryTheme,
          theme: result.primaryTheme,
          keywords: this.themes[result.primaryTheme as keyof typeof ALBERTA_EDUCATION_THEMES]?.keywords || [],
          storyIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          confidence: result.similarity,
        });
      }

      const cluster = clusters.get(result.primaryTheme)!;
      cluster.storyIds.push(story.id);
      cluster.updatedAt = new Date();
      cluster.confidence = (cluster.confidence + result.similarity) / 2;
      
      storyAssignments.set(story.id, result.primaryTheme);
    }

    return clusters;
  }

  // Generate theme summary from clustered stories
  public generateThemeSummary(clusters: Map<string, StoryCluster>): Array<{
    theme: string;
    count: number;
    avgConfidence: number;
    samplePhrases: string[];
    albertaSpecific: boolean;
  }> {
    const summaries = [];

    for (const [themeName, cluster] of clusters) {
      const themeConfig = this.themes[themeName as keyof typeof ALBERTA_EDUCATION_THEMES];
      
      summaries.push({
        theme: themeName,
        count: cluster.storyIds.length,
        avgConfidence: cluster.confidence,
        samplePhrases: themeConfig?.keywords.slice(0, 5) || [],
        albertaSpecific: themeName === 'alberta_context',
      });
    }

    // Sort by count (popularity) and then by confidence
    return summaries.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.avgConfidence - a.avgConfidence;
    });
  }

  // Find similar stories to a given story
  public findSimilarStories(targetStory: { id: string; text: string }, allStories: Array<{ id: string; text: string }>, threshold = 0.5): Array<{ storyId: string; similarity: number }> {
    const targetResult = this.clusterStory(targetStory);
    const similarities: Array<{ storyId: string; similarity: number }> = [];

    for (const story of allStories) {
      if (story.id === targetStory.id) continue;

      const result = this.clusterStory(story);
      
      // If same primary theme, calculate additional similarity
      if (result.primaryTheme === targetResult.primaryTheme) {
        const themeSimilarity = 1 - Math.abs(result.similarity - targetResult.similarity);
        const overallSimilarity = (result.similarity + themeSimilarity) / 2;
        
        if (overallSimilarity >= threshold) {
          similarities.push({
            storyId: story.id,
            similarity: overallSimilarity,
          });
        }
      }
    }

    return similarities.sort((a, b) => b.similarity - a.similarity);
  }
}

// Singleton instance
export const storyClusteringService = new StoryClusteringService();

// Batch processing helper
export async function processStoryBatch(stories: Array<{ id: string; text: string; district?: string; role?: string }>) {
  const clusters = storyClusteringService.clusterStories(stories);
  const summary = storyClusteringService.generateThemeSummary(clusters);
  
  return {
    clusters: Array.from(clusters.values()),
    summary,
    totalStories: stories.length,
    uniqueThemes: clusters.size,
  };
}

// Real-time clustering for new story
export function clusterNewStory(story: { id: string; text: string; district?: string; role?: string }) {
  return storyClusteringService.clusterStory(story);
}

// Export themes for use in other parts of the application
export { ALBERTA_EDUCATION_THEMES };
export type { StoryCluster, ClusteredStory };