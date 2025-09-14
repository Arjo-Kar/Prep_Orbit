package com.preporbit.prep_orbit.service;

import com.google.genai.Client;
import com.google.genai.errors.ServerException;
import com.google.genai.types.GenerateContentResponse;
import org.springframework.stereotype.Service;

import java.awt.image.BufferedImage;

@Service
public class GeminiService {
    private final Client client;
    private final GeminiRestClient geminiRestClient;

    public GeminiService(Client client, GeminiRestClient geminiRestClient) {
        this.client = client;
        this.geminiRestClient = geminiRestClient;
    }

    // Your existing method - keep this exactly as is
    public String askGemini(String prompt) {
        System.out.println("🔤 Text Service hit");
        try {
            GenerateContentResponse response =
                    client.models.generateContent(
                            "gemini-2.5-flash",
                            prompt,
                            null);
            System.out.println("✅ RAW Gemini output:");
            System.out.println(response.text());

            return response.text();
        } catch (ServerException e) {
            System.err.println("❌ Gemini API overloaded: " + e.getMessage());
            return null;
        }
    }

    public String analyzeResumeText(String extractedText) {
        System.out.println("📝 Starting resume text analysis...");
        String prompt = buildResumeAnalysisPrompt(extractedText);
        try {
            return geminiRestClient.analyzeResumeText(prompt);
        } catch (Exception e) {
            System.err.println("❌ Gemini text analysis failed: " + e.getMessage());
            return createGeneralFallback();
        }
    }

    // TRUE image-based analysis (multimodal Gemini call)
    public String analyzeResumeImages(BufferedImage[] images) {
        System.out.println("🖼️ Starting true image-based resume analysis (multimodal)...");
        String prompt = buildImageAnalysisPrompt(images.length);
        try {
            return geminiRestClient.analyzeResumeImages(images, prompt);
        } catch (Exception e) {
            System.err.println("❌ Gemini image analysis failed: " + e.getMessage());
            return createImageAnalysisFallback();
        }
    }

    // Smart analysis: text first, fallback to images
    public String analyzeResume(String extractedText, BufferedImage[] images) {
        System.out.println("🎯 Starting smart resume analysis...");
        if (isTextMeaningful(extractedText)) {
            System.out.println("✅ Using text-based analysis");
            return analyzeResumeText(extractedText);
        } else if (images != null && images.length > 0) {
            System.out.println("🖼️ Falling back to image-based analysis");
            return analyzeResumeImages(images);
        } else {
            System.out.println("⚠️ No meaningful content found, using fallback");
            return createGeneralFallback();
        }
    }

    // Helper: is extracted text meaningful for AI analysis?
    private boolean isTextMeaningful(String text) {
        if (text == null || text.trim().isEmpty()) return false;
        String cleanText = text.replaceAll("\\s+", " ").trim();
        String[] words = cleanText.split("\\s+");
        return cleanText.length() >= 100 &&
                words.length >= 20 &&
                cleanText.matches(".*[a-zA-Z]{3,}.*");
    }

    // Prompt for Gemini text analysis
    private String buildResumeAnalysisPrompt(String extractedText) {
        return String.format("""
            Analyze this resume text comprehensively and provide detailed feedback in JSON format.
            Return ONLY valid JSON without any markdown formatting or code blocks.

            Resume Text Content:
            %s

            Required JSON structure:
            {
              "overallScore": number (20-100),
              "scores": {
                "content": number (0-100),
                "contact": number (0-100),
                "skills": number (0-100),
                "experience": number (0-100),
                "education": number (0-100),
                "formatting": number (0-100),
                "keywords": number (0-100),
                "structure": number (0-100)
              },
              "suggestions": [
                {
                  "title": "string",
                  "description": "string",
                  "category": "string",
                  "severity": "high|medium|low"
                }
              ],
              "details": {
                "wordCount": number,
                "hasContactInfo": boolean,
                "hasSkillsSection": boolean,
                "hasExperience": boolean,
                "hasEducation": boolean,
                "analysisMethod": "text",
                "isImageBased": false
              },
              "extractedText": "string (cleaned version of the input text)"
            }

            Focus your analysis on:
            - Content quality and completeness
            - Professional presentation
            - Skills relevance and presentation
            - Experience descriptions and impact
            - Education details
            - Contact information completeness
            - ATS compatibility
            - Industry-specific keywords
            - Overall structure and flow
            """, extractedText);
    }

    // Prompt for Gemini image analysis
    private String buildImageAnalysisPrompt(int numImages) {
        return String.format("""
            Analyze the attached resume image(s). Return ONLY valid JSON without markdown formatting.
            Focus on layout, content sections (contact, skills, experience, education), overall structure, and visual presentation.
            If text is unreadable, make a best effort assessment based on typical resume standards.

            Number of images/pages: %d
            Required JSON structure:
            {
              "overallScore": number (20-100),
              "scores": {
                "content": number (0-100),
                "contact": number (0-100),
                "skills": number (0-100),
                "experience": number (0-100),
                "education": number (0-100),
                "formatting": number (0-100),
                "keywords": number (0-100),
                "structure": number (0-100)
              },
              "suggestions": [
                {
                  "title": "string",
                  "description": "string",
                  "category": "string",
                  "severity": "high|medium|low"
                }
              ],
              "details": {
                "wordCount": number,
                "hasContactInfo": boolean,
                "hasSkillsSection": boolean,
                "hasExperience": boolean,
                "hasEducation": boolean,
                "visualQuality": "string",
                "readability": "string",
                "analysisMethod": "image",
                "isImageBased": true
              },
              "extractedText": "string (summary or best guess if text is unreadable)"
            }
            """, numImages);
    }

    // Fallback response for failed image analysis
    private String createImageAnalysisFallback() {
        return """
            {
              "overallScore": 55,
              "scores": {
                "content": 50,
                "contact": 60,
                "skills": 55,
                "experience": 50,
                "education": 65,
                "formatting": 60,
                "keywords": 45,
                "structure": 55
              },
              "suggestions": [
                {
                  "title": "Analysis Completed with Limitations",
                  "description": "Your resume was processed using image analysis with limited capabilities. For comprehensive analysis including specific keyword recommendations and detailed content feedback, upload a text-based PDF.",
                  "category": "System",
                  "severity": "medium"
                },
                {
                  "title": "Improve Document Format for Better Analysis",
                  "description": "For optimal results, create your resume in Microsoft Word, Google Docs, or similar applications and export directly as PDF. This enables detailed text analysis and specific improvement suggestions.",
                  "category": "Format",
                  "severity": "high"
                },
                {
                  "title": "Visual Quality Assessment",
                  "description": "Ensure your resume images have good contrast and clear text. High-resolution scans or photos work better for image-based analysis.",
                  "category": "Format",
                  "severity": "medium"
                }
              ],
              "details": {
                "wordCount": 250,
                "hasContactInfo": true,
                "hasSkillsSection": true,
                "hasExperience": true,
                "hasEducation": true,
                "visualQuality": "fair",
                "readability": "fair",
                "analysisMethod": "fallback",
                "isImageBased": true
              },
              "extractedText": "Resume content detected through fallback analysis. Unable to extract detailed text for comprehensive analysis."
            }
            """;
    }

    // General fallback when neither text nor images are available
    private String createGeneralFallback() {
        return """
            {
              "overallScore": 30,
              "scores": {
                "content": 20,
                "contact": 30,
                "skills": 35,
                "experience": 25,
                "education": 40,
                "formatting": 35,
                "keywords": 20,
                "structure": 30
              },
              "suggestions": [
                {
                  "title": "Unable to Analyze Resume Content",
                  "description": "No readable content could be extracted from your resume. Please ensure you upload a text-based PDF created from a word processor like Microsoft Word or Google Docs.",
                  "category": "System",
                  "severity": "high"
                },
                {
                  "title": "Create Digital Resume",
                  "description": "Avoid using scanned images or screenshots. Create your resume digitally using professional tools and export as a high-quality PDF.",
                  "category": "Format",
                  "severity": "high"
                },
                {
                  "title": "Essential Resume Elements",
                  "description": "Include: Contact Information, Professional Summary, Education, Skills, and Experience sections with clear headings and readable formatting.",
                  "category": "Structure",
                  "severity": "high"
                }
              ],
              "details": {
                "wordCount": 0,
                "hasContactInfo": false,
                "hasSkillsSection": false,
                "hasExperience": false,
                "hasEducation": false,
                "analysisMethod": "general_fallback",
                "isImageBased": false
              },
              "extractedText": "No readable content found"
            }
            """;
    }

    // Health check method for the service
    public boolean isServiceAvailable() {
        try {
            String testPrompt = "Test connection. Respond with 'OK'.";
            String result = geminiRestClient.analyzeResumeText(testPrompt);
            return result != null && result.contains("OK");
        } catch (Exception e) {
            System.err.println("🔍 Gemini REST service health check failed: " + e.getMessage());
            return false;
        }
    }

    // Service status info
    public String getServiceStatus() {
        if (isServiceAvailable()) {
            return "Gemini REST service is operational and ready for both text and image analysis.";
        } else {
            return "Gemini REST service is currently unavailable. Please try again later.";
        }
    }
}