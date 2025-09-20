// API service for coding challenges
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

class CodingChallengeAPI {
  // Get today's daily challenge (cached per user per day)
  static async getDailyChallenge(authToken) {
    try {
      if (!authToken) {
        throw new Error('Authentication token is required to get daily challenge.');
      }

      const response = await fetch(`${API_BASE_URL}/api/ai-coding/daily-challenge`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch daily challenge: ${errorText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch daily challenge');
      }

      return data.challenge;
    } catch (error) {
      console.error('Error fetching daily challenge:', error);
      throw error;
    }
  }

  // Generate a new coding challenge using AI
  static async generateChallenge(topics = ['arrays', 'algorithms'], difficulty = 'medium', authToken) {
    try {
      if (!authToken) {
        throw new Error('Authentication token is required to generate a challenge.');
      }

      const response = await fetch(`${API_BASE_URL}/api/ai-coding/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          topics,
          difficulty
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate challenge: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating challenge:', error);
      throw error;
    }
  }

  // Fetch an existing challenge by ID
  static async getChallenge(challengeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/coding/challenge/${challengeId}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch challenge: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching challenge:', error);
      throw error;
    }
  }

  // Submit a solution for evaluation
  static async submitSolution(challengeId, submission, authToken) {
    try {
      if (!authToken) {
        throw new Error('Authentication token is required to submit a solution.');
      }

      const response = await fetch(`${API_BASE_URL}/api/coding/challenge/${challengeId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(submission)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to submit solution: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting solution:', error);
      throw error;
    }
  }

  // Get available programming languages and their Judge0 IDs
  static getLanguageConfigs() {
    return {
      java: {
        id: 62,
        name: 'Java (OpenJDK 13.0.1)',
        template: `import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        // Write your solution here

    }
}`
      },
      python: {
        id: 71,
        name: 'Python (3.8.1)',
        template: `# Write your solution here
import sys

# Read input
# input_data = sys.stdin.read().strip()

`
      },
      cpp: {
        id: 54,
        name: 'C++ (GCC 9.2.0)',
        template: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Write your solution here

    return 0;
}`
      },
      javascript: {
        id: 63,
        name: 'JavaScript (Node.js 12.14.0)',
        template: `// Write your solution here
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (input) => {
    // Process input here

});`
      },
      c: {
        id: 50,
        name: 'C (GCC 9.2.0)',
        template: `#include <stdio.h>
#include <stdlib.h>

int main() {
    // Write your solution here

    return 0;
}`
      }
    };
  }

  // Get difficulty levels
  static getDifficultyLevels() {
    return ['easy', 'medium', 'hard'];
  }

  // Get common coding topics
  static getTopics() {
    return [
      'arrays',
      'strings',
      'linked-lists',
      'trees',
      'graphs',
      'dynamic-programming',
      'recursion',
      'sorting',
      'searching',
      'hash-tables',
      'stacks',
      'queues',
      'math',
      'greedy',
      'backtracking',
      'two-pointers',
      'sliding-window',
      'binary-search'
    ];
  }
}

export default CodingChallengeAPI;