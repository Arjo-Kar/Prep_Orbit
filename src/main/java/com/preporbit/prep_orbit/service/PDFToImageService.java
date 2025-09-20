package com.preporbit.prep_orbit.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.rendering.ImageType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
public class PDFToImageService {

    public BufferedImage[] convertPDFToImages(MultipartFile file) throws IOException {
        System.out.println("🔄 Converting PDF to images for analysis...");

        try (InputStream inputStream = file.getInputStream();
             PDDocument document = PDDocument.load(inputStream)) {

            PDFRenderer renderer = new PDFRenderer(document);
            List<BufferedImage> images = new ArrayList<>();

            int totalPages = document.getNumberOfPages();
            int maxPages = Math.min(totalPages, 5); // Limit to first 5 pages for performance

            System.out.println("📄 Processing " + maxPages + " pages (total: " + totalPages + ")...");

            for (int pageIndex = 0; pageIndex < maxPages; pageIndex++) {
                try {
                    System.out.println("🖼️ Converting page " + (pageIndex + 1) + "/" + maxPages);

                    // Render at 200 DPI for good quality without being too large
                    BufferedImage image = renderer.renderImageWithDPI(pageIndex, 200, ImageType.RGB);
                    images.add(image);

                    System.out.println("✅ Page " + (pageIndex + 1) + " converted successfully (" +
                            image.getWidth() + "x" + image.getHeight() + ")");

                } catch (Exception e) {
                    System.err.println("❌ Error converting page " + (pageIndex + 1) + ": " + e.getMessage());
                    // Continue with other pages
                }
            }

            System.out.println("🎯 Successfully converted " + images.size() + " pages to images");
            return images.toArray(new BufferedImage[0]);

        } catch (Exception e) {
            System.err.println("💥 Error in PDF to image conversion: " + e.getMessage());
            throw new IOException("Failed to convert PDF to images: " + e.getMessage(), e);
        }
    }

    public boolean canConvertToImages(MultipartFile file) {
        try {
            convertPDFToImages(file);
            return true;
        } catch (Exception e) {
            System.err.println("❌ Cannot convert PDF to images: " + e.getMessage());
            return false;
        }
    }

    public int getImageCount(MultipartFile file) {
        try {
            BufferedImage[] images = convertPDFToImages(file);
            return images.length;
        } catch (Exception e) {
            return 0;
        }
    }
}