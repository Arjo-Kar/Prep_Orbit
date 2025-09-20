package com.preporbit.prep_orbit.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.PDFTextStripperByArea;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.rendering.ImageType;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

public class PdfExtractionUtil {

    public static class ExtractionResult {
        public String text;
        public List<BufferedImage> images = new ArrayList<>();
        public boolean suspectedOutlinedFonts;
    }

    public static ExtractionResult extract(InputStream in, int maxPages, boolean produceImages) throws Exception {
        ExtractionResult result = new ExtractionResult();

        try (PDDocument doc = PDDocument.load(in)) {

            int total = doc.getNumberOfPages();
            int limit = Math.min(total, maxPages);

            // Pass 1: standard
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String primary = stripper.getText(doc);

            if (primary != null && primary.trim().length() >= 40) {
                result.text = primary.trim();
            } else {
                // Pass 2: page by page accumulate
                StringBuilder sb = new StringBuilder();
                for (int i = 1; i <= limit; i++) {
                    stripper.setStartPage(i);
                    stripper.setEndPage(i);
                    String pt = stripper.getText(doc);
                    if (pt != null && !pt.isBlank()) sb.append(pt).append("\n");
                }
                if (sb.toString().trim().length() >= 40) {
                    result.text = sb.toString().trim();
                }
            }

            // Pass 3: region scan (very rough) if still empty
            if (result.text == null || result.text.length() < 40) {
                PDFTextStripperByArea areaStripper = new PDFTextStripperByArea();
                // Add a few broad regions
                areaStripper.addRegion("upper", new Rectangle(0, 0, 2000, 1400));
                areaStripper.addRegion("lower", new Rectangle(0, 1400, 2000, 2000));
                for (int i = 0; i < limit && (result.text == null || result.text.length() < 40); i++) {
                    var page = doc.getPage(i);
                    areaStripper.extractRegions(page);
                    String u = areaStripper.getTextForRegion("upper");
                    String l = areaStripper.getTextForRegion("lower");
                    String combined = (u == null ? "" : u) + "\n" + (l == null ? "" : l);
                    if (combined.trim().length() > 40) {
                        result.text = combined.trim();
                        break;
                    }
                }
            }

            // Prepare images (for OCR or image analysis)
            if (produceImages) {
                PDFRenderer renderer = new PDFRenderer(doc);
                for (int i = 0; i < limit; i++) {
                    BufferedImage img = renderer.renderImageWithDPI(i, 200, ImageType.RGB);
                    result.images.add(img);
                }
            }

            // Heuristic: if no text but we rendered pages → maybe outlined fonts/scanned
            if ((result.text == null || result.text.isBlank()) && !result.images.isEmpty()) {
                result.suspectedOutlinedFonts = true;
            }
        }
        return result;
    }
}